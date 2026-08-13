import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import {
  listDashboardUsersByIds,
  listRoleNamesByUserIds,
  listUserIdsByRoleNames,
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
const DASHBOARD_USER_SELECT =
  "id, email, phone, display_name, created_at, first_name, last_name, primary_chapter_id, address_line, city, state, zip_code";

function sanitizeIlikeTerm(raw: string): string {
  return raw.replace(/[%_,]/g, " ").trim().slice(0, 80);
}

function toSearchableBase(u: {
  id: string;
  email: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  state: string | null;
}): Omit<SearchableUser, "avatar_url" | "roleNames"> {
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
  };
}

async function searchDashboardUsersFromDb(
  admin: SupabaseClient,
  opts: {
    q: string;
    limit: number;
    eligibleIds: Set<string> | null;
  }
): Promise<
  {
    id: string;
    email: string;
    display_name: string | null;
    first_name: string | null;
    last_name: string | null;
    state: string | null;
  }[]
> {
  const { q, limit, eligibleIds } = opts;
  const term = sanitizeIlikeTerm(q);

  if (!term) {
    if (eligibleIds && eligibleIds.size > 0) {
      const sampleIds = [...eligibleIds].slice(0, Math.min(limit, MAX_LIMIT));
      const rows = await listDashboardUsersByIds(admin, sampleIds);
      return rows.slice(0, limit);
    }
    const { data } = await admin
      .from("dashboard_users")
      .select(DASHBOARD_USER_SELECT)
      .order("email", { ascending: true })
      .limit(limit);
    return (data ?? []) as {
      id: string;
      email: string;
      display_name: string | null;
      first_name: string | null;
      last_name: string | null;
      state: string | null;
    }[];
  }

  const pattern = `%${term}%`;
  const overFetch = Math.min(Math.max(limit * 8, limit), 500);
  const { data, error } = await admin
    .from("dashboard_users")
    .select(DASHBOARD_USER_SELECT)
    .or(
      [
        `email.ilike."${pattern}"`,
        `display_name.ilike."${pattern}"`,
        `first_name.ilike."${pattern}"`,
        `last_name.ilike."${pattern}"`,
      ].join(",")
    )
    .order("email", { ascending: true })
    .limit(overFetch);

  if (error) {
    throw new Error(error.message);
  }

  let rows = (data ?? []) as {
    id: string;
    email: string;
    display_name: string | null;
    first_name: string | null;
    last_name: string | null;
    state: string | null;
  }[];

  if (eligibleIds) {
    rows = rows.filter((u) => eligibleIds.has(u.id));
  }

  return rows.slice(0, limit);
}

export async function GET(req: Request) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();
  const roleParam = searchParams.get("role");
  const rolesParam = searchParams.get("roles");
  const excludeGroupId = searchParams.get("excludeGroupId");
  const limitParam = Number(searchParams.get("limit") ?? DEFAULT_LIMIT);
  const limit = Math.min(Math.max(Math.trunc(limitParam) || DEFAULT_LIMIT, 1), MAX_LIMIT);

  const allowed = await ensureMobilizeGroupManager(auth.admin, auth.userId, auth.roleNames);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const roleFilters = [
    ...new Set(
      [
        ...(roleParam ? [roleParam] : []),
        ...(rolesParam ? rolesParam.split(",") : []),
      ]
        .map((r) => r.trim())
        .filter(Boolean)
    ),
  ];

  let eligibleIds: Set<string> | null = null;
  if (roleFilters.length) {
    eligibleIds = new Set(await listUserIdsByRoleNames(auth.admin, roleFilters));
    if (!eligibleIds.size) {
      return NextResponse.json({ users: [] as SearchableUser[] });
    }
  }

  let excludeIds = new Set<string>();
  if (excludeGroupId) {
    const { data: existingRows } = await auth.admin
      .from("mobilize_group_members")
      .select("user_id")
      .eq("group_id", excludeGroupId);
    excludeIds = new Set(
      ((existingRows ?? []) as { user_id: string }[]).map((r) => r.user_id)
    );
  }

  let users: Awaited<ReturnType<typeof searchDashboardUsersFromDb>>;
  try {
    users = await searchDashboardUsersFromDb(auth.admin, {
      q,
      limit: excludeIds.size ? Math.min(limit * 3, MAX_LIMIT) : limit,
      eligibleIds,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Search failed." },
      { status: 500 }
    );
  }

  if (excludeIds.size) {
    users = users.filter((u) => !excludeIds.has(u.id)).slice(0, limit);
  }

  let result: SearchableUser[] = users.map((u) => ({
    ...toSearchableBase(u),
    avatar_url: null,
    roleNames: [],
  }));

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

  return NextResponse.json({ users: result });
}

/**
 * Only site staff (admin / super_admin) OR group leaders / group owners / chapter owners
 * may enumerate dashboard users for member-add / whitelist flows.
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
