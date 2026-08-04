import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
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

  const { data: userRows } = await auth.admin
    .from("dashboard_users")
    .select("id, email, display_name, first_name, last_name")
    .order("email", { ascending: true })
    .limit(5000);

  const users = ((userRows ?? []) as {
    id: string;
    email: string;
    display_name: string | null;
    first_name: string | null;
    last_name: string | null;
  }[]).map((u) => {
    const name =
      u.display_name?.trim() ||
      [u.first_name, u.last_name].filter(Boolean).join(" ").trim() ||
      u.email;
    return { id: u.id, label: `${name} (${u.email})` };
  });

  return NextResponse.json({
    allow_member_group_create: false,
    allow_local_leader_group_create: policy.allowLocalLeader,
    allow_verified_local_leader_group_create: policy.allowVerifiedLocalLeader,
    group_creator_roles: policy.creatorRoles,
    auto_close_inactive_days,
    chapters_viewer_roles: viewer.chapters_viewer_roles,
    chapters_viewer_user_ids: viewer.chapters_viewer_user_ids,
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
  return NextResponse.json({
    allow_member_group_create: false,
    allow_local_leader_group_create: policy.allowLocalLeader,
    allow_verified_local_leader_group_create: policy.allowVerifiedLocalLeader,
    group_creator_roles: policy.creatorRoles,
    auto_close_inactive_days,
    chapters_viewer_roles: viewer.chapters_viewer_roles,
    chapters_viewer_user_ids: viewer.chapters_viewer_user_ids,
    ...savedLimits,
  });
}
