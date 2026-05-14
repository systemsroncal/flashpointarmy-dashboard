import { DEFAULT_EXTERNAL_USER_PASSWORD, withExternalPasswordChangeFlag } from "@/lib/auth/default-external-user-password";
import { NextResponse } from "next/server";
import {
  extractFormIdFromPayload,
  mergeNestedFormFields,
  parseFluentFlatRow,
  roleForFluentFormId,
} from "@/lib/external/fluent-form-user";
import { resolveChapterIdForExternalWebhook } from "@/lib/external/resolve-webhook-chapter";
import { createLocalLeaderUserForChapter } from "@/lib/import/create-local-leader-user";
import { ensureDashboardUserMirror, loadAuthUsersByEmail, syncExistingUserFromFluentForm } from "@/lib/import/dashboard-user-mirror";
import {
  mailingForUserMetadata,
  userMailingAddressFromImportRow,
} from "@/lib/import/user-mailing-address";
import { validateImportIdentity } from "@/lib/import/validate-import-identity";
import { createAdminClient } from "@/utils/supabase/admin";

function getWebhookSecret(req: Request): string | null {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    const t = auth.slice(7).trim();
    if (t) return t;
  }
  const h = req.headers.get("x-fluent-form-secret")?.trim();
  return h || null;
}

async function readBodyAsRecord(req: Request): Promise<Record<string, unknown>> {
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    return (await req.json()) as Record<string, unknown>;
  }
  if (ct.includes("multipart/form-data") || ct.includes("application/x-www-form-urlencoded")) {
    const fd = await req.formData();
    const o: Record<string, unknown> = {};
    for (const [k, v] of fd.entries()) {
      if (typeof v === "string") o[k] = v;
    }
    return o;
  }
  try {
    return (await req.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

/**
 * Webhook from WordPress Fluent Forms (fparmychapters.com).
 *
 * - **form_id 4 (Members):** creates user + `member` role. Chapter: UUID in `primary_chapter_id`,
 *   or chapter columns + `FLUENT_FORM_SYSTEM_USER_ID` (same heuristics as Community Excel import).
 * - **form_id 1 (Local Leaders):** finds or creates chapter from row (same as Chapters/Leaders Excel),
 *   then creates user + `local_leader` + `chapter_leaders` (same as Leaders import).
 *
 * Auth: `Authorization: Bearer <FLUENT_FORM_WEBHOOK_SECRET>` or `X-Fluent-Form-Secret`.
 * Env: `FLUENT_FORM_WEBHOOK_SECRET`; optional `FLUENT_FORM_SYSTEM_USER_ID` (UUID of a dashboard user
 * used as `created_by` when auto-creating chapters — use a dedicated admin/service account).
 *
 * Password: optional in the payload. If missing or shorter than 8 characters, the server uses
 * the default external password (see `DEFAULT_EXTERNAL_USER_PASSWORD`, currently FLASHPOINT).
 */
export async function POST(req: Request) {
  const expected = process.env.FLUENT_FORM_WEBHOOK_SECRET?.trim();
  if (!expected) {
    return NextResponse.json({ error: "FLUENT_FORM_WEBHOOK_SECRET is not set." }, { status: 503 });
  }
  const got = getWebhookSecret(req);
  if (!got || got !== expected) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let raw: Record<string, unknown>;
  try {
    raw = await readBodyAsRecord(req);
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const formId = extractFormIdFromPayload(raw);
  if (formId == null) {
    return NextResponse.json(
      { error: "Missing or invalid form_id. Expected 1 (Local Leaders) or 4 (Members)." },
      { status: 400 }
    );
  }

  const roleName = roleForFluentFormId(formId);
  if (!roleName) {
    return NextResponse.json(
      { error: `Unsupported form_id ${formId}. Allowed: 1 (Local Leaders), 4 (Members).` },
      { status: 400 }
    );
  }

  const flat = mergeNestedFormFields(raw);
  const parsed = parseFluentFlatRow(flat);
  const { password, phone, primaryChapterId } = parsed;
  const mailing = userMailingAddressFromImportRow(flat);
  const systemUserId = process.env.FLUENT_FORM_SYSTEM_USER_ID?.trim() || null;

  const identity = validateImportIdentity(parsed.email, parsed.firstName, parsed.lastName);
  if (!identity.ok) {
    return NextResponse.json({ error: identity.reason }, { status: 400 });
  }
  const email = identity.email;
  const firstName = identity.firstName;
  const lastName = identity.lastName;

  const effectivePassword =
    password.trim().length >= 8 ? password.trim() : DEFAULT_EXTERNAL_USER_PASSWORD;

  const admin = createAdminClient();

  const chapterRes = await resolveChapterIdForExternalWebhook(admin, {
    formId: formId as 1 | 4,
    flat,
    primaryChapterId,
    systemUserId,
  });
  if ("error" in chapterRes) {
    return NextResponse.json({ error: chapterRes.error }, { status: 400 });
  }
  const { chapterId, chapterCreated } = chapterRes;

  const authByEmail = await loadAuthUsersByEmail(admin, [email]);
  const { data: dup } = await admin.from("dashboard_users").select("id").ilike("email", email).maybeSingle();
  const existingUserId = dup?.id || authByEmail.get(email)?.id || null;

  if (formId === 1) {
    const { data: roleRow, error: roleLookupErr } = await admin
      .from("roles")
      .select("id")
      .eq("name", "local_leader")
      .maybeSingle();
    if (roleLookupErr || !roleRow?.id) {
      return NextResponse.json({ error: "Role local_leader not found." }, { status: 500 });
    }

    if (existingUserId) {
      const updated = await syncExistingUserFromFluentForm(admin, {
        userId: existingUserId,
        email,
        taskKey: "leaders",
        chapterId,
        firstName,
        lastName,
        phone,
        mailing,
        leaderRoleId: roleRow.id as string,
        memberRoleId: null,
      });
      if (updated.error) return NextResponse.json({ error: updated.error }, { status: 500 });
      return NextResponse.json({
        ok: true,
        user_id: existingUserId,
        email,
        role: "local_leader",
        form_id: formId,
        chapter_id: chapterId,
        chapter_created: chapterCreated,
        updated_existing: true,
      });
    }

    const createdLeader = await createLocalLeaderUserForChapter(admin, {
      email,
      firstName,
      lastName,
      phone,
      chapterId,
      leaderRoleId: roleRow.id as string,
      passwordOverride: effectivePassword,
      mailing,
    });

    if ("error" in createdLeader) {
      const msg = createdLeader.error;
      const status = /already|registered|exists|duplicate/i.test(msg) ? 409 : 500;
      return NextResponse.json({ error: msg }, { status });
    }

    return NextResponse.json({
      ok: true,
      user_id: createdLeader.userId,
      email,
      role: "local_leader",
      form_id: formId,
      chapter_id: chapterId,
      chapter_created: chapterCreated,
    });
  }

  /* form_id === 4 — member */
  const { data: roleRow, error: roleLookupErr } = await admin
    .from("roles")
    .select("id")
    .eq("name", "member")
    .maybeSingle();

  if (roleLookupErr || !roleRow?.id) {
    return NextResponse.json({ error: "Role member not found." }, { status: 500 });
  }

  if (existingUserId) {
    const updated = await syncExistingUserFromFluentForm(admin, {
      userId: existingUserId,
      email,
      taskKey: "members",
      chapterId,
      firstName,
      lastName,
      phone,
      mailing,
      leaderRoleId: null,
      memberRoleId: roleRow.id as string,
    });
    if (updated.error) return NextResponse.json({ error: updated.error }, { status: 500 });
    return NextResponse.json({
      ok: true,
      user_id: existingUserId,
      email,
      role: "member",
      form_id: formId,
      chapter_id: chapterId,
      chapter_created: chapterCreated,
      updated_existing: true,
    });
  }

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password: effectivePassword,
    email_confirm: true,
    user_metadata: withExternalPasswordChangeFlag(
      {
        first_name: firstName,
        last_name: lastName,
        primary_chapter_id: chapterId,
        phone: phone || null,
        ...mailingForUserMetadata(mailing),
      },
      effectivePassword
    ),
  });

  if (createErr || !created.user?.id) {
    const msg = createErr?.message || "Could not create user.";
    const status = /already|registered|exists|duplicate/i.test(msg) ? 409 : 500;
    return NextResponse.json({ error: msg }, { status });
  }

  const newId = created.user.id;

  await admin.from("user_roles").delete().eq("user_id", newId);
  const { error: roleInsErr } = await admin.from("user_roles").insert({ user_id: newId, role_id: roleRow.id });

  if (roleInsErr) {
    await admin.auth.admin.deleteUser(newId);
    return NextResponse.json({ error: roleInsErr.message || "Could not assign role." }, { status: 500 });
  }

  const displayName = `${firstName} ${lastName}`.trim();
  const { error: authUpErr } = await admin.auth.admin.updateUserById(newId, {
    email_confirm: true,
    user_metadata: withExternalPasswordChangeFlag(
      {
        first_name: firstName,
        last_name: lastName,
        primary_chapter_id: chapterId,
        phone: phone || null,
        ...mailingForUserMetadata(mailing),
      },
      effectivePassword
    ),
  });
  if (authUpErr) {
    await admin.from("user_roles").delete().eq("user_id", newId);
    await admin.auth.admin.deleteUser(newId);
    return NextResponse.json(
      { error: authUpErr.message || "Could not confirm email / sync auth profile." },
      { status: 500 }
    );
  }

  const { error: profErr } = await admin
    .from("profiles")
    .update({
      first_name: firstName,
      last_name: lastName,
      display_name: displayName,
      primary_chapter_id: chapterId,
      ...(phone ? { phone } : {}),
      address_line: mailing.address_line,
      city: mailing.city,
      state: mailing.state,
      zip_code: mailing.zip_code,
    })
    .eq("id", newId);
  if (profErr) {
    await admin.from("user_roles").delete().eq("user_id", newId);
    await admin.auth.admin.deleteUser(newId);
    return NextResponse.json({ error: profErr.message || "Could not sync profile." }, { status: 500 });
  }

  const mirror = await ensureDashboardUserMirror(admin, {
    id: newId,
    email,
    firstName,
    lastName,
    displayName,
    primaryChapterId: chapterId,
    phone,
    mailing,
  });
  if (mirror.error) {
    await admin.from("user_roles").delete().eq("user_id", newId);
    await admin.auth.admin.deleteUser(newId);
    return NextResponse.json({ error: mirror.error }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    user_id: newId,
    email,
    role: "member",
    form_id: formId,
    chapter_id: chapterId,
    chapter_created: chapterCreated,
  });
}
