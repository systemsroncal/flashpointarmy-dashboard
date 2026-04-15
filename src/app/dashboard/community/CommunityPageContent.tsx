import { CommunitySection } from "@/components/dashboard/community/CommunitySection";
import { MODULE_SLUGS } from "@/config/modules";
import { isElevatedRole, loadUserRoleNames } from "@/lib/auth/user-roles";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { can } from "@/types/permissions";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { Paper, Typography } from "@mui/material";
import { redirect } from "next/navigation";

export default async function CommunityPageContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const permissions = await loadModulePermissions(supabase, user.id);
  if (!can(permissions, MODULE_SLUGS.community, "read")) {
    return (
      <Paper sx={{ p: 3, bgcolor: "rgba(0,0,0,0.45)" }}>
        <Typography color="error">You do not have access to Community.</Typography>
      </Paper>
    );
  }

  const create = can(permissions, MODULE_SLUGS.community, "create");
  const updatePerm = can(permissions, MODULE_SLUGS.community, "update");
  const deletePerm = can(permissions, MODULE_SLUGS.community, "delete");
  const roles = await loadUserRoleNames(supabase, user.id);
  const elevated = isElevatedRole(roles);
  const isLocalLeader = roles.includes("local_leader");

  const { data: profile } = await supabase
    .from("profiles")
    .select("primary_chapter_id")
    .eq("id", user.id)
    .maybeSingle();

  const localChapterId = profile?.primary_chapter_id ?? null;

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

  /** Service role: RLS on `dashboard_users` / `profiles` is self-only for JWT; listing all users must bypass RLS after permission checks above. */
  const admin = createAdminClient();

  let merged: UserRow[] = [];

  if (!elevated && isLocalLeader && localChapterId) {
    const { data: members } = await admin
      .from("profiles")
      .select("id")
      .eq("primary_chapter_id", localChapterId);
    const ids = (members ?? []).map((m: { id: string }) => m.id);
    if (ids.length > 0) {
      const { data } = await admin
        .from("dashboard_users")
        .select(
          "id, email, phone, display_name, created_at, first_name, last_name, primary_chapter_id"
        )
        .in("id", ids)
        .order("email");
      merged = (data ?? []).map((u) => ({ ...(u as Omit<UserRow, "role_names">), role_names: [] }));
    }
  } else {
    const { data } = await admin
      .from("dashboard_users")
      .select(
        "id, email, phone, display_name, created_at, first_name, last_name, primary_chapter_id"
      )
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
      ? "All dashboard users."
      : "Users assigned to your primary chapter.";

  return (
    <CommunitySection
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
    />
  );
}
