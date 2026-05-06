import type { SupabaseClient } from "@supabase/supabase-js";

type DashboardUserListRow = {
  id: string;
  email: string;
  phone: string | null;
  display_name: string | null;
  created_at: string;
  first_name: string | null;
  last_name: string | null;
  primary_chapter_id: string | null;
};

export type ProfileMailRow = {
  id: string;
  avatar_url: string | null;
  phone: string | null;
  address_line: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
};

export type RoleJoinRow = {
  user_id: string;
  roles: { name: string } | { name: string }[] | null;
};

const PAGE_SIZE = 1000;
const IN_CHUNK = 400;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export async function listAllDashboardUsers(admin: SupabaseClient): Promise<DashboardUserListRow[]> {
  const out: DashboardUserListRow[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const to = from + PAGE_SIZE - 1;
    const { data } = await admin
      .from("dashboard_users")
      .select("id, email, phone, display_name, created_at, first_name, last_name, primary_chapter_id")
      .order("email")
      .range(from, to);
    const rows = (data ?? []) as DashboardUserListRow[];
    out.push(...rows);
    if (rows.length < PAGE_SIZE) break;
  }
  return out;
}

export async function listDashboardUsersByIds(
  admin: SupabaseClient,
  ids: string[]
): Promise<DashboardUserListRow[]> {
  if (!ids.length) return [];
  const out: DashboardUserListRow[] = [];
  for (const part of chunk(ids, IN_CHUNK)) {
    const { data } = await admin
      .from("dashboard_users")
      .select("id, email, phone, display_name, created_at, first_name, last_name, primary_chapter_id")
      .in("id", part);
    out.push(...((data ?? []) as DashboardUserListRow[]));
  }
  out.sort((a, b) => String(a.email || "").localeCompare(String(b.email || ""), undefined, { sensitivity: "base" }));
  return out;
}

export async function listProfilesByIds(admin: SupabaseClient, ids: string[]): Promise<ProfileMailRow[]> {
  if (!ids.length) return [];
  const out: ProfileMailRow[] = [];
  for (const part of chunk(ids, IN_CHUNK)) {
    const { data } = await admin
      .from("profiles")
      .select("id, avatar_url, phone, address_line, city, state, zip_code")
      .in("id", part);
    out.push(...((data ?? []) as ProfileMailRow[]));
  }
  return out;
}

export async function listUserRoleJoinsByUserIds(
  admin: SupabaseClient,
  ids: string[]
): Promise<RoleJoinRow[]> {
  if (!ids.length) return [];
  const out: RoleJoinRow[] = [];
  for (const part of chunk(ids, IN_CHUNK)) {
    const { data } = await admin
      .from("user_roles")
      .select("user_id, roles(name)")
      .in("user_id", part);
    out.push(...((data ?? []) as RoleJoinRow[]));
  }
  return out;
}

