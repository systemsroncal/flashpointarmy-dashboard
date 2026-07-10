import { NextResponse } from "next/server";
import { MODULE_SLUGS } from "@/config/modules";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import {
  isAdminButNotSuper,
  isChapterStaffRole,
  isSuperAdminUser,
  loadUserRoleNames,
} from "@/lib/auth/user-roles";
import { can } from "@/types/permissions";
import { usStateByCode } from "@/data/usStates";
import { createAdminClient } from "@/utils/supabase/admin";
import { getApiSessionWithPermissions } from "@/lib/auth/server-session";
import { createClient } from "@/utils/supabase/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type PatchBody = {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  primaryChapterId?: string;
  addressLine?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  /** Admin/super_admin only (enforced server-side). Minimum 8 characters when sent. */
  newPassword?: string;
};

async function getSessionAndPermissions() {
  return getApiSessionWithPermissions();
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
  const { user, permissions, supabase } = session;

  const admin = createAdminClient();
  const [targetRoles, callerRoles] = await Promise.all([
    loadUserRoleNames(admin, userId),
    loadUserRoleNames(supabase, user.id),
  ]);
  const targetIsAdminDirectory =
    targetRoles.includes("admin") ||
    targetRoles.includes("super_admin") ||
    targetRoles.includes("sub_admin");

  const canPatchCommunity =
    can(permissions, MODULE_SLUGS.community, "update") ||
    can(permissions, MODULE_SLUGS.leaders, "update");
  const canPatchAdmins = can(permissions, MODULE_SLUGS.admins, "update");

  if (targetIsAdminDirectory) {
    if (!canPatchAdmins) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }
    if (isSuperAdminUser(targetRoles) && !isSuperAdminUser(callerRoles)) {
      return NextResponse.json(
        { error: "Only super admins can edit super admin accounts." },
        { status: 403 }
      );
    }
  } else if (!canPatchCommunity) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  if (!targetIsAdminDirectory && !isChapterStaffRole(callerRoles)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  let body: PatchBody;
  try {
    body = (await req.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const newPasswordProvided =
    body.newPassword !== undefined && String(body.newPassword).trim() !== "";
  const newPassword = newPasswordProvided ? String(body.newPassword).trim() : "";

  if (newPasswordProvided) {
    if (!isChapterStaffRole(callerRoles)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }
    if (isSuperAdminUser(targetRoles) && !isSuperAdminUser(callerRoles)) {
      return NextResponse.json(
        { error: "Only super admins can change this user's password." },
        { status: 403 }
      );
    }
    if (
      !isSuperAdminUser(callerRoles) &&
      (targetRoles.includes("admin") ||
        targetRoles.includes("sub_admin") ||
        targetRoles.includes("super_admin"))
    ) {
      return NextResponse.json(
        { error: "Only super admins can change administrator passwords." },
        { status: 403 }
      );
    }
    if (isAdminButNotSuper(callerRoles) && targetRoles.includes("admin")) {
      return NextResponse.json(
        { error: "Admins cannot change another administrator's password." },
        { status: 403 }
      );
    }
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }
  }

  const firstName = (body.firstName ?? "").trim();
  const lastName = (body.lastName ?? "").trim();
  const phoneRaw = body.phone;
  const phone =
    phoneRaw === null || phoneRaw === undefined
      ? undefined
      : String(phoneRaw).trim() || null;
  const primaryChapterId = (body.primaryChapterId ?? "").trim();

  const address_line =
    body.addressLine !== undefined
      ? String(body.addressLine ?? "").trim() || null
      : undefined;
  const city =
    body.city !== undefined ? String(body.city ?? "").trim() || null : undefined;
  const zip_code =
    body.zipCode !== undefined ? String(body.zipCode ?? "").trim() || null : undefined;

  let stateCode: string | null | undefined = undefined;
  if ("state" in body) {
    if (body.state === null || body.state === "") {
      stateCode = null;
    } else {
      const s = String(body.state).trim();
      if (!s) stateCode = null;
      else {
        const u = usStateByCode(s);
        if (!u) {
          return NextResponse.json({ error: "Invalid US state." }, { status: 400 });
        }
        stateCode = u.code;
      }
    }
  }

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
    const displayName = `${firstName} ${lastName}`.trim();

    const profileUpdate: Record<string, unknown> = {
      first_name: firstName,
      last_name: lastName,
      display_name: displayName,
      primary_chapter_id: primaryChapterId,
    };
    if (phone !== undefined) profileUpdate.phone = phone;
    if (address_line !== undefined) profileUpdate.address_line = address_line;
    if (city !== undefined) profileUpdate.city = city;
    if (stateCode !== undefined) profileUpdate.state = stateCode;
    if (zip_code !== undefined) profileUpdate.zip_code = zip_code;

    if ("dateOfBirth" in body) {
      const raw = body.dateOfBirth;
      if (raw === null || raw === "") {
        profileUpdate.date_of_birth = null;
      } else {
        const dob = String(raw).trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
          return NextResponse.json({ error: "Invalid date of birth." }, { status: 400 });
        }
        profileUpdate.date_of_birth = dob;
      }
    }
    if ("gender" in body) {
      const raw = body.gender;
      if (raw === null || raw === "") {
        profileUpdate.gender = null;
      } else {
        const g = String(raw).trim().toLowerCase();
        if (g !== "male" && g !== "female") {
          return NextResponse.json({ error: "Gender must be male or female." }, { status: 400 });
        }
        profileUpdate.gender = g;
      }
    }

    const { error: profileErr } = await admin.from("profiles").update(profileUpdate).eq("id", userId);

    if (profileErr) {
      return NextResponse.json(
        { error: profileErr.message || "Could not update profile." },
        { status: 500 }
      );
    }

    const duUpdate: Record<string, unknown> = {
      first_name: firstName,
      last_name: lastName,
      display_name: displayName,
      primary_chapter_id: primaryChapterId,
      updated_at: new Date().toISOString(),
    };
    if (phone !== undefined) duUpdate.phone = phone;
    if (address_line !== undefined) duUpdate.address_line = address_line;
    if (city !== undefined) duUpdate.city = city;
    if (stateCode !== undefined) duUpdate.state = stateCode;
    if (zip_code !== undefined) duUpdate.zip_code = zip_code;

    const { error: duErr } = await admin.from("dashboard_users").update(duUpdate).eq("id", userId);
    if (duErr) {
      return NextResponse.json(
        { error: duErr.message || "Could not update user directory." },
        { status: 500 }
      );
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
    if (address_line !== undefined) meta.address_line = address_line;
    if (city !== undefined) meta.city = city;
    if (stateCode !== undefined) meta.state = stateCode;
    if (zip_code !== undefined) meta.zip_code = zip_code;

    const { error: authErr } = await admin.auth.admin.updateUserById(userId, {
      user_metadata: meta,
      ...(newPasswordProvided ? { password: newPassword } : {}),
    });

    if (authErr) {
      return NextResponse.json(
        { error: authErr.message || "Could not sync auth metadata." },
        { status: 500 }
      );
    }

    const { data: duRow } = await admin
      .from("dashboard_users")
      .select("phone, address_line, city, state, zip_code")
      .eq("id", userId)
      .maybeSingle();

    const du = duRow as {
      phone?: string | null;
      address_line?: string | null;
      city?: string | null;
      state?: string | null;
      zip_code?: string | null;
    } | null;

    const { data: profileRow } = await admin
      .from("profiles")
      .select("date_of_birth, gender, avatar_url")
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
        phone: du?.phone ?? phone ?? null,
        address_line: du?.address_line ?? address_line ?? null,
        city: du?.city ?? city ?? null,
        state: du?.state ?? stateCode ?? null,
        zip_code: du?.zip_code ?? zip_code ?? null,
        date_of_birth: (profileRow?.date_of_birth as string | null) ?? null,
        gender: (profileRow?.gender as string | null) ?? null,
        avatar_url: (profileRow?.avatar_url as string | null) ?? null,
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

  if (userId === user.id) {
    return NextResponse.json({ error: "You cannot delete your own account." }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const [callerRoles, targetRoles] = await Promise.all([
      loadUserRoleNames(session.supabase, user.id),
      loadUserRoleNames(admin, userId),
    ]);

    const targetIsAdminDirectory =
      targetRoles.includes("admin") || targetRoles.includes("super_admin");
    const canRemoveCommunity =
      can(permissions, MODULE_SLUGS.community, "delete") ||
      can(permissions, MODULE_SLUGS.leaders, "delete");
    const canRemoveAdmins = can(permissions, MODULE_SLUGS.admins, "delete");

    if (targetIsAdminDirectory) {
      if (!canRemoveAdmins) {
        return NextResponse.json({ error: "Forbidden." }, { status: 403 });
      }
    } else if (!canRemoveCommunity) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    if (!targetIsAdminDirectory && !isChapterStaffRole(callerRoles)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

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
