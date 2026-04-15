import { NextResponse } from "next/server";
import { loadUserRoleNames, isSuperAdminUser } from "@/lib/auth/user-roles";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(
  _req: Request,
  context: { params: Promise<{ userId: string }> }
) {
  const { userId } = await context.params;
  if (!UUID_RE.test(userId)) {
    return NextResponse.json({ error: "Invalid user id." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const callerRoles = await loadUserRoleNames(supabase, user.id);
  if (!isSuperAdminUser(callerRoles)) {
    return NextResponse.json(
      { error: "Only the super admin can assign the administrator role." },
      { status: 403 }
    );
  }

  try {
    const admin = createAdminClient();
    const targetRoles = await loadUserRoleNames(admin, userId);

    if (targetRoles.includes("super_admin")) {
      return NextResponse.json(
        { error: "This account is already a super admin." },
        { status: 400 }
      );
    }
    if (targetRoles.includes("admin")) {
      return NextResponse.json({ error: "This user is already an administrator." }, { status: 400 });
    }

    const eligible = targetRoles.some((n) => n === "member" || n === "local_leader");
    if (!eligible) {
      return NextResponse.json(
        {
          error:
            "Only members or local leaders can be promoted to administrator. Adjust roles in the database if needed.",
        },
        { status: 400 }
      );
    }

    const { data: roleRows, error: rolesErr } = await admin
      .from("roles")
      .select("id, name")
      .in("name", ["admin", "member", "local_leader"]);

    if (rolesErr || !roleRows?.length) {
      return NextResponse.json(
        { error: rolesErr?.message || "Could not load roles." },
        { status: 500 }
      );
    }

    const byName = new Map(roleRows.map((r) => [r.name, r.id] as const));
    const adminId = byName.get("admin");
    if (!adminId) {
      return NextResponse.json({ error: "Role admin not found." }, { status: 500 });
    }

    const stripIds = ["member", "local_leader"]
      .map((n) => byName.get(n))
      .filter((id): id is string => Boolean(id));

    for (const roleId of stripIds) {
      await admin.from("user_roles").delete().eq("user_id", userId).eq("role_id", roleId);
    }

    const { error: insErr } = await admin
      .from("user_roles")
      .insert({ user_id: userId, role_id: adminId });

    if (insErr) {
      return NextResponse.json(
        { error: insErr.message || "Could not assign administrator role." },
        { status: 500 }
      );
    }

    const nextRoles = targetRoles
      .filter((n) => n !== "member" && n !== "local_leader")
      .concat("admin");
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
