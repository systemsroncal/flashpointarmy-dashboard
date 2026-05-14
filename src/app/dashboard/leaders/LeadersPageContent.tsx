import { CommunitySection } from "@/components/dashboard/community/CommunitySection";
import { MODULE_SLUGS } from "@/config/modules";
import {
  listDashboardUsersByIdsWithAuthFallback,
  listProfilesByIds,
  listRoleNamesByUserIds,
  preferNonEmptyAddr,
} from "@/lib/admin/dashboard-user-queries";
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
  const updatePerm = can(permissions, MODULE_SLUGS.leaders, "update") && elevated;
  const deletePerm = can(permissions, MODULE_SLUGS.leaders, "delete") && elevated;

  const { data: profile } = await supabase
    .from("profiles")
    .select("primary_chapter_id")
    .eq("id", user.id)
    .maybeSingle();

  const localChapterId = profile?.primary_chapter_id ?? null;

  const admin = createAdminClient();

  const { data: leaderRole } = await supabase
    .from("roles")
    .select("id")
    .eq("name", "local_leader")
    .maybeSingle();

  let leaderUserIds: string[] = [];
  if (leaderRole?.id) {
    const { data: urRows } = await admin
      .from("user_roles")
      .select("user_id")
      .eq("role_id", leaderRole.id as string);
    leaderUserIds = [...new Set((urRows ?? []).map((r: { user_id: string }) => r.user_id))];
  }

  if (!elevated && isLocalLeader && localChapterId && leaderUserIds.length > 0) {
    const { data: inChapter } = await admin
      .from("profiles")
      .select("id")
      .eq("primary_chapter_id", localChapterId)
      .in("id", leaderUserIds);
    const allowed = new Set((inChapter ?? []).map((p: { id: string }) => p.id));
    leaderUserIds = leaderUserIds.filter((id) => allowed.has(id));
  }

  if (!elevated && isLocalLeader && !leaderUserIds.includes(user.id)) {
    leaderUserIds = [...leaderUserIds, user.id];
  }

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

  let merged: UserRow[] = [];

  if (leaderUserIds.length > 0) {
    const data = await listDashboardUsersByIdsWithAuthFallback(admin, leaderUserIds);
    merged = data.map((u) => ({
      ...(u as unknown as Omit<UserRow, "role_names">),
      role_names: [],
      avatar_url: null,
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
      const fromDb = [...(roleByUser.get(u.id) ?? [])].sort();
      return {
        ...u,
        avatar_url: avatarById.get(u.id) ?? null,
        role_names: fromDb.length > 0 ? fromDb : ["local_leader"],
        primary_chapter_id: m?.primary_chapter_id ?? u.primary_chapter_id,
        phone: preferNonEmptyAddr(m?.phone, u.phone),
        address_line: preferNonEmptyAddr(m?.address_line, u.address_line),
        city: preferNonEmptyAddr(m?.city, u.city),
        state: preferNonEmptyAddr(m?.state, u.state),
        zip_code: preferNonEmptyAddr(m?.zip_code, u.zip_code),
      };
    });
  } else {
    merged = merged.map((u) => ({ ...u, avatar_url: null }));
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
