import { NextResponse } from "next/server";
import { MODULE_SLUGS } from "@/config/modules";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { can } from "@/types/permissions";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import {
  mergeNestedFormFields,
  parseFluentFlatRow,
} from "@/lib/external/fluent-form-user";
import { resolveChapterIdForExternalWebhook } from "@/lib/external/resolve-webhook-chapter";
import { createLocalLeaderUserForChapter } from "@/lib/import/create-local-leader-user";
import type { FlatRow } from "@/lib/import/bulk-import";
import { pickChapterName } from "@/lib/import/bulk-import";
import { findOrCreateChapterByImportRow } from "@/lib/import/chapter-import";
import {
  mailingForUserMetadata,
  userMailingAddressFromImportRow,
} from "@/lib/import/user-mailing-address";
import { validateImportIdentity } from "@/lib/import/validate-import-identity";

type SyncBody = {
  fromDate: string;
  toDate: string;
  syncChapters?: boolean;
  syncLeaders?: boolean;
  syncMembers?: boolean;
};

type SyncEvent = {
  level: "info" | "ok" | "warn" | "error";
  message: string;
};

type FluentEntry = Record<string, unknown>;

const DEFAULT_FORM_IDS = {
  chapters: Number(process.env.FLUENT_FORM_SYNC_CHAPTERS_FORM_ID || 4),
  leaders: Number(process.env.FLUENT_FORM_SYNC_LEADERS_FORM_ID || 4),
  members: Number(process.env.FLUENT_FORM_SYNC_MEMBERS_FORM_ID || 1),
};

function safeDate(input: string, endOfDay = false): Date | null {
  const v = input?.trim();
  if (!v) return null;
  const iso = endOfDay ? `${v}T23:59:59.999Z` : `${v}T00:00:00.000Z`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function pickEntryCreatedAt(entry: FluentEntry): Date | null {
  const raw =
    (entry.created_at as string | undefined) ||
    (entry.createdAt as string | undefined) ||
    (entry.submitted_at as string | undefined) ||
    (entry.date_created as string | undefined);
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toFlatEntry(entry: FluentEntry): FlatRow {
  const nested =
    entry.response ??
    entry.data ??
    entry.fields ??
    entry.entry ??
    entry.submitted_data ??
    {};
  let parsed: Record<string, unknown> = {};
  if (typeof nested === "string") {
    try {
      parsed = JSON.parse(nested) as Record<string, unknown>;
    } catch {
      parsed = {};
    }
  } else if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    parsed = nested as Record<string, unknown>;
  }
  return mergeNestedFormFields({
    ...entry,
    ...parsed,
  });
}

function extractEntries(payload: unknown): FluentEntry[] {
  if (Array.isArray(payload)) return payload as FluentEntry[];
  if (!payload || typeof payload !== "object") return [];
  const p = payload as Record<string, unknown>;
  const keys = ["data", "entries", "results", "records"];
  for (const k of keys) {
    if (Array.isArray(p[k])) return p[k] as FluentEntry[];
    const nested = p[k];
    if (nested && typeof nested === "object" && Array.isArray((nested as Record<string, unknown>).data)) {
      return (nested as { data: FluentEntry[] }).data;
    }
  }
  return [];
}

async function fetchFormEntriesByDate(
  formId: number,
  fromDate: Date,
  toDate: Date
): Promise<FluentEntry[]> {
  const baseUrl = (process.env.FLUENT_FORM_SYNC_BASE_URL || "https://fparmychapters.com").replace(/\/$/, "");
  const token = process.env.FLUENT_FORM_SYNC_TOKEN?.trim() || "";
  const perPage = 200;
  const maxPages = 50;
  const out: FluentEntry[] = [];
  const endpointCandidates = [
    (page: number) =>
      `${baseUrl}/wp-json/fluentform/v1/submissions?form_id=${formId}&page=${page}&per_page=${perPage}&sort_by=created_at&sort_order=DESC`,
    (page: number) =>
      `${baseUrl}/wp-json/fluentform/v1/submissions/all?form_id=${formId}&page=${page}&per_page=${perPage}&sort_by=created_at&sort_order=DESC`,
    (page: number) =>
      `${baseUrl}/wp-json/fluentform/v1/forms/${formId}/entries?page=${page}&per_page=${perPage}&sort_by=created_at&sort_order=DESC`,
  ];

  for (let page = 1; page <= maxPages; page += 1) {
    let entries: FluentEntry[] = [];
    let matchedRoute = false;
    for (const buildUrl of endpointCandidates) {
      const url = buildUrl(page);
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: "no-store",
      });
      if (res.status === 404) continue;
      matchedRoute = true;
      if (!res.ok) {
        const authHint =
          res.status === 401
            ? token
              ? " Invalid or expired FLUENT_FORM_SYNC_TOKEN (Bearer must match what WordPress/Fluent REST accepts)."
              : " Missing FLUENT_FORM_SYNC_TOKEN: add it to .env so the sync can authenticate to wp-json/fluentform/v1."
            : "";
        throw new Error(`WordPress Fluent Forms returned ${res.status} for form ${formId}.${authHint}`);
      }
      const payload = (await res.json()) as unknown;
      entries = extractEntries(payload);
      break;
    }
    if (!matchedRoute) {
      throw new Error(
        `No Fluent Forms submissions route found for form ${formId}. Expected /fluentform/v1/submissions or equivalent.`
      );
    }
    if (!entries.length) break;

    let sawOlder = false;
    for (const entry of entries) {
      const createdAt = pickEntryCreatedAt(entry);
      if (!createdAt) continue;
      if (createdAt < fromDate) {
        sawOlder = true;
        continue;
      }
      if (createdAt > toDate) continue;
      out.push(entry);
    }

    if (entries.length < perPage || sawOlder) break;
  }
  return out;
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const permissions = await loadModulePermissions(supabase, user.id);
  if (!can(permissions, MODULE_SLUGS.community, "create")) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  let body: SyncBody;
  try {
    body = (await req.json()) as SyncBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const fromDate = safeDate(body.fromDate, false);
  const toDate = safeDate(body.toDate, true);
  if (!fromDate || !toDate || fromDate > toDate) {
    return NextResponse.json({ error: "Invalid date range." }, { status: 400 });
  }

  const syncChapters = body.syncChapters !== false;
  const syncLeaders = body.syncLeaders !== false;
  const syncMembers = body.syncMembers !== false;
  const admin = createAdminClient();
  const systemUserId = process.env.FLUENT_FORM_SYSTEM_USER_ID?.trim() || user.id;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (evt: SyncEvent) =>
        controller.enqueue(encoder.encode(`${JSON.stringify(evt)}\n`));

      void (async () => {
        try {
          send({ level: "info", message: `Sync window: ${body.fromDate} to ${body.toDate}` });

          let imported = 0;
          let omitted = 0;

          const tasks: Array<{ key: "chapters" | "leaders" | "members"; enabled: boolean; formId: number }> = [
            { key: "chapters", enabled: syncChapters, formId: DEFAULT_FORM_IDS.chapters },
            { key: "leaders", enabled: syncLeaders, formId: DEFAULT_FORM_IDS.leaders },
            { key: "members", enabled: syncMembers, formId: DEFAULT_FORM_IDS.members },
          ];

          const { data: roleRows } = await admin.from("roles").select("id,name").in("name", ["member", "local_leader"]);
          const leaderRoleId = (roleRows ?? []).find((r) => r.name === "local_leader")?.id ?? null;
          const memberRoleId = (roleRows ?? []).find((r) => r.name === "member")?.id ?? null;

          const { data: chaptersData } = await admin.from("chapters").select("name");
          const chapterNames = new Set((chaptersData ?? []).map((c) => String(c.name || "").trim().toLowerCase()).filter(Boolean));

          for (const task of tasks) {
            if (!task.enabled) continue;
            send({ level: "info", message: `Fetching form ${task.formId} entries for ${task.key}...` });
            const entries = await fetchFormEntriesByDate(task.formId, fromDate, toDate);
            send({ level: "info", message: `Found ${entries.length} records for ${task.key}.` });

            for (const entry of entries) {
              const flat = toFlatEntry(entry);
              const { email, password, firstName, lastName, phone, primaryChapterId } = parseFluentFlatRow(flat);
              const mailing = userMailingAddressFromImportRow(flat);

              if (task.key === "chapters") {
                const chapterName = pickChapterName(flat).trim();
                if (!chapterName) {
                  omitted += 1;
                  send({ level: "warn", message: "Chapter omitted: missing Church Affiliation / chapter name." });
                  continue;
                }
                if (chapterNames.has(chapterName.toLowerCase())) {
                  omitted += 1;
                  send({ level: "warn", message: `Chapter omitted (already exists): ${chapterName}` });
                  continue;
                }
                const res = await findOrCreateChapterByImportRow(admin, flat, systemUserId);
                if ("error" in res) {
                  omitted += 1;
                  send({ level: "error", message: `Chapter error (${chapterName}): ${res.error}` });
                } else {
                  imported += 1;
                  chapterNames.add(chapterName.toLowerCase());
                  send({ level: "ok", message: `Chapter synced: ${res.chapter.name}` });
                }
                continue;
              }

              const identity = validateImportIdentity(email, firstName, lastName);
              if (!identity.ok) {
                omitted += 1;
                send({ level: "warn", message: `User omitted: ${identity.reason}` });
                continue;
              }
              const emailNorm = identity.email;
              const firstOk = identity.firstName;
              const lastOk = identity.lastName;

              const { data: dup } = await admin.from("dashboard_users").select("id").ilike("email", emailNorm).maybeSingle();
              if (dup?.id) {
                omitted += 1;
                send({ level: "warn", message: `User omitted (already registered): ${emailNorm}` });
                continue;
              }

              const chapterRes = await resolveChapterIdForExternalWebhook(admin, {
                formId: task.key === "leaders" ? 1 : 4,
                flat,
                primaryChapterId,
                systemUserId,
              });
              if ("error" in chapterRes) {
                omitted += 1;
                send({ level: "error", message: `Chapter resolve failed (${emailNorm}): ${chapterRes.error}` });
                continue;
              }
              const chapterId = chapterRes.chapterId;

              if (task.key === "leaders") {
                if (!leaderRoleId) {
                  omitted += 1;
                  send({ level: "error", message: "Role local_leader not found." });
                  continue;
                }
                const leader = await createLocalLeaderUserForChapter(admin, {
                  email: emailNorm,
                  firstName: firstOk,
                  lastName: lastOk,
                  phone,
                  chapterId,
                  leaderRoleId,
                  passwordOverride: password,
                  mailing,
                });
                if ("error" in leader) {
                  omitted += 1;
                  send({ level: "error", message: `Leader error (${emailNorm}): ${leader.error}` });
                } else {
                  imported += 1;
                  send({ level: "ok", message: `Leader synced: ${emailNorm}` });
                }
                continue;
              }

              if (!memberRoleId) {
                omitted += 1;
                send({ level: "error", message: "Role member not found." });
                continue;
              }

              const { data: created, error: createErr } = await admin.auth.admin.createUser({
                email: emailNorm,
                password: password.length >= 8 ? password : phone || "Welcome123!",
                email_confirm: true,
                user_metadata: {
                  first_name: firstOk,
                  last_name: lastOk,
                  primary_chapter_id: chapterId,
                  phone: phone || null,
                  ...mailingForUserMetadata(mailing),
                },
              });
              if (createErr || !created.user?.id) {
                omitted += 1;
                send({ level: "error", message: `Member create failed (${emailNorm}): ${createErr?.message || "Unknown error"}` });
                continue;
              }
              const newId = created.user.id;

              await admin.from("user_roles").delete().eq("user_id", newId);
              const { error: roleErr } = await admin.from("user_roles").insert({ user_id: newId, role_id: memberRoleId });
              if (roleErr) {
                await admin.auth.admin.deleteUser(newId);
                omitted += 1;
                send({ level: "error", message: `Member role failed (${emailNorm}): ${roleErr.message}` });
                continue;
              }

              const displayName = `${firstOk} ${lastOk}`.trim();
              await admin.auth.admin.updateUserById(newId, {
                email_confirm: true,
                user_metadata: {
                  first_name: firstOk,
                  last_name: lastOk,
                  primary_chapter_id: chapterId,
                  phone: phone || null,
                  ...mailingForUserMetadata(mailing),
                },
              });
              await admin.from("profiles").update({
                first_name: firstOk,
                last_name: lastOk,
                display_name: displayName,
                primary_chapter_id: chapterId,
                ...(phone ? { phone } : {}),
                address_line: mailing.address_line,
                city: mailing.city,
                state: mailing.state,
                zip_code: mailing.zip_code,
              }).eq("id", newId);
              await admin.from("dashboard_users").update({
                first_name: firstOk,
                last_name: lastOk,
                display_name: displayName,
                primary_chapter_id: chapterId,
                ...(phone ? { phone } : {}),
                address_line: mailing.address_line,
                city: mailing.city,
                state: mailing.state,
                zip_code: mailing.zip_code,
                updated_at: new Date().toISOString(),
              }).eq("id", newId);

              imported += 1;
              send({ level: "ok", message: `Member synced: ${emailNorm}` });
            }
          }

          send({ level: "ok", message: `Sync completed. Imported: ${imported}. Omitted: ${omitted}.` });
          controller.close();
        } catch (error) {
          const msg = error instanceof Error ? error.message : "Unknown sync error.";
          send({ level: "error", message: msg });
          controller.close();
        }
      })();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
