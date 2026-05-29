import { MODULE_SLUGS } from "@/config/modules";
import {
  cleanPhone,
  containsTestText,
  EMAIL_EXCEL_KEYS,
  parsePersonNamesFromImportRow,
  pickField,
  pickPhoneFromImportRow,
  type FlatRow,
  type ImportResultItem,
} from "@/lib/import/bulk-import";
import { validateImportIdentity } from "@/lib/import/validate-import-identity";
import {
  ensureDashboardUserMirror,
  loadAuthUsersByEmail,
  syncExistingUserFromFluentForm,
} from "@/lib/import/dashboard-user-mirror";
import { resolveChapterForMemberImport, type ChapterRow } from "@/lib/import/chapter-import";
import { mailingForUserMetadata, userMailingAddressFromImportRow } from "@/lib/import/user-mailing-address";
import { DEFAULT_EXTERNAL_USER_PASSWORD, withExternalPasswordChangeFlag } from "@/lib/auth/default-external-user-password";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { isChapterStaffRole, loadUserRoleNames } from "@/lib/auth/user-roles";
import { can } from "@/types/permissions";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/server-session";

type Body = { rows?: FlatRow[] };

export async function POST(req: Request) {
  const authResult = await requireApiAuth();
  if ("response" in authResult) return authResult.response;
  const { supabase, user } = authResult;

  const permissions = await loadModulePermissions(supabase, user.id);
  if (!can(permissions, MODULE_SLUGS.community, "create")) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const callerRoles = await loadUserRoleNames(supabase, user.id);
  if (!isChapterStaffRole(callerRoles)) {
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
  const existingByEmail = new Map<string, { id: string }>();
  const existingPhones = new Set<string>();
  const batchEmails = new Set<string>();
  const batchPhones = new Set<string>();

  const emails = rows.map((r) => pickField(r, EMAIL_EXCEL_KEYS).toLowerCase()).filter(Boolean);
  const phones = rows.map((r) => pickPhoneFromImportRow(r)).filter(Boolean);
  if (emails.length > 0) {
    const { data } = await admin.from("dashboard_users").select("id,email").in("email", emails);
    for (const item of data ?? []) {
      const email = String(item.email || "").toLowerCase();
      if (email) existingByEmail.set(email, { id: String((item as { id?: string }).id || "") });
    }
    const authByEmail = await loadAuthUsersByEmail(admin, emails);
    for (const [email, v] of authByEmail.entries()) {
      if (!existingByEmail.has(email)) existingByEmail.set(email, v);
    }
  }
  if (phones.length > 0) {
    const { data } = await admin.from("profiles").select("phone").in("phone", phones);
    for (const item of data ?? []) if (item.phone) existingPhones.add(cleanPhone(item.phone));
  }

  for (const row of rows) {
    const { firstName, lastName } = parsePersonNamesFromImportRow(row);
    const emailRaw = pickField(row, EMAIL_EXCEL_KEYS);
    const emailLower = emailRaw.toLowerCase();
    const phone = pickPhoneFromImportRow(row);
    if (containsTestText(row)) {
      results.push({ status: "omitted", email: emailLower, phone, reason: "Contains test text." });
      continue;
    }
    const identity = validateImportIdentity(emailRaw, firstName, lastName);
    if (!identity.ok) {
      results.push({ status: "omitted", email: emailLower, phone, reason: identity.reason });
      continue;
    }
    const email = identity.email;
    const fn = identity.firstName;
    const ln = identity.lastName;
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
    const mailing = userMailingAddressFromImportRow(row);
    const existing = existingByEmail.get(email);
    if (existing?.id) {
      const updated = await syncExistingUserFromFluentForm(admin, {
        userId: existing.id,
        email,
        taskKey: "members",
        chapterId: chapter.id,
        firstName: fn,
        lastName: ln,
        phone,
        mailing,
        leaderRoleId: null,
        memberRoleId,
      });
      if (updated.error) {
        results.push({ status: "omitted", email, phone, reason: updated.error });
      } else {
        results.push({ status: "imported", email, phone, chapter: chapter.name });
      }
      continue;
    }

    const password = DEFAULT_EXTERNAL_USER_PASSWORD;
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: withExternalPasswordChangeFlag(
        {
          first_name: fn,
          last_name: ln,
          primary_chapter_id: chapter.id,
          phone: phone || null,
          ...mailingForUserMetadata(mailing),
        },
        password
      ),
    });
    if (createErr || !created.user?.id) {
      results.push({ status: "omitted", email, phone, reason: createErr?.message || "Could not create user." });
      continue;
    }

    const userId = created.user.id;
    await admin.auth.admin.updateUserById(userId, {
      email_confirm: true,
      user_metadata: withExternalPasswordChangeFlag(
        {
          first_name: fn,
          last_name: ln,
          primary_chapter_id: chapter.id,
          phone: phone || null,
          ...mailingForUserMetadata(mailing),
        },
        password
      ),
    });

    await admin.from("user_roles").delete().eq("user_id", userId);
    const { error: roleErr } = await admin.from("user_roles").insert({ user_id: userId, role_id: memberRoleId });
    if (roleErr) {
      await admin.auth.admin.deleteUser(userId);
      results.push({ status: "omitted", email, phone, reason: roleErr.message || "Could not assign role." });
      continue;
    }

    const displayName = `${fn} ${ln}`.trim();
    await admin.from("profiles").update({
      first_name: fn,
      last_name: ln,
      display_name: displayName,
      primary_chapter_id: chapter.id,
      ...(phone ? { phone } : {}),
      address_line: mailing.address_line,
      city: mailing.city,
      state: mailing.state,
      zip_code: mailing.zip_code,
    }).eq("id", userId);
    const mirror = await ensureDashboardUserMirror(admin, {
      id: userId,
      email,
      firstName: fn,
      lastName: ln,
      displayName,
      primaryChapterId: chapter.id,
      phone,
      mailing,
    });
    if (mirror.error) {
      await admin.from("user_roles").delete().eq("user_id", userId);
      await admin.auth.admin.deleteUser(userId);
      results.push({ status: "omitted", email, phone, reason: mirror.error });
      continue;
    }

    batchEmails.add(email);
    if (phone) batchPhones.add(phone);
    existingByEmail.set(email, { id: userId });
    results.push({ status: "imported", email, phone, chapter: chapter.name });
  }

  const created = results.filter((r) => r.status === "imported").length;
  const omitted = results.length - created;
  return NextResponse.json({ ok: true, created, omitted, results });
}
