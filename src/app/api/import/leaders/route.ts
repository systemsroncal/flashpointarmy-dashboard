import { MODULE_SLUGS } from "@/config/modules";
import {
  cleanPhone,
  containsTestText,
  EMAIL_EXCEL_KEYS,
  parsePersonNamesFromImportRow,
  pickChapterName,
  pickField,
  pickPhoneFromImportRow,
  type FlatRow,
  type ImportResultItem,
} from "@/lib/import/bulk-import";
import { validateImportIdentity } from "@/lib/import/validate-import-identity";
import { createLocalLeaderUserForChapter } from "@/lib/import/create-local-leader-user";
import { loadAuthUsersByEmail, syncExistingUserFromFluentForm } from "@/lib/import/dashboard-user-mirror";
import { findOrCreateChapterByImportRow } from "@/lib/import/chapter-import";
import { userMailingAddressFromImportRow } from "@/lib/import/user-mailing-address";
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
  const existingPhones = new Set<string>();
  const batchEmails = new Set<string>();
  const batchPhones = new Set<string>();
  const existingByEmail = new Map<string, { id: string }>();

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
    const chapterName = pickChapterName(row);
    if (containsTestText(row)) {
      results.push({ status: "omitted", email: emailLower, phone, reason: "Contains test text." });
      continue;
    }
    const identity = validateImportIdentity(emailRaw, firstName, lastName);
    if (!identity.ok) {
      results.push({ status: "omitted", email: emailLower, phone, reason: identity.reason });
      continue;
    }
    if (!chapterName?.trim()) {
      results.push({ status: "omitted", email: identity.email, phone, reason: "Missing chapter name." });
      continue;
    }
    const email = identity.email;
    const fn = identity.firstName;
    const ln = identity.lastName;
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
    const mailing = userMailingAddressFromImportRow(row);
    const existing = existingByEmail.get(email);
    if (existing?.id) {
      const updated = await syncExistingUserFromFluentForm(admin, {
        userId: existing.id,
        email,
        taskKey: "leaders",
        chapterId,
        firstName: fn,
        lastName: ln,
        phone,
        mailing,
        leaderRoleId,
        memberRoleId: null,
      });
      if (updated.error) {
        results.push({ status: "omitted", email, phone, reason: updated.error });
      } else {
        results.push({ status: "imported", email, phone, chapter: chapterName });
      }
      continue;
    }

    const createdLeader = await createLocalLeaderUserForChapter(admin, {
      email,
      firstName: fn,
      lastName: ln,
      phone,
      chapterId,
      leaderRoleId,
      mailing,
    });
    if ("error" in createdLeader) {
      results.push({ status: "omitted", email, phone, reason: createdLeader.error });
      continue;
    }
    batchEmails.add(email);
    if (phone) batchPhones.add(phone);
    existingByEmail.set(email, { id: createdLeader.userId });
    results.push({ status: "imported", email, phone, chapter: chapterName });
  }

  const created = results.filter((r) => r.status === "imported").length;
  const omitted = results.length - created;
  return NextResponse.json({ ok: true, created, omitted, results });
}
