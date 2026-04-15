import { NextResponse } from "next/server";
import { MODULE_SLUGS } from "@/config/modules";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import {
  isAdminButNotSuper,
  isSuperAdminUser,
  loadUserRoleNames,
} from "@/lib/auth/user-roles";
import { can } from "@/types/permissions";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type PatchBody = {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  primaryChapterId?: string;
};

async function getSessionAndPermissions() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized." }, { status: 401 }) };
  }
  const permissions = await loadModulePermissions(supabase, user.id);
  return { user, permissions, supabase };
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ userId: string }> }
) {
  const { userId } = await context.params;
  if (!UUID_RE.test(userId)) {
    return NextResponse.json({ error: "Invalid user id." }, { status: 400 });
  }

  const session = await getSessionAndPermissions();
  if ("error" in session) return session.error;
  const { permissions } = session;

  const canPatch =
    can(permissions, MODULE_SLUGS.community, "update") ||
    can(permissions, MODULE_SLUGS.leaders, "update");
  if (!canPatch) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  let body: PatchBody;
  try {
    body = (await req.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const firstName = (body.firstName ?? "").trim();
  const lastName = (body.lastName ?? "").trim();
  const phoneRaw = body.phone;
  const phone =
    phoneRaw === null || phoneRaw === undefined
      ? undefined
      : String(phoneRaw).trim() || null;
  const primaryChapterId = (body.primaryChapterId ?? "").trim();

  if (!firstName || !lastName) {
    return NextResponse.json(
      { error: "First name and last name are required." },
      { status: 400 }
    );
  }
  if (!UUID_RE.test(primaryChapterId)) {
    return NextResponse.json({ error: "Select a valid primary chapter." }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const displayName = `${firstName} ${lastName}`.trim();

    const profileUpdate: Record<string, unknown> = {
      first_name: firstName,
      last_name: lastName,
      display_name: displayName,
      primary_chapter_id: primaryChapterId,
    };
    if (phone !== undefined) profileUpdate.phone = phone;

    const { error: profileErr } = await admin.from("profiles").update(profileUpdate).eq("id", userId);

    if (profileErr) {
      return NextResponse.json(
        { error: profileErr.message || "Could not update profile." },
        { status: 500 }
      );
    }

    if (phone !== undefined) {
      const { error: duErr } = await admin
        .from("dashboard_users")
        .update({ phone })
        .eq("id", userId);
      if (duErr) {
        return NextResponse.json(
          { error: duErr.message || "Could not update user directory." },
          { status: 500 }
        );
      }
    }

    const { data: authUser } = await admin.auth.admin.getUserById(userId);
    const existingMeta = (authUser.user?.user_metadata ?? {}) as Record<string, unknown>;
    const meta: Record<string, unknown> = {
      ...existingMeta,
      first_name: firstName,
      last_name: lastName,
      primary_chapter_id: primaryChapterId,
    };
    if (phone !== undefined) meta.phone = phone;

    const { error: authErr } = await admin.auth.admin.updateUserById(userId, {
      user_metadata: meta,
    });

    if (authErr) {
      return NextResponse.json(
        { error: authErr.message || "Could not sync auth metadata." },
        { status: 500 }
      );
    }

    const { data: duRow } = await admin
      .from("dashboard_users")
      .select("phone")
      .eq("id", userId)
      .maybeSingle();

    return NextResponse.json({
      ok: true,
      user: {
        id: userId,
        first_name: firstName,
        last_name: lastName,
        display_name: displayName,
        primary_chapter_id: primaryChapterId,
        phone: (duRow as { phone?: string | null } | null)?.phone ?? phone ?? null,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error.";
    if (msg.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      return NextResponse.json(
        { error: "Server is not configured for admin user updates (missing service role key)." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ userId: string }> }
) {
  const { userId } = await context.params;
  if (!UUID_RE.test(userId)) {
    return NextResponse.json({ error: "Invalid user id." }, { status: 400 });
  }

  const session = await getSessionAndPermissions();
  if ("error" in session) return session.error;
  const { user, permissions } = session;

  const canRemove =
    can(permissions, MODULE_SLUGS.community, "delete") ||
    can(permissions, MODULE_SLUGS.leaders, "delete");
  if (!canRemove) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  if (userId === user.id) {
    return NextResponse.json({ error: "You cannot delete your own account." }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const [callerRoles, targetRoles] = await Promise.all([
      loadUserRoleNames(session.supabase, user.id),
      loadUserRoleNames(admin, userId),
    ]);

    if (isSuperAdminUser(targetRoles)) {
      return NextResponse.json(
        { error: "Super admin accounts cannot be deleted from the dashboard." },
        { status: 403 }
      );
    }
    if (isAdminButNotSuper(callerRoles) && targetRoles.includes("admin")) {
      return NextResponse.json(
        { error: "Admins cannot delete other administrator accounts." },
        { status: 403 }
      );
    }

    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) {
      return NextResponse.json(
        { error: error.message || "Could not delete user." },
        { status: 500 }
      );
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error.";
    if (msg.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      return NextResponse.json(
        { error: "Server is not configured for user deletion (missing service role key)." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
