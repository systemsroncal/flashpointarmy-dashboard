import { NextResponse } from "next/server";
import { listRoleNamesByUserIds } from "@/lib/admin/dashboard-user-queries";
import { loadUserRoleNames } from "@/lib/auth/user-roles";
import {
  listMobilizeOwnerCandidateUserIds,
  loadMobilizeGroupCreatorPolicy,
} from "@/lib/mobilize/mobilize-roles";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";

type Ctx = { params: Promise<{ id: string }> };

function primaryRoleLabel(roleNames: string[]): string {
  if (roleNames.includes("super_admin")) return "Super admin";
  if (roleNames.includes("admin")) return "Administrator";
  if (roleNames.includes("sub_admin")) return "Sub administrator";
  if (roleNames.includes("local_leader")) return "Local leader";
  if (roleNames.includes("member")) return "Member";
  return roleNames[0] ?? "User";
}

export async function GET(_req: Request, ctx: Ctx) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;
  const { id } = await ctx.params;

  const roleNames = await loadUserRoleNames(auth.admin, auth.userId);
  if (!roleNames.includes("super_admin")) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { data: group } = await auth.admin
    .from("mobilize_groups")
    .select("created_by")
    .eq("id", id)
    .maybeSingle();

  const policy = await loadMobilizeGroupCreatorPolicy(auth.admin);
  const extraIds: string[] = [];
  if (group?.created_by) extraIds.push(String(group.created_by));

  const ids = await listMobilizeOwnerCandidateUserIds(auth.admin, policy, extraIds);
  if (!ids.length) {
    return NextResponse.json({ candidates: [], policy });
  }

  const { data: users } = await auth.admin
    .from("dashboard_users")
    .select("id, email, first_name, last_name, display_name")
    .in("id", ids);

  const rolesByUser = await listRoleNamesByUserIds(auth.admin, ids);

  const candidates = (users ?? []).map((u) => {
    const uid = u.id as string;
    const userRoles = rolesByUser.get(uid) ?? [];
    const name =
      [u.first_name, u.last_name].filter(Boolean).join(" ").trim() ||
      u.display_name?.trim() ||
      u.email;
    return {
      userId: uid,
      label: `${name} (${primaryRoleLabel(userRoles)})`,
      email: u.email as string,
      roleNames: userRoles,
    };
  });

  candidates.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));

  return NextResponse.json({ candidates, policy });
}
