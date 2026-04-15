import { MODULE_SLUGS } from "@/config/modules";
import {
  cleanPhone,
  containsTestText,
  parseCityFromAddress,
  parseZipFromAddress,
  PHONE_EXCEL_KEYS,
  pickField,
  splitName,
  type FlatRow,
  type ImportResultItem,
} from "@/lib/import/bulk-import";
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

  const emails = rows.map((r) => pickField(r, ["Email", "email"]).toLowerCase()).filter(Boolean);
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
    const email = pickField(row, ["Email", "email"]).toLowerCase();
    const phone = cleanPhone(pickField(row, PHONE_EXCEL_KEYS));
    const chapterName = pickField(row, ["Church Affiliation", "church affiliation"]);
    const address = pickField(row, ["Address", "address"]);
    const state = pickField(row, ["Church State", "State", "state"]).toUpperCase().slice(0, 2);
    const city = parseCityFromAddress(address) || pickField(row, ["City", "city"]);
    const zip = parseZipFromAddress(address) || pickField(row, ["ZIP code", "Zip", "zip"]);

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

    let chapterId: string | null = null;
    const { data: chapterByName } = await admin
      .from("chapters")
      .select("id")
      .ilike("name", chapterName)
      .limit(1)
      .maybeSingle();
    chapterId = chapterByName?.id ?? null;
    if (!chapterId) {
      const { data: insertedChapter, error: chapterErr } = await admin
        .from("chapters")
        .insert({
          name: chapterName,
          address_line: address || null,
          city: city || null,
          state: state || "FL",
          zip_code: zip || null,
          status: "approved",
          created_by: user.id,
        })
        .select("id")
        .single();
      if (chapterErr || !insertedChapter?.id) {
        results.push({ status: "omitted", email, phone, reason: chapterErr?.message || "Could not create chapter." });
        continue;
      }
      chapterId = insertedChapter.id;
    }

    const password = phone || "Welcome123!";
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        primary_chapter_id: chapterId,
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
    const { error: roleErr } = await admin
      .from("user_roles")
      .insert({ user_id: userId, role_id: leaderRoleId });
    if (roleErr) {
      await admin.auth.admin.deleteUser(userId);
      results.push({ status: "omitted", email, phone, reason: roleErr.message || "Could not assign role." });
      continue;
    }

    await admin.from("chapter_leaders").upsert({ chapter_id: chapterId, user_id: userId }, { onConflict: "chapter_id,user_id" });
    batchEmails.add(email);
    if (phone) batchPhones.add(phone);
    results.push({ status: "imported", email, phone, chapter: chapterName });
  }

  const created = results.filter((r) => r.status === "imported").length;
  const omitted = results.length - created;
  return NextResponse.json({ ok: true, created, omitted, results });
}
