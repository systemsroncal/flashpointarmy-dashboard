import { CommunitySection } from "@/components/dashboard/community/CommunitySection";
import { MODULE_SLUGS } from "@/config/modules";
import {
  listDashboardUsersByIdsWithAuthFallback,
  listProfilesByIds,
  listRoleNamesByUserIds,
} from "@/lib/admin/dashboard-user-queries";
import { isElevatedRole, loadUserRoleNames } from "@/lib/auth/user-roles";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { can } from "@/types/permissions";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { Paper, Typography } from "@mui/material";
import { redirect } from "next/navigation";

export default async function AdminsPageContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const permissions = await loadModulePermissions(supabase, user.id);
  if (!can(permissions, MODULE_SLUGS.admins, "read")) {
    return (
      <Paper sx={{ p: 3, bgcolor: "rgba(0,0,0,0.45)" }}>
        <Typography color="error">You do not have access to Administrators.</Typography>
      </Paper>
    );
  }

  const roles = await loadUserRoleNames(supabase, user.id);
  const elevated = isElevatedRole(roles);
  const isSuperAdmin = roles.includes("super_admin");
  const isLocalLeader = roles.includes("local_leader");

  const create =
    can(permissions, MODULE_SLUGS.admins, "create") && isSuperAdmin;
  const updatePerm = can(permissions, MODULE_SLUGS.admins, "update") && elevated;
  const deletePerm = can(permissions, MODULE_SLUGS.admins, "delete") && elevated;

  const { data: profile } = await supabase
    .from("profiles")
    .select("primary_chapter_id")
    .eq("id", user.id)
    .maybeSingle();

  const localChapterId = profile?.primary_chapter_id ?? null;

  type UserRow = {
    id: string;
    email: string;
    avatar_url: string | null;
    phone: string | null;
    display_name: string | null;
    created_at: string;
    first_name: string | null;
    last_name: string | null;
    primary_chapter_id: string | null;
    role_names: string[];
    address_line: string | null;
    city: string | null;
    state: string | null;
    zip_code: string | null;
  };

  type ChapterRow = {
    id: string;
    name: string;
    city: string | null;
    state: string;
    zip_code: string | null;
  };

  const admin = createAdminClient();

  const { data: adminRoleRows } = await admin
    .from("roles")
    .select("id, name")
    .in("name", ["admin", "super_admin"]);

  const roleIds = (adminRoleRows ?? []).map((r: { id: string }) => r.id).filter(Boolean);

  let adminUserIds: string[] = [];
  if (roleIds.length > 0) {
    const { data: urRows } = await admin
      .from("user_roles")
      .select("user_id")
      .in("role_id", roleIds);
    adminUserIds = [...new Set((urRows ?? []).map((r: { user_id: string }) => r.user_id))];
  }

  let merged: UserRow[] = [];

  if (adminUserIds.length > 0) {
    const data = await listDashboardUsersByIdsWithAuthFallback(admin, adminUserIds);
    merged = data.map((u) => ({
      ...(u as Omit<UserRow, "role_names">),
      role_names: [],
      address_line: null,
      city: null,
      state: null,
      zip_code: null,
    }));
  }

  if (merged.length > 0) {
    const userIds = merged.map((u) => u.id);
    const profileRows = await listProfilesByIds(admin, userIds);
    const avatarById = new Map<string, string | null>();
    const mailById = new Map<
      string,
      {
        phone: string | null;
        primary_chapter_id: string | null;
        address_line: string | null;
        city: string | null;
        state: string | null;
        zip_code: string | null;
      }
    >();
    for (const row of profileRows ?? []) {
      const id = row.id as string;
      avatarById.set(id, (row as { avatar_url?: string | null }).avatar_url ?? null);
      mailById.set(id, {
        phone: (row as { phone?: string | null }).phone?.trim() || null,
        primary_chapter_id: row.primary_chapter_id ?? null,
        address_line: (row as { address_line?: string | null }).address_line ?? null,
        city: (row as { city?: string | null }).city ?? null,
        state: (row as { state?: string | null }).state ?? null,
        zip_code: (row as { zip_code?: string | null }).zip_code ?? null,
      });
    }

    const roleByUser = await listRoleNamesByUserIds(admin, userIds);
    merged = merged.map((u) => {
      const m = mailById.get(u.id);
      return {
        ...u,
        avatar_url: avatarById.get(u.id) ?? null,
        role_names: (roleByUser.get(u.id) ?? []).sort(),
        primary_chapter_id: m?.primary_chapter_id ?? u.primary_chapter_id,
        phone: m?.phone || u.phone || null,
        address_line: m?.address_line ?? u.address_line,
        city: m?.city ?? u.city,
        state: m?.state ?? u.state,
        zip_code: m?.zip_code ?? u.zip_code,
      };
    });
    if (!isSuperAdmin) {
      merged = merged.filter((u) => !(u.role_names ?? []).includes("super_admin"));
    }
  }

  let chapterOptions: ChapterRow[] = [];
  try {
    const { data: allCh } = await supabase
      .from("chapters")
      .select("id, name, city, state, zip_code")
      .order("name");
    if (elevated || !isLocalLeader) {
      chapterOptions = (allCh ?? []) as ChapterRow[];
    } else if (localChapterId) {
      chapterOptions = ((allCh ?? []) as ChapterRow[]).filter((c) => c.id === localChapterId);
    }
  } catch {
    chapterOptions = [];
  }

  const subtitle =
    "Dashboard users with the Administrator or Super administrator role.";

  return (
    <CommunitySection
      variant="admins"
      initialUsers={merged}
      chapterOptions={chapterOptions}
      canCreate={create}
      canUpdate={updatePerm}
      canDelete={deletePerm}
      currentUserId={user.id}
      elevated={elevated}
      isLocalLeader={isLocalLeader}
      localChapterId={localChapterId}
      subtitle={subtitle}
      isSuperAdmin={isSuperAdmin}
    />
  );
}
