import { MODULE_SLUGS } from "@/config/modules";
import {
  containsTestText,
  parseCityFromAddress,
  parseZipFromAddress,
  pickChapterName,
  pickField,
  pickLeaderEmail,
  pickLeaderFullName,
  pickLeaderPhone,
  splitName,
  type FlatRow,
  type ImportResultItem,
} from "@/lib/import/bulk-import";
import {
  createLocalLeaderUserForChapter,
  linkExistingUserAsLocalLeader,
} from "@/lib/import/create-local-leader-user";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { can } from "@/types/permissions";
import { resolveChapterUsState } from "@/lib/import/us-state";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

type Body = { rows?: FlatRow[] };

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const permissions = await loadModulePermissions(supabase, user.id);
  if (!can(permissions, MODULE_SLUGS.chapters, "create")) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const rows = Array.isArray(body.rows) ? body.rows : [];
  if (rows.length === 0) {
    return NextResponse.json({ ok: true, created: 0, omitted: 0, results: [] });
  }

  const admin = createAdminClient();
  const { data: leaderRoleRow } = await admin
    .from("roles")
    .select("id")
    .eq("name", "local_leader")
    .maybeSingle();
  const leaderRoleId = leaderRoleRow?.id as string | undefined;

  const chapterNames = rows.map((r) => pickChapterName(r)).map((n) => n.trim()).filter(Boolean);
  const { data: existingRows } = await admin.from("chapters").select("name").in("name", chapterNames);
  const existing = new Set((existingRows ?? []).map((r) => r.name.trim().toLowerCase()));
  const batch = new Set<string>();
  const results: ImportResultItem[] = [];

  for (const row of rows) {
    const hasAny = Object.values(row).some((v) => String(v ?? "").trim() !== "");
    if (!hasAny) {
      continue;
    }
    const chapterName = pickChapterName(row).trim();
    const address = pickField(row, ["Address", "address"]);
    const city = parseCityFromAddress(address) || pickField(row, ["City", "city"]);
    const churchStateRaw = pickField(row, ["Church State", "State", "state", "Church state"]);
    const zip = parseZipFromAddress(address) || pickField(row, ["ZIP code", "Zip", "zip"]);
    const key = chapterName.toLowerCase();

    if (containsTestText(row)) {
      results.push({ status: "omitted", chapter: chapterName, reason: "Contains test text." });
      continue;
    }
    if (!chapterName) {
      results.push({ status: "omitted", chapter: chapterName, reason: "Missing chapter name." });
      continue;
    }
    if (existing.has(key) || batch.has(key)) {
      results.push({ status: "omitted", chapter: chapterName, reason: "Duplicate chapter." });
      continue;
    }

    const stateResolved = resolveChapterUsState({ churchStateRaw, address });
    if ("error" in stateResolved) {
      results.push({
        status: "omitted",
        chapter: chapterName,
        reason: stateResolved.error,
      });
      continue;
    }
    const state = stateResolved.code;

    const { data: insertedChapter, error } = await admin
      .from("chapters")
      .insert({
        name: chapterName,
        address_line: address || null,
        city: city || null,
        state,
        zip_code: zip || null,
        status: "approved",
        created_by: user.id,
      })
      .select("id")
      .single();
    if (error || !insertedChapter?.id) {
      results.push({
        status: "omitted",
        chapter: chapterName,
        reason: error?.message || "Insert failed.",
      });
      continue;
    }
    const chapterId = insertedChapter.id as string;
    batch.add(key);

    let leaderNote = "";
    const lem = pickLeaderEmail(row).trim();
    const lname = pickLeaderFullName(row).trim();
    const lphone = pickLeaderPhone(row);
    if (lem && lname && leaderRoleId) {
      const { firstName, lastName } = splitName(lname);
      if (firstName && lastName) {
        const { data: existingDu } = await admin
          .from("dashboard_users")
          .select("id")
          .ilike("email", lem)
          .maybeSingle();
        if (existingDu?.id) {
          const linked = await linkExistingUserAsLocalLeader(admin, {
            userId: existingDu.id,
            chapterId,
            leaderRoleId,
          });
          leaderNote =
            "error" in linked
              ? ` (leader skipped: ${linked.error})`
              : " (local leader linked to existing user)";
        } else {
          const created = await createLocalLeaderUserForChapter(admin, {
            email: lem,
            firstName,
            lastName,
            phone: lphone,
            chapterId,
            leaderRoleId,
          });
          leaderNote =
            "error" in created ? ` (leader skipped: ${created.error})` : " + local leader created";
        }
      } else {
        leaderNote = " (leader name needs first and last name)";
      }
    } else if ((lem || lname || lphone) && !leaderRoleId) {
      leaderNote = " (local_leader role missing in DB)";
    }

    results.push({
      status: "imported",
      chapter: chapterName + leaderNote,
    });
  }

  const created = results.filter((r) => r.status === "imported").length;
  const omitted = results.length - created;
  return NextResponse.json({ ok: true, created, omitted, results });
}
