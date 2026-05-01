import { MODULE_SLUGS } from "@/config/modules";
import {
  cleanPhone,
  containsTestText,
  EMAIL_EXCEL_KEYS,
  PHONE_EXCEL_KEYS,
  pickField,
  splitName,
  type FlatRow,
  type ImportResultItem,
} from "@/lib/import/bulk-import";
import { resolveChapterForMemberImport, type ChapterRow } from "@/lib/import/chapter-import";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
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
  if (!can(permissions, MODULE_SLUGS.community, "create")) {
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
  const { data: roleRows } = await admin.from("roles").select("id,name").in("name", ["member"]);
  const memberRoleId = (roleRows ?? []).find((r) => r.name === "member")?.id;
  if (!memberRoleId) return NextResponse.json({ error: "Role member not found." }, { status: 500 });

  const { data: chaptersData } = await admin
    .from("chapters")
    .select("id,name,city,state,zip_code")
    .order("name");
  let chapters = (chaptersData ?? []) as ChapterRow[];

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
    if (containsTestText(row)) {
      results.push({ status: "omitted", email, phone, reason: "Contains test text." });
      continue;
    }
    if (!email || !email.includes("@") || !firstName || !lastName) {
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

    const chapterPick = await resolveChapterForMemberImport(admin, row, chapters, user.id);
    if ("error" in chapterPick) {
      results.push({ status: "omitted", email, phone, reason: chapterPick.error });
      continue;
    }
    chapters = chapterPick.chapters;
    const chapter = chapterPick.chapter;

    const password = phone || "Welcome123!";
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        primary_chapter_id: chapter.id,
        phone: phone || null,
      },
    });
    if (createErr || !created.user?.id) {
      results.push({ status: "omitted", email, phone, reason: createErr?.message || "Could not create user." });
      continue;
    }

    const userId = created.user.id;
    await admin.auth.admin.updateUserById(userId, { email_confirm: true });

    await admin.from("user_roles").delete().eq("user_id", userId);
    const { error: roleErr } = await admin.from("user_roles").insert({ user_id: userId, role_id: memberRoleId });
    if (roleErr) {
      await admin.auth.admin.deleteUser(userId);
      results.push({ status: "omitted", email, phone, reason: roleErr.message || "Could not assign role." });
      continue;
    }

    batchEmails.add(email);
    if (phone) batchPhones.add(phone);
    results.push({ status: "imported", email, phone, chapter: chapter.name });
  }

  const created = results.filter((r) => r.status === "imported").length;
  const omitted = results.length - created;
  return NextResponse.json({ ok: true, created, omitted, results });
}
