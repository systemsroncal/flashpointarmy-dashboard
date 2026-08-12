import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import {
  listAllDashboardUsers,
  listRoleNamesByUserIds,
} from "@/lib/admin/dashboard-user-queries";
import { isMobilizeSuperAdmin } from "@/lib/mobilize/mobilize-content-access";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";

export type SearchableUser = {
  id: string;
  label: string;
  email: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  state: string | null;
  avatar_url: string | null;
  roleNames: string[];
};

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

export async function GET(req: Request) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();
  const roleParam = searchParams.get("role");
  const excludeGroupId = searchParams.get("excludeGroupId");
  const limitParam = Number(searchParams.get("limit") ?? DEFAULT_LIMIT);
  const limit = Math.min(Math.max(Math.trunc(limitParam) || DEFAULT_LIMIT, 1), MAX_LIMIT);

  const allowed = await ensureMobilizeGroupManager(auth.admin, auth.userId, auth.roleNames);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  let users = await listAllDashboardUsers(auth.admin);

  if (q) {
    users = users.filter((u) => {
      const name = [u.first_name, u.last_name].filter(Boolean).join(" ").toLowerCase();
      const email = String(u.email ?? "").toLowerCase();
      const disp = String(u.display_name ?? "").toLowerCase();
      return name.includes(q) || email.includes(q) || disp.includes(q);
    });
  }

  if (excludeGroupId) {
    const { data: existingRows } = await auth.admin
      .from("mobilize_group_members")
      .select("user_id")
      .eq("group_id", excludeGroupId);
    const existingIds = new Set(
      ((existingRows ?? []) as { user_id: string }[]).map((r) => r.user_id)
    );
    if (existingIds.size) {
      users = users.filter((u) => !existingIds.has(u.id));
    }
  }

  users.sort((a, b) => {
    const an = [a.first_name, a.last_name].filter(Boolean).join(" ") || a.email || a.id;
    const bn = [b.first_name, b.last_name].filter(Boolean).join(" ") || b.email || b.id;
    return an.localeCompare(bn, undefined, { sensitivity: "base" });
  });
  users = users.slice(0, limit);

  let result: SearchableUser[] = users.map((u) => {
    const name = [u.first_name, u.last_name].filter(Boolean).join(" ").trim();
    const label = `${name || u.display_name?.trim() || u.email}`.trim();
    return {
      id: u.id,
      label,
      email: String(u.email ?? ""),
      display_name: u.display_name ?? null,
      first_name: u.first_name ?? null,
      last_name: u.last_name ?? null,
      state: u.state ?? null,
      avatar_url: null,
      roleNames: [],
    };
  });

  const ids = result.map((u) => u.id);
  if (ids.length) {
    const [rolesByUser, { data: profRows }] = await Promise.all([
      listRoleNamesByUserIds(auth.admin, ids),
      auth.admin.from("profiles").select("id, avatar_url").in("id", ids),
    ]);
    const avatarByUser = new Map(
      ((profRows ?? []) as { id: string; avatar_url: string | null }[]).map((p) => [
        p.id,
        p.avatar_url ?? null,
      ])
    );
    result = result.map((u) => ({
      ...u,
      avatar_url: avatarByUser.get(u.id) ?? null,
      roleNames: rolesByUser.get(u.id) ?? [],
    }));
  }

  if (roleParam) {
    result = result.filter((u) => u.roleNames.includes(roleParam));
  }

  return NextResponse.json({ users: result });
}

/**
 * Only site staff (admin / super_admin) OR group leaders / group owners / chapter owners
 * may enumerate all dashboard users for member-add flows. Verifies that non-staff callers
 * lead or own at least one mobilize group before exposing the wider user directory.
 */
async function ensureMobilizeGroupManager(
  admin: SupabaseClient,
  userId: string,
  roleNames: string[]
): Promise<boolean> {
  if (isMobilizeSuperAdmin(roleNames) || roleNames.includes("admin")) {
    return true;
  }

  const { data: ownedGroups } = await admin
    .from("mobilize_groups")
    .select("id")
    .eq("created_by", userId)
    .limit(1);
  if (ownedGroups && (ownedGroups as { id: string }[]).length > 0) {
    return true;
  }

  const { data: ledMembers } = await admin
    .from("mobilize_group_members")
    .select("id")
    .eq("user_id", userId)
    .eq("member_role", "leader")
    .eq("membership_status", "approved")
    .limit(1);
  if (ledMembers && (ledMembers as { id: string }[]).length > 0) {
    return true;
  }

  return false;
}
