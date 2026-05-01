import { MODULE_SLUGS } from "@/config/modules";
import {
  cleanPhone,
  containsTestText,
  EMAIL_EXCEL_KEYS,
  PHONE_EXCEL_KEYS,
  pickChapterName,
  pickField,
  splitName,
  type FlatRow,
  type ImportResultItem,
} from "@/lib/import/bulk-import";
import { createLocalLeaderUserForChapter } from "@/lib/import/create-local-leader-user";
import { findOrCreateChapterByImportRow } from "@/lib/import/chapter-import";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { isElevatedRole, loadUserRoleNames } from "@/lib/auth/user-roles";
import { can } from "@/types/permissions";
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
  const roles = await loadUserRoleNames(supabase, user.id);
  if (!can(permissions, MODULE_SLUGS.leaders, "create") || !isElevatedRole(roles)) {
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
  const { data: roleRows } = await admin.from("roles").select("id,name").in("name", ["local_leader"]);
  const leaderRoleId = (roleRows ?? []).find((r) => r.name === "local_leader")?.id;
  if (!leaderRoleId) return NextResponse.json({ error: "Role local_leader not found." }, { status: 500 });

  const results: ImportResultItem[] = [];
  const existingEmails = new Set<string>();
  const existingPhones = new Set<string>();
  const batchEmails = new Set<string>();
  const batchPhones = new Set<string>();

  const emails = rows.map((r) => pickField(r, EMAIL_EXCEL_KEYS).toLowerCase()).filter(Boolean);
  const phones = rows.map((r) => cleanPhone(pickField(r, PHONE_EXCEL_KEYS))).filter(Boolean);

  if (emails.length > 0) {
    const { data } = await admin.from("dashboard_users").select("email").in("email", emails);
    for (const item of data ?? []) existingEmails.add((item.email || "").toLowerCase());
  }
  if (phones.length > 0) {
    const { data } = await admin.from("profiles").select("phone").in("phone", phones);
    for (const item of data ?? []) if (item.phone) existingPhones.add(cleanPhone(item.phone));
  }

  for (const row of rows) {
    const fullName = pickField(row, ["name", "Name"]);
    const { firstName, lastName } = splitName(fullName);
    const email = pickField(row, EMAIL_EXCEL_KEYS).toLowerCase();
    const phone = cleanPhone(pickField(row, PHONE_EXCEL_KEYS));
    const chapterName = pickChapterName(row);
    if (containsTestText(row)) {
      results.push({ status: "omitted", email, phone, reason: "Contains test text." });
      continue;
    }
    if (!email || !email.includes("@") || !firstName || !lastName || !chapterName) {
      results.push({ status: "omitted", email, phone, reason: "Missing required fields." });
      continue;
    }
    if (existingEmails.has(email) || batchEmails.has(email)) {
      results.push({ status: "omitted", email, phone, reason: "Duplicate email." });
      continue;
    }
    if (phone && (existingPhones.has(phone) || batchPhones.has(phone))) {
      results.push({ status: "omitted", email, phone, reason: "Duplicate phone." });
      continue;
    }

    const chapterRes = await findOrCreateChapterByImportRow(admin, row, user.id);
    if ("error" in chapterRes) {
      results.push({
        status: "omitted",
        email,
        phone,
        reason: `${chapterRes.error} (chapter: ${chapterName || "—"})`,
      });
      continue;
    }
    const chapterId = chapterRes.chapter.id;

    const createdLeader = await createLocalLeaderUserForChapter(admin, {
      email,
      firstName,
      lastName,
      phone,
      chapterId,
      leaderRoleId,
    });
    if ("error" in createdLeader) {
      results.push({ status: "omitted", email, phone, reason: createdLeader.error });
      continue;
    }
    batchEmails.add(email);
    if (phone) batchPhones.add(phone);
    results.push({ status: "imported", email, phone, chapter: chapterName });
  }

  const created = results.filter((r) => r.status === "imported").length;
  const omitted = results.length - created;
  return NextResponse.json({ ok: true, created, omitted, results });
}
