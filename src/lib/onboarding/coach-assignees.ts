import {
  listDashboardUsersByIdsWithAuthFallback,
} from "@/lib/admin/dashboard-user-queries";
import type { AdminStaffOption } from "@/lib/onboarding/onboarding-records";
import { listAdminStaffOptions } from "@/lib/onboarding/onboarding-records";
import type { SupabaseClient } from "@supabase/supabase-js";

function displayNameFromUser(u: {
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  email: string;
}): string {
  return (
    [u.first_name, u.last_name].filter(Boolean).join(" ").trim() ||
    u.display_name?.trim() ||
    u.email.split("@")[0] ||
    "Coach"
  );
}

export async function listCoachAssigneeUserIds(admin: SupabaseClient): Promise<string[]> {
  const { data } = await admin
    .from("onboarding_coach_assignees")
    .select("user_id")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  return (data ?? []).map((row) => row.user_id as string);
}

export async function listCoachAssigneeOptions(admin: SupabaseClient): Promise<AdminStaffOption[]> {
  const ids = await listCoachAssigneeUserIds(admin);
  if (!ids.length) return [];

  const users = await listDashboardUsersByIdsWithAuthFallback(admin, ids, { healMirror: false });
  const byId = new Map(users.map((u) => [u.id, u]));
  return ids
    .map((id) => {
      const u = byId.get(id);
      if (!u) return null;
      return {
        id: u.id,
        label: displayNameFromUser(u),
        email: u.email,
      };
    })
    .filter((o): o is AdminStaffOption => o !== null);
}

/** Coaches configured in Settings, or all administrators when none are selected. */
export async function listCoachOptionsForAssignment(admin: SupabaseClient): Promise<AdminStaffOption[]> {
  const coaches = await listCoachAssigneeOptions(admin);
  if (coaches.length) return coaches;
  return listAdminStaffOptions(admin);
}

export async function saveCoachAssignees(
  admin: SupabaseClient,
  userIds: string[]
): Promise<void> {
  const unique = [...new Set(userIds.filter(Boolean))];
  const { data: existing } = await admin.from("onboarding_coach_assignees").select("user_id");
  const existingIds = new Set((existing ?? []).map((r) => r.user_id as string));
  const nextIds = new Set(unique);

  const toDelete = [...existingIds].filter((id) => !nextIds.has(id));
  if (toDelete.length) {
    await admin.from("onboarding_coach_assignees").delete().in("user_id", toDelete);
  }

  const now = new Date().toISOString();
  for (let i = 0; i < unique.length; i++) {
    const user_id = unique[i]!;
    await admin.from("onboarding_coach_assignees").upsert(
      {
        user_id,
        sort_order: i,
        updated_at: now,
      },
      { onConflict: "user_id" }
    );
  }
}
