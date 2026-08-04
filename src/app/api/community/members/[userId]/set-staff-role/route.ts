import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/server-session";
import { loadUserRoleNames, isSuperAdminUser } from "@/lib/auth/user-roles";
import { isProtectedSuperAdminUserId } from "@/lib/auth/protected-super-admin";
import { createAdminClient } from "@/utils/supabase/admin";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type StaffAssignableRole = "admin" | "sub_admin" | "super_admin";
type Body = { roleName?: StaffAssignableRole };

const STAFF_ROLES: StaffAssignableRole[] = ["admin", "sub_admin", "super_admin"];

export async function POST(
  req: Request,
  context: { params: Promise<{ userId: string }> }
) {
  const { userId } = await context.params;
  if (!UUID_RE.test(userId)) {
    return NextResponse.json({ error: "Invalid user id." }, { status: 400 });
  }

  if (isProtectedSuperAdminUserId(userId)) {
    return NextResponse.json(
      { error: "This account is permanently locked as super administrator." },
      { status: 403 }
    );
  }

  const authResult = await requireApiAuth();
  if ("response" in authResult) return authResult.response;
  const { supabase, user } = authResult;

  const callerRoles = await loadUserRoleNames(supabase, user.id);
  if (!isSuperAdminUser(callerRoles)) {
    return NextResponse.json(
      { error: "Only the super admin can change administrator roles." },
      { status: 403 }
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.roleName || !STAFF_ROLES.includes(body.roleName)) {
    return NextResponse.json({ error: "Invalid roleName." }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const targetRoles = await loadUserRoleNames(admin, userId);

    const hasStaffRole =
      targetRoles.includes("admin") ||
      targetRoles.includes("sub_admin") ||
      targetRoles.includes("super_admin");
    if (!hasStaffRole) {
      return NextResponse.json(
        { error: "User must already be an administrator, sub administrator, or super administrator." },
        { status: 400 }
      );
    }

    if (targetRoles.includes(body.roleName) && STAFF_ROLES.filter((r) => targetRoles.includes(r)).length === 1) {
      return NextResponse.json({ ok: true, role_names: [...targetRoles].sort() });
    }

    const { data: roleRows, error: rolesErr } = await admin
      .from("roles")
      .select("id, name")
      .in("name", STAFF_ROLES);

    if (rolesErr || !roleRows?.length) {
      return NextResponse.json(
        { error: rolesErr?.message || "Could not load roles." },
        { status: 500 }
      );
    }

    const byName = new Map(roleRows.map((r) => [r.name, r.id] as const));
    const nextRoleId = byName.get(body.roleName);
    if (!nextRoleId) {
      return NextResponse.json({ error: `Role ${body.roleName} not found.` }, { status: 500 });
    }

    for (const name of STAFF_ROLES) {
      const roleId = byName.get(name);
      if (roleId) {
        await admin.from("user_roles").delete().eq("user_id", userId).eq("role_id", roleId);
      }
    }

    const { error: insErr } = await admin
      .from("user_roles")
      .insert({ user_id: userId, role_id: nextRoleId });

    if (insErr) {
      return NextResponse.json(
        { error: insErr.message || "Could not update role." },
        { status: 500 }
      );
    }

    const nextRoles = targetRoles
      .filter((n) => !STAFF_ROLES.includes(n as StaffAssignableRole))
      .concat(body.roleName);
    const unique = [...new Set(nextRoles)].sort();

    return NextResponse.json({ ok: true, role_names: unique });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error.";
    if (msg.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      return NextResponse.json(
        { error: "Server is not configured for role updates (missing service role key)." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
