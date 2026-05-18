import { CommunitySection } from "@/components/dashboard/community/CommunitySection";
import { MODULE_SLUGS } from "@/config/modules";
import { isElevatedRole, loadUserRoleNames } from "@/lib/auth/user-roles";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { can } from "@/types/permissions";
import { createClient } from "@/utils/supabase/server";
import { Paper, Typography } from "@mui/material";
import { requireServerUser } from "@/lib/auth/server-session";

export default async function CommunityPageContent() {
  const { supabase, user } = await requireServerUser();

  const permissions = await loadModulePermissions(supabase, user.id);
  if (!can(permissions, MODULE_SLUGS.community, "read")) {
    return (
      <Paper sx={{ p: 3, bgcolor: "rgba(0,0,0,0.45)" }}>
        <Typography color="error">You do not have access to Community.</Typography>
      </Paper>
    );
  }

  const roles = await loadUserRoleNames(supabase, user.id);
  const elevated = isElevatedRole(roles);
  const create = can(permissions, MODULE_SLUGS.community, "create") && elevated;
  const updatePerm = can(permissions, MODULE_SLUGS.community, "update") && elevated;
  const deletePerm = can(permissions, MODULE_SLUGS.community, "delete") && elevated;
  const isSuperAdmin = roles.includes("super_admin");
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
    address_line?: string | null;
  };

  /** Service role: RLS on `dashboard_users` / `profiles` is self-only for JWT; listing all users must bypass RLS after permission checks above. */
  // Community rows are now loaded on-demand from /api/community/members (server pagination + search).
  const merged: UserRow[] = [];

  let chapterOptions: ChapterRow[] = [];
  try {
    const { data: allCh } = await supabase
      .from("chapters")
      .select("id, name, city, state, zip_code, address_line")
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
      ? "Members only (excludes local leaders and administrators)."
      : "Members in your primary chapter (excludes local leaders and administrators).";

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
      isSuperAdmin={isSuperAdmin}
    />
  );
}
