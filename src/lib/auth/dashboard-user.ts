import type { SupabaseClient } from "@supabase/supabase-js";
import { loadUserRoleNames } from "@/lib/auth/user-roles";

/** Row in public.dashboard_users (mirrors auth.users in Supabase dev). */
export type DashboardUser = {
  id: string;
  email: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  primary_chapter_id: string | null;
  /** From profiles.avatar_url when present */
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  /** Role slugs from `user_roles` + `roles` (e.g. member, local_leader, admin). */
  role_names: string[];
};

export async function loadDashboardUser(
  supabase: SupabaseClient,
  userId: string
): Promise<DashboardUser | null> {
  const { data: du, error } = await supabase
    .from("dashboard_users")
    .select(
      "id, email, display_name, first_name, last_name, primary_chapter_id, created_at, updated_at"
    )
    .eq("id", userId)
    .maybeSingle();

  if (error || !du) return null;

  const [{ data: prof, error: profErr }, role_names] = await Promise.all([
    supabase.from("profiles").select("avatar_url").eq("id", userId).maybeSingle(),
    loadUserRoleNames(supabase, userId),
  ]);

  let avatar_url: string | null = null;
  if (!profErr && prof && "avatar_url" in prof && prof.avatar_url != null) {
    avatar_url = String(prof.avatar_url);
  }

  return {
    ...(du as Omit<DashboardUser, "avatar_url" | "role_names">),
    avatar_url,
    role_names,
  };
}
