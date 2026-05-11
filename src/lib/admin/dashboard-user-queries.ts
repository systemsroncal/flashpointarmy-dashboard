import type { SupabaseClient, User } from "@supabase/supabase-js";

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
  /** Prefer over `dashboard_users.primary_chapter_id` when the mirror row is missing or stale. */
  primary_chapter_id: string | null;
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
/** Smaller batches for `user_roles` / role maps: long `.in(uuid…)` lists can exceed PostgREST URL limits. */
const USER_ROLE_NAME_CHUNK = 80;

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

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function dashboardRowFromAuthUser(user: User): DashboardUserListRow | null {
  if (!user.id) return null;
  const email = String(user.email ?? "").trim();
  if (!email) return null;
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const fn = String(meta.first_name ?? "").trim() || null;
  const ln = String(meta.last_name ?? "").trim() || null;
  const combined = [fn, ln].filter(Boolean).join(" ").trim();
  const disp = combined || email.split("@")[0] || null;
  const phoneRaw = String(meta.phone ?? "").trim();
  const phone = phoneRaw || null;
  let primary_chapter_id: string | null = null;
  const chRaw = meta.primary_chapter_id;
  if (chRaw != null) {
    const ch = String(chRaw).trim();
    if (UUID_RE.test(ch)) primary_chapter_id = ch;
  }
  const created_at =
    typeof user.created_at === "string"
      ? user.created_at
      : user.created_at
        ? new Date(user.created_at).toISOString()
        : new Date().toISOString();
  return {
    id: user.id,
    email,
    phone,
    display_name: disp,
    created_at,
    first_name: fn,
    last_name: ln,
    primary_chapter_id,
  };
}

/**
 * Like {@link listDashboardUsersByIds}, but fills gaps from Auth for user IDs that have roles
 * (e.g. `local_leader`) yet no row in `dashboard_users` — e.g. trigger did not run after sign-up.
 * Optionally upserts those rows to heal the mirror (`healMirror`, default true).
 */
export async function listDashboardUsersByIdsWithAuthFallback(
  admin: SupabaseClient,
  ids: string[],
  opts?: { healMirror?: boolean }
): Promise<DashboardUserListRow[]> {
  const healMirror = opts?.healMirror !== false;
  if (!ids.length) return [];
  const fromMirror = await listDashboardUsersByIds(admin, ids);
  const byId = new Map(fromMirror.map((r) => [r.id, r]));
  const missing = ids.filter((id) => !byId.has(id));
  if (missing.length === 0) return fromMirror;

  const toHeal: DashboardUserListRow[] = [];
  const AUTH_CHUNK = 15;
  for (const part of chunk(missing, AUTH_CHUNK)) {
    const results = await Promise.all(part.map((id) => admin.auth.admin.getUserById(id)));
    for (const res of results) {
      const u = res.data?.user;
      if (!u) continue;
      const row = dashboardRowFromAuthUser(u);
      if (!row) continue;
      byId.set(row.id, row);
      toHeal.push(row);
    }
  }

  if (healMirror && toHeal.length > 0) {
    const now = new Date().toISOString();
    for (const batch of chunk(toHeal, 100)) {
      await admin.from("dashboard_users").upsert(
        batch.map((row) => ({
          id: row.id,
          email: row.email,
          first_name: row.first_name,
          last_name: row.last_name,
          display_name: row.display_name,
          primary_chapter_id: row.primary_chapter_id,
          phone: row.phone,
          created_at: row.created_at,
          updated_at: now,
        })),
        { onConflict: "id" }
      );
    }
  }

  const merged = [...byId.values()];
  merged.sort((a, b) =>
    String(a.email || "").localeCompare(String(b.email || ""), undefined, { sensitivity: "base" })
  );
  return merged;
}

export async function listProfilesByIds(admin: SupabaseClient, ids: string[]): Promise<ProfileMailRow[]> {
  if (!ids.length) return [];
  const out: ProfileMailRow[] = [];
  for (const part of chunk(ids, IN_CHUNK)) {
    const { data } = await admin
      .from("profiles")
      .select("id, avatar_url, primary_chapter_id, phone, address_line, city, state, zip_code")
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

/**
 * Role slugs (`roles.name`) per user. Prefer this over {@link listUserRoleJoinsByUserIds} for
 * large user lists: the `roles(name)` embed can return null names depending on PostgREST/RLS shape.
 */
export async function listRoleNamesByUserIds(
  admin: SupabaseClient,
  ids: string[]
): Promise<Map<string, string[]>> {
  const out = new Map<string, string[]>();
  if (!ids.length) return out;
  for (const part of chunk(ids, USER_ROLE_NAME_CHUNK)) {
    const { data: urRows, error: urErr } = await admin
      .from("user_roles")
      .select("user_id, role_id")
      .in("user_id", part);
    if (urErr) {
      throw new Error(`listRoleNamesByUserIds user_roles: ${urErr.message}`);
    }
    const rows = (urRows ?? []) as { user_id: string; role_id: string }[];
    if (!rows.length) continue;
    const roleIds = [...new Set(rows.map((r) => String(r.role_id)))];
    const { data: roleDefRows, error: rErr } = await admin
      .from("roles")
      .select("id, name")
      .in("id", roleIds);
    if (rErr) {
      throw new Error(`listRoleNamesByUserIds roles: ${rErr.message}`);
    }
    const idToName = new Map(
      ((roleDefRows ?? []) as { id: string; name: string }[]).map((r) => [String(r.id), r.name])
    );
    for (const r of rows) {
      const uid = String(r.user_id);
      const name = idToName.get(String(r.role_id));
      if (!name) continue;
      const list = out.get(uid) ?? [];
      if (!list.includes(name)) list.push(name);
      out.set(uid, list);
    }
  }
  return out;
}

