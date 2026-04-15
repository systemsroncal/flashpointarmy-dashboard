import { CommunitySection } from "@/components/dashboard/community/CommunitySection";
import { MODULE_SLUGS } from "@/config/modules";
import { isElevatedRole, loadUserRoleNames } from "@/lib/auth/user-roles";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { can } from "@/types/permissions";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { Paper, Typography } from "@mui/material";
import { redirect } from "next/navigation";

export default async function LeadersPageContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const permissions = await loadModulePermissions(supabase, user.id);
  if (!can(permissions, MODULE_SLUGS.leaders, "read")) {
    return (
      <Paper sx={{ p: 3, bgcolor: "rgba(0,0,0,0.45)" }}>
        <Typography color="error">You do not have access to Leaders.</Typography>
      </Paper>
    );
  }

  const roles = await loadUserRoleNames(supabase, user.id);
  const elevated = isElevatedRole(roles);
  const isSuperAdmin = roles.includes("super_admin");
  const isLocalLeader = roles.includes("local_leader");
  const create =
    can(permissions, MODULE_SLUGS.leaders, "create") && elevated;
  const updatePerm = can(permissions, MODULE_SLUGS.leaders, "update");
  const deletePerm = can(permissions, MODULE_SLUGS.leaders, "delete");

  const { data: profile } = await supabase
    .from("profiles")
    .select("primary_chapter_id")
    .eq("id", user.id)
    .maybeSingle();

  const localChapterId = profile?.primary_chapter_id ?? null;

  const { data: leaderRole } = await supabase
    .from("roles")
    .select("id")
    .eq("name", "local_leader")
    .maybeSingle();

  let leaderUserIds: string[] = [];
  if (leaderRole?.id) {
    const { data: urRows } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role_id", leaderRole.id as string);
    leaderUserIds = [...new Set((urRows ?? []).map((r: { user_id: string }) => r.user_id))];
  }

  const admin = createAdminClient();

  if (!elevated && isLocalLeader && localChapterId && leaderUserIds.length > 0) {
    const { data: inChapter } = await admin
      .from("profiles")
      .select("id")
      .eq("primary_chapter_id", localChapterId)
      .in("id", leaderUserIds);
    const allowed = new Set((inChapter ?? []).map((p: { id: string }) => p.id));
    leaderUserIds = leaderUserIds.filter((id) => allowed.has(id));
  }

  type UserRow = {
    id: string;
    email: string;
    phone: string | null;
    display_name: string | null;
    created_at: string;
    first_name: string | null;
    last_name: string | null;
    primary_chapter_id: string | null;
    role_names: string[];
  };

  type ChapterRow = {
    id: string;
    name: string;
    address_line: string | null;
    city: string | null;
    state: string;
    zip_code: string | null;
  };

  let merged: UserRow[] = [];

  if (leaderUserIds.length > 0) {
    const { data } = await admin
      .from("dashboard_users")
      .select(
        "id, email, phone, display_name, created_at, first_name, last_name, primary_chapter_id"
      )
      .in("id", leaderUserIds)
      .order("email");
    merged = (data ?? []).map((u) => ({ ...(u as Omit<UserRow, "role_names">), role_names: [] }));
  }

  if (merged.length > 0) {
    const userIds = merged.map((u) => u.id);
    const { data: roleRows } = await supabase
      .from("user_roles")
      .select("user_id, roles(name)")
      .in("user_id", userIds);

    const byUser = new Map<string, string[]>();
    for (const row of roleRows ?? []) {
      const uid = row.user_id as string;
      const rel = row.roles as { name: string } | { name: string }[] | null;
      const roleName = Array.isArray(rel) ? rel[0]?.name : rel?.name;
      if (!roleName) continue;
      const list = byUser.get(uid) ?? [];
      if (!list.includes(roleName)) list.push(roleName);
      byUser.set(uid, list);
    }
    merged = merged.map((u) => ({
      ...u,
      role_names: (byUser.get(u.id) ?? []).sort(),
    }));
  }

  let chapterOptions: ChapterRow[] = [];
  try {
    const { data: allCh } = await supabase
      .from("chapters")
      .select("id, name, address_line, city, state, zip_code")
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
    elevated || !isLocalLeader
      ? "Users with the Local leader role."
      : "Local leaders assigned to your primary chapter.";

  return (
    <CommunitySection
      variant="leaders"
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
