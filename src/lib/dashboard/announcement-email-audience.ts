import type { SupabaseClient } from "@supabase/supabase-js";
import { chunkIdsForInQuery, listAllDashboardUsers } from "@/lib/admin/dashboard-user-queries";
import type { AnnouncementAudience } from "@/lib/dashboard/announcements-types";

const ADMIN_VIEW_ROLES = new Set(["super_admin", "admin", "sub_admin"]);

function isPureMember(roleNames: string[]): boolean {
  const set = new Set(roleNames);
  if (!set.has("member")) return false;
  if (set.has("local_leader")) return false;
  for (const r of ADMIN_VIEW_ROLES) {
    if (set.has(r)) return false;
  }
  return true;
}

export function userMatchesAnnouncementAudience(
  roleNames: string[],
  audience: AnnouncementAudience
): boolean {
  switch (audience) {
    case "everyone":
      return true;
    case "leaders":
      return roleNames.includes("local_leader");
    case "members":
      return isPureMember(roleNames);
    case "admins":
      return roleNames.some((r) => ADMIN_VIEW_ROLES.has(r));
    case "specific_users":
      return false;
    default:
      return false;
  }
}

export async function resolveAnnouncementEmailUserIds(
  admin: SupabaseClient,
  opts: {
    audience: AnnouncementAudience;
    announcementId: string;
    targetUserId?: string | null;
  }
): Promise<string[]> {
  if (opts.targetUserId) {
    return [opts.targetUserId];
  }

  if (opts.audience === "specific_users") {
    const { data, error } = await admin
      .from("dashboard_announcement_recipients")
      .select("user_id")
      .eq("announcement_id", opts.announcementId);
    if (error) throw new Error(error.message);
    const ids = [...new Set((data ?? []).map((r) => String((r as { user_id: string }).user_id)))];
    return ids;
  }

  const rolesByUser = new Map<string, string[]>();
  const ROLE_PAGE = 1000;
  for (let from = 0; ; from += ROLE_PAGE) {
    const { data: roleRows, error: roleErr } = await admin
      .from("user_roles")
      .select("user_id, roles(name)")
      .range(from, from + ROLE_PAGE - 1);
    if (roleErr) throw new Error(roleErr.message);
    const page = roleRows ?? [];
    if (!page.length) break;
    for (const row of page) {
      const uid = row.user_id as string;
      const roleName = (row.roles as { name?: string } | null)?.name;
      if (!roleName) continue;
      const list = rolesByUser.get(uid) ?? [];
      list.push(roleName);
      rolesByUser.set(uid, list);
    }
    if (page.length < ROLE_PAGE) break;
  }

  if (opts.audience === "everyone") {
    const users = await listAllDashboardUsers(admin);
    return users.map((u) => u.id);
  }

  const matched: string[] = [];
  for (const [userId, roleNames] of rolesByUser) {
    if (userMatchesAnnouncementAudience(roleNames, opts.audience)) {
      matched.push(userId);
    }
  }

  return matched;
}

export async function insertAnnouncementEmailQueueRows(
  admin: SupabaseClient,
  jobId: string,
  announcementId: string,
  userIds: string[]
): Promise<number> {
  if (!userIds.length) return 0;
  let inserted = 0;
  for (const part of chunkIdsForInQuery(userIds, 200)) {
    const rows = part.map((user_id) => ({
      job_id: jobId,
      announcement_id: announcementId,
      user_id,
      status: "pending" as const,
    }));
    const { error } = await admin.from("dashboard_announcement_email_queue").insert(rows);
    if (error) throw new Error(error.message);
    inserted += part.length;
  }
  return inserted;
}