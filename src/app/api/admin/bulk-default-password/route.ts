import { BULK_DEFAULT_PASSWORD_CONFIRM_PHRASE } from "@/lib/admin/bulk-default-password-phrase";
import { isSuperAdminUser, loadUserRoleNames } from "@/lib/auth/user-roles";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/server-session";

export const maxDuration = 300;

async function loadExcludedAdminUserIds(admin: ReturnType<typeof createAdminClient>) {
  const { data: roleRows } = await admin.from("roles").select("id").in("name", ["admin", "super_admin"]);
  const roleIds = (roleRows ?? []).map((r: { id: string }) => r.id);
  const excluded = new Set<string>();
  if (roleIds.length > 0) {
    const { data: ur } = await admin.from("user_roles").select("user_id").in("role_id", roleIds);
    for (const row of ur ?? []) {
      excluded.add(String((row as { user_id: string }).user_id));
    }
  }
  return excluded;
}

/** Preview how many auth users would be affected (super admin only). */
export async function GET() {
  const authResult = await requireApiAuth();
  if ("response" in authResult) return authResult.response;
  const { supabase, user: caller } = authResult;

  const callerRoles = await loadUserRoleNames(supabase, caller.id);
  if (!isSuperAdminUser(callerRoles)) {
    return NextResponse.json({ error: "Only super administrators can run this action." }, { status: 403 });
  }

  const admin = createAdminClient();
  const excluded = await loadExcludedAdminUserIds(admin);

  let totalAuthUsers = 0;
  let nonAdmin = 0;
  let neverSignedInNonAdmin = 0;
  let page = 1;
  const perPage = 200;

  for (;;) {
    const { data: pageData, error: listErr } = await admin.auth.admin.listUsers({ page, perPage });
    if (listErr) {
      return NextResponse.json({ error: listErr.message }, { status: 500 });
    }
    const users = pageData?.users ?? [];
    if (users.length === 0) break;

    for (const u of users) {
      totalAuthUsers += 1;
      if (excluded.has(u.id)) continue;
      nonAdmin += 1;
      if (!u.last_sign_in_at) neverSignedInNonAdmin += 1;
    }

    if (users.length < perPage) break;
    page += 1;
  }

  return NextResponse.json({
    totalAuthUsers,
    nonAdmin,
    neverSignedInNonAdmin,
    skippedAdmin: totalAuthUsers - nonAdmin,
  });
}

type PostBody = {
  password?: string;
  confirmPassword?: string;
  confirmPhrase?: string;
  /** When true, only users with no `last_sign_in_at` (never logged in). */
  onlyNeverSignedIn?: boolean;
};

export async function POST(req: Request) {
  const authResult = await requireApiAuth();
  if ("response" in authResult) return authResult.response;
  const { supabase, user: caller } = authResult;

  const callerRoles = await loadUserRoleNames(supabase, caller.id);
  if (!isSuperAdminUser(callerRoles)) {
    return NextResponse.json({ error: "Only super administrators can run this action." }, { status: 403 });
  }

  let body: PostBody;
  try {
    body = (await req.json()) as PostBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const password = String(body.password ?? "").trim();
  const confirmPassword = String(body.confirmPassword ?? "").trim();
  const confirmPhrase = String(body.confirmPhrase ?? "").trim();
  const onlyNeverSignedIn = body.onlyNeverSignedIn === true;

  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }
  if (password !== confirmPassword) {
    return NextResponse.json({ error: "Password confirmation does not match." }, { status: 400 });
  }
  if (confirmPhrase !== BULK_DEFAULT_PASSWORD_CONFIRM_PHRASE) {
    return NextResponse.json(
      {
        error: `Type the confirmation phrase exactly: ${BULK_DEFAULT_PASSWORD_CONFIRM_PHRASE}`,
      },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const excluded = await loadExcludedAdminUserIds(admin);

  let updated = 0;
  let skippedAdmin = 0;
  let skippedSignedIn = 0;
  let failed = 0;
  let page = 1;
  const perPage = 200;

  for (;;) {
    const { data: pageData, error: listErr } = await admin.auth.admin.listUsers({ page, perPage });
    if (listErr) {
      return NextResponse.json({ error: listErr.message }, { status: 500 });
    }
    const users = pageData?.users ?? [];
    if (users.length === 0) break;

    for (const u of users) {
      if (excluded.has(u.id)) {
        skippedAdmin += 1;
        continue;
      }
      if (onlyNeverSignedIn && u.last_sign_in_at) {
        skippedSignedIn += 1;
        continue;
      }
      const prevMeta = (u.user_metadata ?? {}) as Record<string, unknown>;
      const user_metadata = { ...prevMeta, require_password_change: true };
      const { error: upErr } = await admin.auth.admin.updateUserById(u.id, {
        password,
        user_metadata,
      });
      if (upErr) {
        failed += 1;
        continue;
      }
      updated += 1;
    }

    if (users.length < perPage) break;
    page += 1;
  }

  return NextResponse.json({
    ok: true,
    updated,
    skippedAdmin,
    skippedSignedIn,
    failed,
    onlyNeverSignedIn,
  });
}
