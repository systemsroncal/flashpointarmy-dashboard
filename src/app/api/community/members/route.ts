import { NextResponse } from "next/server";
import { MODULE_SLUGS } from "@/config/modules";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { isElevatedRole, loadUserRoleNames } from "@/lib/auth/user-roles";
import { can } from "@/types/permissions";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

type RoleRelation = { name: string } | { name: string }[] | null;
type UserRoleRow = { user_id: string; roles: RoleRelation };
type ProfileRow = {
  id: string;
  avatar_url: string | null;
  phone: string | null;
  address_line: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
};

export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const permissions = await loadModulePermissions(supabase, user.id);
  if (!can(permissions, MODULE_SLUGS.community, "read")) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const url = new URL(req.url);
  const page = Math.max(0, Number(url.searchParams.get("page") || 0));
  const perPage = Math.min(200, Math.max(1, Number(url.searchParams.get("perPage") || 20)));
  const chapterId = url.searchParams.get("chapterId") || "all";
  const selectedUserId = (url.searchParams.get("selectedUserId") || "").trim();
  const q = (url.searchParams.get("q") || "").trim();
  const autocomplete = url.searchParams.get("autocomplete") === "1";

  const roles = await loadUserRoleNames(supabase, user.id);
  const elevated = isElevatedRole(roles);
  const isLocalLeader = roles.includes("local_leader");

  const { data: profile } = await supabase
    .from("profiles")
    .select("primary_chapter_id")
    .eq("id", user.id)
    .maybeSingle();
  const localChapterId = profile?.primary_chapter_id ?? null;

  const admin = createAdminClient();

  if (autocomplete) {
    if (q.length < 2) return NextResponse.json({ options: [] });
    let lookup = admin
      .from("dashboard_users")
      .select("id, email, first_name, last_name, display_name")
      .or(
        `email.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%,display_name.ilike.%${q}%`
      )
      .order("email")
      .limit(20);
    if (!elevated && isLocalLeader && localChapterId) {
      lookup = lookup.eq("primary_chapter_id", localChapterId);
    }
    if (chapterId !== "all") {
      lookup = lookup.eq("primary_chapter_id", chapterId);
    }
    const { data } = await lookup;
    const rows = (data ?? []) as Array<{
      id: string;
      email: string;
      first_name: string | null;
      last_name: string | null;
      display_name: string | null;
    }>;
    const ids = rows.map((r) => r.id);
    const { data: roleRows } = ids.length
      ? await admin.from("user_roles").select("user_id, roles(name)").in("user_id", ids)
      : { data: [] as UserRoleRow[] };
    const roleByUser = new Map<string, string[]>();
    for (const row of (roleRows ?? []) as UserRoleRow[]) {
      const uid = String(row.user_id);
      const rel = row.roles;
      const roleName = Array.isArray(rel) ? rel[0]?.name : rel?.name;
      if (!roleName) continue;
      const arr = roleByUser.get(uid) ?? [];
      if (!arr.includes(roleName)) arr.push(roleName);
      roleByUser.set(uid, arr);
    }
    const options = rows
      .filter((row) => {
        const names = roleByUser.get(row.id) ?? [];
        return (
          names.includes("member") &&
          !names.some((n) => n === "local_leader" || n === "admin" || n === "super_admin")
        );
      })
      .map((row) => {
        const first = row.first_name ?? "";
        const last = row.last_name ?? "";
        const display = row.display_name ?? "";
        const full = `${first} ${last}`.trim() || display || row.email;
        return {
          id: row.id,
          label: `${full} — ${row.email}`,
        };
      });
    return NextResponse.json({ options });
  }

  let query = admin
    .from("dashboard_users")
    .select(
      "id, email, phone, display_name, created_at, first_name, last_name, primary_chapter_id",
      { count: "exact" }
    )
    .order("email");
  if (!elevated && isLocalLeader && localChapterId) {
    query = query.eq("primary_chapter_id", localChapterId);
  }
  if (chapterId !== "all") {
    query = query.eq("primary_chapter_id", chapterId);
  }
  if (selectedUserId) {
    query = query.eq("id", selectedUserId);
  } else if (q.length >= 2) {
    query = query.or(
      `email.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%,display_name.ilike.%${q}%,phone.ilike.%${q}%`
    );
  }

  const from = page * perPage;
  const to = from + perPage - 1;
  const { data, count } = await query.range(from, to);
  const rows = (data ?? []) as Array<{
    id: string;
    email: string;
    phone: string | null;
    display_name: string | null;
    created_at: string;
    first_name: string | null;
    last_name: string | null;
    primary_chapter_id: string | null;
  }>;

  const userIds = rows.map((r) => r.id);
  const { data: profileRows } = userIds.length
    ? await admin
        .from("profiles")
        .select("id, avatar_url, phone, address_line, city, state, zip_code")
        .in("id", userIds)
    : { data: [] as ProfileRow[] };
  const { data: roleRows } = userIds.length
    ? await admin.from("user_roles").select("user_id, roles(name)").in("user_id", userIds)
    : { data: [] as UserRoleRow[] };

  const profileById = new Map<string, ProfileRow>();
  for (const p of (profileRows ?? []) as ProfileRow[]) profileById.set(String(p.id), p);
  const roleByUser = new Map<string, string[]>();
  for (const r of (roleRows ?? []) as UserRoleRow[]) {
    const uid = String(r.user_id);
    const rel = r.roles;
    const roleName = Array.isArray(rel) ? rel[0]?.name : rel?.name;
    if (!roleName) continue;
    const arr = roleByUser.get(uid) ?? [];
    if (!arr.includes(roleName)) arr.push(roleName);
    roleByUser.set(uid, arr);
  }

  const merged = rows.map((u) => {
    const p = profileById.get(u.id) || {};
    return {
      ...u,
      avatar_url: p.avatar_url ?? null,
      phone: (p.phone?.trim?.() || u.phone || null) as string | null,
      address_line: p.address_line ?? null,
      city: p.city ?? null,
      state: p.state ?? null,
      zip_code: p.zip_code ?? null,
      role_names: (roleByUser.get(u.id) ?? []).sort(),
    };
  });

  return NextResponse.json({
    rows: merged,
    total: count ?? 0,
    page,
    perPage,
  });
}

