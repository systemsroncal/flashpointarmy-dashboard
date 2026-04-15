import type { SupabaseClient } from "@supabase/supabase-js";

export async function loadUserRoleNames(
  supabase: SupabaseClient,
  userId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("roles ( name )")
    .eq("user_id", userId);

  if (error || !data) return [];

  const names: string[] = [];
  for (const row of data as unknown as { roles: { name: string } | null }[]) {
    const n = row.roles?.name;
    if (n) names.push(n);
  }
  return names;
}

export function isElevatedRole(roleNames: string[]): boolean {
  return roleNames.some((n) => n === "super_admin" || n === "admin");
}

export function isMemberOrLeader(roleNames: string[]): boolean {
  return roleNames.some((n) => n === "member" || n === "local_leader");
}
