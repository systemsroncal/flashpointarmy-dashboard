import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { listDashboardUsersByIds } from "@/lib/admin/dashboard-user-queries";
import { loadUserRoleNames } from "@/lib/auth/user-roles";
import {
  normalizeChaptersViewerRoles,
  normalizeChaptersViewerUserIds,
  normalizeGroupCreatorRoles,
} from "@/lib/auth/dashboard-user";
import {
  clampImageMaxCount,
  clampImageMaxMb,
  loadMobilizeImageUploadLimits,
  type MobilizeImageUploadLimits,
} from "@/lib/mobilize/image-upload-limits";
import { loadGroupUpdatesAllowGroupLeaders } from "@/lib/mobilize/group-update-notifications-access";
import { loadMobilizeGroupCreatorPolicy } from "@/lib/mobilize/mobilize-roles";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";
import { createClient } from "@/utils/supabase/server";

async function loadAutoCloseDays(admin: SupabaseClient): Promise<number> {
  const { data } = await admin
    .from("mobilize_policy_settings")
    .select("auto_close_inactive_days")
    .eq("id", 1)
    .maybeSingle();
  const n = Number((data as { auto_close_inactive_days?: number } | null)?.auto_close_inactive_days);
  return Number.isFinite(n) && n >= 1 ? n : 60;
}

async function loadViewerSettings(admin: SupabaseClient): Promise<{
  chapters_viewer_roles: string[];
  chapters_viewer_user_ids: string[];
}> {
  const { data } = await admin
    .from("mobilize_policy_settings")
    .select("chapters_viewer_roles, chapters_viewer_user_ids")
    .eq("id", 1)
    .maybeSingle();
  const row = data as {
    chapters_viewer_roles?: unknown;
    chapters_viewer_user_ids?: unknown;
  } | null;
  return {
    chapters_viewer_roles: normalizeChaptersViewerRoles(row?.chapters_viewer_roles),
    chapters_viewer_user_ids: normalizeChaptersViewerUserIds(row?.chapters_viewer_user_ids),
  };
}

async function resolveViewerUserOptions(
  admin: SupabaseClient,
  userIds: string[]
): Promise<{ id: string; label: string }[]> {
  if (!userIds.length) return [];
  const rows = await listDashboardUsersByIds(admin, userIds);
  const byId = new Map(rows.map((u) => [u.id, u] as const));
  return userIds.map((id) => {
    const u = byId.get(id);
    if (!u) return { id, label: id };
    const name =
      u.display_name?.trim() ||
      [u.first_name, u.last_name].filter(Boolean).join(" ").trim() ||
      u.email;
    return { id, label: `${name} (${u.email})` };
  });
}

async function requireSuperAdmin() {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;
  const supabase = await createClient();
  const roleNames = await loadUserRoleNames(supabase, auth.userId);
  if (!roleNames.includes("super_admin")) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  return auth;
}

export async function GET() {
  const auth = await requireSuperAdmin();
  if (auth instanceof NextResponse) return auth;
  const policy = await loadMobilizeGroupCreatorPolicy(auth.admin);
  const auto_close_inactive_days = await loadAutoCloseDays(auth.admin);
  const uploadLimits = await loadMobilizeImageUploadLimits(auth.admin);
  const viewer = await loadViewerSettings(auth.admin);
  const users = await resolveViewerUserOptions(auth.admin, viewer.chapters_viewer_user_ids);
  const group_updates_allow_group_leaders = await loadGroupUpdatesAllowGroupLeaders(auth.admin);

  return NextResponse.json({
    allow_member_group_create: false,
    allow_local_leader_group_create: policy.allowLocalLeader,
    allow_verified_local_leader_group_create: policy.allowVerifiedLocalLeader,
    group_creator_roles: policy.creatorRoles,
    auto_close_inactive_days,
    chapters_viewer_roles: viewer.chapters_viewer_roles,
    chapters_viewer_user_ids: viewer.chapters_viewer_user_ids,
    group_updates_allow_group_leaders,
    users,
    ...uploadLimits,
  });
}

export async function PUT(req: Request) {
  const auth = await requireSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const body = (await req.json()) as {
    allow_member_group_create?: unknown;
    allow_local_leader_group_create?: unknown;
    allow_verified_local_leader_group_create?: unknown;
    group_creator_roles?: unknown;
    auto_close_inactive_days?: unknown;
    groups_image_max_mb?: unknown;
    groups_image_max_count?: unknown;
    profile_image_max_mb?: unknown;
    profile_image_max_count?: unknown;
    chapters_viewer_roles?: unknown;
    chapters_viewer_user_ids?: unknown;
    group_updates_allow_group_leaders?: unknown;
  };

  let creatorRoles = normalizeGroupCreatorRoles(body.group_creator_roles);
  if (creatorRoles.length === 0) {
    const roles: string[] = [];
    if (body.allow_local_leader_group_create === true) roles.push("local_leader");
    if (body.allow_verified_local_leader_group_create === true) {
      roles.push("verified_local_leader");
    }
    creatorRoles = roles.length ? roles : ["local_leader"];
  }

  const allowLocalLeader = creatorRoles.includes("local_leader");
  const daysRaw = Number(body.auto_close_inactive_days);
  const auto_close_inactive_days = Number.isFinite(daysRaw)
    ? Math.min(3650, Math.max(1, Math.round(daysRaw)))
    : 60;
  const chapters_viewer_roles = normalizeChaptersViewerRoles(body.chapters_viewer_roles);
  const chapters_viewer_user_ids = normalizeChaptersViewerUserIds(body.chapters_viewer_user_ids);
  const group_updates_allow_group_leaders = body.group_updates_allow_group_leaders !== false;

  const uploadLimits: MobilizeImageUploadLimits = {
    groups_image_max_mb: clampImageMaxMb(body.groups_image_max_mb, 1),
    groups_image_max_count: clampImageMaxCount(body.groups_image_max_count, 4),
    profile_image_max_mb: clampImageMaxMb(body.profile_image_max_mb, 1),
    profile_image_max_count: clampImageMaxCount(body.profile_image_max_count, 4),
  };

  const { error } = await auth.admin.from("mobilize_policy_settings").upsert(
    {
      id: 1,
      allow_member_group_create: false,
      allow_local_leader_group_create: allowLocalLeader,
      group_creator_roles: creatorRoles,
      auto_close_inactive_days,
      chapters_viewer_roles,
      chapters_viewer_user_ids,
      group_updates_allow_group_leaders,
      ...uploadLimits,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const policy = await loadMobilizeGroupCreatorPolicy(auth.admin);
  const savedLimits = await loadMobilizeImageUploadLimits(auth.admin);
  const viewer = await loadViewerSettings(auth.admin);
  const savedGroupUpdatesLeaders = await loadGroupUpdatesAllowGroupLeaders(auth.admin);
  return NextResponse.json({
    allow_member_group_create: false,
    allow_local_leader_group_create: policy.allowLocalLeader,
    allow_verified_local_leader_group_create: policy.allowVerifiedLocalLeader,
    group_creator_roles: policy.creatorRoles,
    auto_close_inactive_days,
    chapters_viewer_roles: viewer.chapters_viewer_roles,
    chapters_viewer_user_ids: viewer.chapters_viewer_user_ids,
    group_updates_allow_group_leaders: savedGroupUpdatesLeaders,
    ...savedLimits,
  });
}
