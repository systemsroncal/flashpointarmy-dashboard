import { NextResponse } from "next/server";
import { MODULE_SLUGS } from "@/config/modules";
import {
  DEFAULT_EXTERNAL_USER_PASSWORD,
  withExternalPasswordChangeFlag,
} from "@/lib/auth/default-external-user-password";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { isElevatedRole, loadUserRoleNames } from "@/lib/auth/user-roles";
import { can } from "@/types/permissions";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import {
  mergeNestedFormFields,
  parseFluentFlatRow,
} from "@/lib/external/fluent-form-user";
import { createLocalLeaderUserForChapter } from "@/lib/import/create-local-leader-user";
import type { FlatRow } from "@/lib/import/bulk-import";
import { pickChapterName } from "@/lib/import/bulk-import";
import {
  findOrCreateChapterByImportRow,
  resolveChapterForMemberImport,
  type ChapterRow,
} from "@/lib/import/chapter-import";
import {
  mailingForUserMetadata,
  userMailingAddressFromImportRow,
} from "@/lib/import/user-mailing-address";
import {
  ensureDashboardUserMirror,
  syncExistingUserFromFluentForm,
} from "@/lib/import/dashboard-user-mirror";
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
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "";
}

function isStatementTimeoutError(err: unknown): boolean {
  const msg = toErrorMessage(err).toLowerCase();
  return msg.includes("statement timeout") || msg.includes("canceling statement due to statement timeout");
}

function isTransientCreateUserErrorMessage(msg: string): boolean {
  const v = msg.trim().toLowerCase();
  if (!v || v === "{}") return true;
  return (
    v.includes("database error") ||
    v.includes("timeout") ||
    v.includes("rate limit") ||
    v.includes("internal") ||
    v.includes("temporar")
  );
}

async function withStatementTimeoutRetry<T>(
  task: () => Promise<T>,
  opts?: { attempts?: number; initialDelayMs?: number; factor?: number }
): Promise<T> {
  const attempts = Math.max(1, opts?.attempts ?? 4);
  const factor = Math.max(1, opts?.factor ?? 2);
  let delayMs = Math.max(50, opts?.initialDelayMs ?? 250);
  let lastErr: unknown = null;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await task();
    } catch (err) {
      lastErr = err;
      if (!isStatementTimeoutError(err) || i === attempts - 1) throw err;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      delayMs = Math.floor(delayMs * factor);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Statement timeout retry failed.");
}

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

async function loadDashboardUsersByEmail(
  admin: ReturnType<typeof createAdminClient>,
  emails: string[]
): Promise<Map<string, { id: string }>> {
  const out = new Map<string, { id: string }>();
  if (!emails.length) return out;
  const uniq = [...new Set(emails.map((e) => e.trim().toLowerCase()).filter(Boolean))];
  const chunkSize = 400;
  for (let i = 0; i < uniq.length; i += chunkSize) {
    const batch = uniq.slice(i, i + chunkSize);
    const { data } = await admin.from("dashboard_users").select("id,email").in("email", batch);
    for (const row of data ?? []) {
      const email = String((row as { email?: string }).email || "").trim().toLowerCase();
      const id = String((row as { id?: string }).id || "");
      if (email && id) out.set(email, { id });
    }
  }
  return out;
}

async function loadAuthUsersByEmail(
  admin: ReturnType<typeof createAdminClient>,
  emails: string[]
): Promise<Map<string, { id: string }>> {
  const targets = new Set(emails.map((e) => e.trim().toLowerCase()).filter(Boolean));
  const out = new Map<string, { id: string }>();
  if (!targets.size) return out;
  const perPage = 1000;
  for (let page = 1; page <= 500; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) break;
    const users = data?.users ?? [];
    for (const u of users) {
      const email = String(u.email || "").trim().toLowerCase();
      if (!email || !targets.has(email)) continue;
      out.set(email, { id: u.id });
    }
    if (users.length < perPage || out.size === targets.size) break;
  }
  return out;
}

/**
 * WordPress REST + Application Passwords: Basic auth.
 * Prefer FLUENT_FORM_SYNC_USER + FLUENT_FORM_SYNC_APP_PASSWORD (or FLUENT_FORM_SYNC_PASSWORD).
 * Otherwise FLUENT_FORM_SYNC_TOKEN as Bearer (e.g. JWT plugins).
 */
function fluentFormSyncAuthHeaders(): {
  headers: Record<string, string>;
  mode: "basic" | "bearer" | "none";
} {
  const user = process.env.FLUENT_FORM_SYNC_USER?.trim() || "";
  const rawPass =
    process.env.FLUENT_FORM_SYNC_APP_PASSWORD ?? process.env.FLUENT_FORM_SYNC_PASSWORD ?? "";
  const appPassword = rawPass.replace(/\s+/g, "").trim();
  const token = process.env.FLUENT_FORM_SYNC_TOKEN?.trim() || "";

  if (user && appPassword) {
    const basic = Buffer.from(`${user}:${appPassword}`, "utf8").toString("base64");
    return { headers: { Authorization: `Basic ${basic}` }, mode: "basic" };
  }
  if (token) {
    return { headers: { Authorization: `Bearer ${token}` }, mode: "bearer" };
  }
  return { headers: {}, mode: "none" };
}

async function fetchFormEntriesByDate(
  formId: number,
  fromDate: Date,
  toDate: Date
): Promise<FluentEntry[]> {
  const baseUrl = (process.env.FLUENT_FORM_SYNC_BASE_URL || "https://fparmychapters.com").replace(/\/$/, "");
  const { headers: authHeaders, mode: authMode } = fluentFormSyncAuthHeaders();
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
        headers: authHeaders,
        cache: "no-store",
      });
      if (res.status === 404) continue;
      matchedRoute = true;
      if (!res.ok) {
        const authHint =
          res.status === 401
            ? authMode === "basic"
              ? " Check FLUENT_FORM_SYNC_USER and FLUENT_FORM_SYNC_APP_PASSWORD (WordPress Application Password for that user, spaces removed automatically)."
              : authMode === "bearer"
                ? " Invalid or expired FLUENT_FORM_SYNC_TOKEN (Bearer must match what WordPress/Fluent REST accepts)."
                : " Set FLUENT_FORM_SYNC_USER + FLUENT_FORM_SYNC_APP_PASSWORD (recommended) or FLUENT_FORM_SYNC_TOKEN."
            : res.status === 403
              ? " 403 = authenticated but not allowed: use an Administrator (or a user allowed to read Fluent submissions via REST), and check Fluent Forms / security plugins / host rules blocking REST."
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

  const callerRolesSync = await loadUserRoleNames(supabase, user.id);
  if (!isElevatedRole(callerRolesSync)) {
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
      let streamEnded = false;
      const send = (evt: SyncEvent) => {
        if (streamEnded) return;
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(evt)}\n`));
        } catch {
          streamEnded = true;
        }
      };
      const endStream = () => {
        if (streamEnded) return;
        streamEnded = true;
        try {
          controller.close();
        } catch {
          /* already closed / client aborted */
        }
      };

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

          let chapterRows: ChapterRow[] = [];
          const { data: chaptersData } = await admin
            .from("chapters")
            .select("id,name,city,state,zip_code")
            .order("name");
          chapterRows = (chaptersData ?? []) as ChapterRow[];
          const chapterNames = new Set(
            chapterRows.map((c) => String(c.name || "").trim().toLowerCase()).filter(Boolean)
          );
          const chapterIds = new Set(chapterRows.map((c) => c.id));
          const reservedLeaderChapterIds = new Set<string>();

          const resolveChapterForSyncRow = async (opts: {
            taskKey: "leaders" | "members";
            flat: FlatRow;
            primaryChapterId: string;
            existingUserId?: string | null;
          }): Promise<{ chapterId: string } | { error: string }> => {
            const trimmed = opts.primaryChapterId.trim();
            if (UUID_RE.test(trimmed) && chapterIds.has(trimmed)) {
              return { chapterId: trimmed };
            }
            if (opts.taskKey === "leaders") {
              const chapterName = pickChapterName(opts.flat).trim();
              if (!chapterName) return { error: "Missing chapter name." };
              const groupPattern = new RegExp(`^${escapeRegex(chapterName)} Group (\\d+)$`, "i");
              const chapterMatches = chapterRows.filter((c) => {
                const name = String(c.name || "").trim();
                return name.localeCompare(chapterName, undefined, { sensitivity: "accent" }) === 0 || groupPattern.test(name);
              });
              const chapterMatchIds = chapterMatches.map((c) => c.id);

              if (opts.existingUserId) {
                const { data: linkedRows } = await admin
                  .from("chapter_leaders")
                  .select("chapter_id")
                  .eq("user_id", opts.existingUserId);
                const linked = new Set((linkedRows ?? []).map((r) => String((r as { chapter_id?: string }).chapter_id || "")));
                const sameFamily = chapterMatches.find((c) => linked.has(c.id));
                if (sameFamily?.id) {
                  reservedLeaderChapterIds.add(sameFamily.id);
                  return { chapterId: sameFamily.id };
                }
              }

              if (chapterMatchIds.length) {
                const { data: assignedRows } = await admin
                  .from("chapter_leaders")
                  .select("chapter_id")
                  .in("chapter_id", chapterMatchIds);
                const occupied = new Set(
                  (assignedRows ?? []).map((r) => String((r as { chapter_id?: string }).chapter_id || ""))
                );
                const freeExisting = chapterMatches.find(
                  (c) => !occupied.has(c.id) && !reservedLeaderChapterIds.has(c.id)
                );
                if (freeExisting?.id) {
                  reservedLeaderChapterIds.add(freeExisting.id);
                  return { chapterId: freeExisting.id };
                }
              }

              let maxGroup = 0;
              for (const c of chapterMatches) {
                const name = String(c.name || "").trim();
                const groupMatch = name.match(groupPattern);
                if (groupMatch?.[1]) {
                  const n = Number(groupMatch[1]);
                  if (Number.isFinite(n)) maxGroup = Math.max(maxGroup, n);
                }
              }
              const nextName = `${chapterName} Group ${maxGroup + 1}`;
              const syntheticFlat: FlatRow = {
                ...opts.flat,
                "Church Affiliation": nextName,
                input_text_1: nextName,
              };
              const grouped = await withStatementTimeoutRetry(() =>
                findOrCreateChapterByImportRow(admin, syntheticFlat, systemUserId)
              );
              if ("error" in grouped) return { error: grouped.error };
              if (!chapterRows.some((c) => c.id === grouped.chapter.id)) {
                chapterRows = [...chapterRows, grouped.chapter];
                chapterNames.add(grouped.chapter.name.trim().toLowerCase());
                chapterIds.add(grouped.chapter.id);
              }
              reservedLeaderChapterIds.add(grouped.chapter.id);
              return { chapterId: grouped.chapter.id };
            }
            const res = await withStatementTimeoutRetry(() =>
              resolveChapterForMemberImport(admin, opts.flat, chapterRows, systemUserId)
            );
            if ("error" in res) return { error: res.error };
            chapterRows = res.chapters;
            for (const ch of chapterRows) {
              chapterNames.add(String(ch.name || "").trim().toLowerCase());
              chapterIds.add(ch.id);
            }
            return { chapterId: res.chapter.id };
          };

          for (const task of tasks) {
            if (!task.enabled) continue;
            send({ level: "info", message: `Fetching form ${task.formId} entries for ${task.key}...` });
            const entries = await fetchFormEntriesByDate(task.formId, fromDate, toDate);
            send({ level: "info", message: `Found ${entries.length} records for ${task.key}.` });
            const byEmail = await loadDashboardUsersByEmail(
              admin,
              entries
                .map((entry) => {
                  const parsed = parseFluentFlatRow(toFlatEntry(entry));
                  return parsed.email.trim().toLowerCase();
                })
                .filter(Boolean)
            );
            const byAuthEmail = await loadAuthUsersByEmail(
              admin,
              entries
                .map((entry) => {
                  const parsed = parseFluentFlatRow(toFlatEntry(entry));
                  return parsed.email.trim().toLowerCase();
                })
                .filter(Boolean)
            );

            for (const entry of entries) {
              const flat = toFlatEntry(entry);
              const { email, firstName, lastName, phone, primaryChapterId } = parseFluentFlatRow(flat);
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
                const res = await withStatementTimeoutRetry(() =>
                  findOrCreateChapterByImportRow(admin, flat, systemUserId)
                );
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
              /** Prefer dashboard_users; also treat auth-only accounts as existing (mirror trigger may have missed). */
              const existingDu = byEmail.get(emailNorm) ?? byAuthEmail.get(emailNorm);

              /** Match webhook strategy but with in-memory chapter cache for large sync runs. */
              const chapterRes = await resolveChapterForSyncRow({
                taskKey: task.key,
                flat,
                primaryChapterId,
                existingUserId: existingDu?.id ?? null,
              });
              if ("error" in chapterRes) {
                omitted += 1;
                send({ level: "error", message: `Chapter resolve failed (${emailNorm}): ${chapterRes.error}` });
                continue;
              }
              const chapterId = chapterRes.chapterId;

              if (existingDu?.id) {
                if (task.key === "leaders") {
                  const ex = await withStatementTimeoutRetry(() =>
                    syncExistingUserFromFluentForm(admin, {
                      userId: existingDu.id,
                      email: emailNorm,
                      taskKey: "leaders",
                      chapterId,
                      firstName: firstOk,
                      lastName: lastOk,
                      phone,
                      mailing,
                      leaderRoleId,
                      memberRoleId,
                    })
                  );
                  if (ex.error) {
                    omitted += 1;
                    send({ level: "error", message: `Leader existing-user sync (${emailNorm}): ${ex.error}` });
                  } else {
                    imported += 1;
                    send({ level: "ok", message: `Leader updated: ${emailNorm}` });
                    byEmail.set(emailNorm, { id: existingDu.id });
                  }
                } else if (task.key === "members") {
                  const ex = await syncExistingUserFromFluentForm(admin, {
                    userId: existingDu.id,
                    email: emailNorm,
                    taskKey: "members",
                    chapterId,
                    firstName: firstOk,
                    lastName: lastOk,
                    phone,
                    mailing,
                    leaderRoleId,
                    memberRoleId,
                  });
                  if (ex.error) {
                    omitted += 1;
                    send({ level: "error", message: `Member existing-user sync (${emailNorm}): ${ex.error}` });
                  } else {
                    imported += 1;
                    send({ level: "ok", message: `Member updated: ${emailNorm}` });
                    byEmail.set(emailNorm, { id: existingDu.id });
                  }
                } else {
                  omitted += 1;
                  send({ level: "warn", message: `User already registered (skipped for chapters pass): ${emailNorm}` });
                }
                continue;
              }

              if (task.key === "leaders") {
                if (!leaderRoleId) {
                  omitted += 1;
                  send({ level: "error", message: "Role local_leader not found." });
                  continue;
                }
                const leader = await withStatementTimeoutRetry(() =>
                  createLocalLeaderUserForChapter(admin, {
                    email: emailNorm,
                    firstName: firstOk,
                    lastName: lastOk,
                    phone,
                    chapterId,
                    leaderRoleId,
                    /* Sync: always use default password for new accounts; never take password from Fluent. */
                    mailing,
                  })
                );
                if ("error" in leader) {
                  omitted += 1;
                  send({ level: "error", message: `Leader error (${emailNorm}): ${leader.error}` });
                } else {
                  imported += 1;
                  send({ level: "ok", message: `Leader synced: ${emailNorm}` });
                  byEmail.set(emailNorm, { id: leader.userId });
                }
                continue;
              }

              if (!memberRoleId) {
                omitted += 1;
                send({ level: "error", message: "Role member not found." });
                continue;
              }

              const effectiveMemberPassword = DEFAULT_EXTERNAL_USER_PASSWORD;
              let created: Awaited<ReturnType<typeof admin.auth.admin.createUser>>["data"] | null = null;
              let createErr: Awaited<ReturnType<typeof admin.auth.admin.createUser>>["error"] | null = null;
              for (let attempt = 1; attempt <= 3; attempt += 1) {
                const res = await admin.auth.admin.createUser({
                  email: emailNorm,
                  password: effectiveMemberPassword,
                  email_confirm: true,
                  user_metadata: withExternalPasswordChangeFlag(
                    {
                      first_name: firstOk,
                      last_name: lastOk,
                      primary_chapter_id: chapterId,
                      phone: phone || null,
                      ...mailingForUserMetadata(mailing),
                    },
                    effectiveMemberPassword
                  ),
                });
                created = res.data;
                createErr = res.error;
                if (!createErr && created.user?.id) break;
                const errMsg = createErr?.message ?? "";
                if (!isTransientCreateUserErrorMessage(errMsg) || attempt >= 3) break;
                send({
                  level: "warn",
                  message: `Transient member create error (${emailNorm}) attempt ${attempt}/3: ${errMsg || "unknown"}`,
                });
                await new Promise((resolve) => setTimeout(resolve, attempt * 250));
              }
              if (createErr || !created?.user?.id) {
                const alreadyExists = Boolean(
                  createErr?.message && /already|registered|exists|duplicate/i.test(createErr.message)
                );
                if (alreadyExists || isTransientCreateUserErrorMessage(createErr?.message ?? "")) {
                  let fallback = byAuthEmail.get(emailNorm);
                  if (!fallback?.id) {
                    const looked = await loadAuthUsersByEmail(admin, [emailNorm]);
                    fallback = looked.get(emailNorm);
                    if (fallback?.id) byAuthEmail.set(emailNorm, { id: fallback.id });
                  }
                  if (fallback?.id) {
                    const ex = await withStatementTimeoutRetry(() =>
                      syncExistingUserFromFluentForm(admin, {
                        userId: fallback.id,
                        email: emailNorm,
                        taskKey: "members",
                        chapterId,
                        firstName: firstOk,
                        lastName: lastOk,
                        phone,
                        mailing,
                        leaderRoleId,
                        memberRoleId,
                      })
                    );
                    if (!ex.error) {
                      imported += 1;
                      send({ level: "ok", message: `Member updated: ${emailNorm}` });
                      byEmail.set(emailNorm, { id: fallback.id });
                      continue;
                    }
                  }
                }
                omitted += 1;
                send({ level: "error", message: `Member create failed (${emailNorm}): ${createErr?.message || "Unknown error"}` });
                continue;
              }
              const newId = created!.user!.id;

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
                user_metadata: withExternalPasswordChangeFlag(
                  {
                    first_name: firstOk,
                    last_name: lastOk,
                    primary_chapter_id: chapterId,
                    phone: phone || null,
                    ...mailingForUserMetadata(mailing),
                  },
                  effectiveMemberPassword
                ),
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
              const mirrorM = await ensureDashboardUserMirror(admin, {
                id: newId,
                email: emailNorm,
                firstName: firstOk,
                lastName: lastOk,
                displayName,
                primaryChapterId: chapterId,
                phone,
                mailing,
              });
              if (mirrorM.error) {
                await admin.from("user_roles").delete().eq("user_id", newId);
                await admin.auth.admin.deleteUser(newId);
                omitted += 1;
                send({ level: "error", message: `Member mirror failed (${emailNorm}): ${mirrorM.error}` });
                continue;
              }

              imported += 1;
              send({ level: "ok", message: `Member synced: ${emailNorm}` });
              byEmail.set(emailNorm, { id: newId });
            }
          }

          send({ level: "ok", message: `Sync completed. Imported: ${imported}. Omitted: ${omitted}.` });
        } catch (error) {
          const msg = error instanceof Error ? error.message : "Unknown sync error.";
          send({ level: "error", message: msg });
        } finally {
          endStream();
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
