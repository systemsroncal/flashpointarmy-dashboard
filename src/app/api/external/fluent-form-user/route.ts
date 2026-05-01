import { NextResponse } from "next/server";
import {
  extractFormIdFromPayload,
  mergeNestedFormFields,
  parseFluentFlatRow,
  roleForFluentFormId,
} from "@/lib/external/fluent-form-user";
import { resolveChapterIdForExternalWebhook } from "@/lib/external/resolve-webhook-chapter";
import { createLocalLeaderUserForChapter } from "@/lib/import/create-local-leader-user";
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
  const { email, password, firstName, lastName, phone, primaryChapterId } = parseFluentFlatRow(flat);
  const systemUserId = process.env.FLUENT_FORM_SYSTEM_USER_ID?.trim() || null;

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "A valid email is required (Email or Email Address)." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }
  if (!firstName || !lastName) {
    return NextResponse.json({ error: "First and last name are required (or a single Name field)." }, { status: 400 });
  }

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

  const { data: dup } = await admin.from("dashboard_users").select("id").ilike("email", email).maybeSingle();
  if (dup?.id) {
    return NextResponse.json({ error: "This email is already registered." }, { status: 409 });
  }

  if (formId === 1) {
    const { data: roleRow, error: roleLookupErr } = await admin
      .from("roles")
      .select("id")
      .eq("name", "local_leader")
      .maybeSingle();
    if (roleLookupErr || !roleRow?.id) {
      return NextResponse.json({ error: "Role local_leader not found." }, { status: 500 });
    }

    const createdLeader = await createLocalLeaderUserForChapter(admin, {
      email,
      firstName,
      lastName,
      phone,
      chapterId,
      leaderRoleId: roleRow.id as string,
      passwordOverride: password,
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
    const msg = createErr?.message || "Could not create user.";
    const status = /already|registered|exists|duplicate/i.test(msg) ? 409 : 500;
    return NextResponse.json({ error: msg }, { status });
  }

  const newId = created.user.id;

  const { data: roleRow, error: roleLookupErr } = await admin
    .from("roles")
    .select("id")
    .eq("name", "member")
    .maybeSingle();

  if (roleLookupErr || !roleRow?.id) {
    await admin.auth.admin.deleteUser(newId);
    return NextResponse.json({ error: "Role member not found." }, { status: 500 });
  }

  await admin.from("user_roles").delete().eq("user_id", newId);
  const { error: roleInsErr } = await admin.from("user_roles").insert({ user_id: newId, role_id: roleRow.id });

  if (roleInsErr) {
    await admin.auth.admin.deleteUser(newId);
    return NextResponse.json({ error: roleInsErr.message || "Could not assign role." }, { status: 500 });
  }

  const displayName = `${firstName} ${lastName}`.trim();
  const { error: authUpErr } = await admin.auth.admin.updateUserById(newId, {
    email_confirm: true,
    user_metadata: {
      first_name: firstName,
      last_name: lastName,
      primary_chapter_id: chapterId,
      phone: phone || null,
    },
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
    })
    .eq("id", newId);
  if (profErr) {
    await admin.from("user_roles").delete().eq("user_id", newId);
    await admin.auth.admin.deleteUser(newId);
    return NextResponse.json({ error: profErr.message || "Could not sync profile." }, { status: 500 });
  }

  await admin
    .from("dashboard_users")
    .update({
      first_name: firstName,
      last_name: lastName,
      display_name: displayName,
      primary_chapter_id: chapterId,
      ...(phone ? { phone } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", newId);

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
