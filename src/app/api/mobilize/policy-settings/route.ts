import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loadUserRoleNames } from "@/lib/auth/user-roles";
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
  return NextResponse.json({
    allow_member_group_create: policy.allowMember,
    allow_local_leader_group_create: policy.allowLocalLeader,
    auto_close_inactive_days,
    ...uploadLimits,
  });
}

export async function PUT(req: Request) {
  const auth = await requireSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const body = (await req.json()) as {
    allow_member_group_create?: unknown;
    allow_local_leader_group_create?: unknown;
    auto_close_inactive_days?: unknown;
    groups_image_max_mb?: unknown;
    groups_image_max_count?: unknown;
    profile_image_max_mb?: unknown;
    profile_image_max_count?: unknown;
  };
  const allowMember = body.allow_member_group_create === true;
  const allowLocalLeader = body.allow_local_leader_group_create !== false;
  const daysRaw = Number(body.auto_close_inactive_days);
  const auto_close_inactive_days = Number.isFinite(daysRaw)
    ? Math.min(3650, Math.max(1, Math.round(daysRaw)))
    : 60;

  const uploadLimits: MobilizeImageUploadLimits = {
    groups_image_max_mb: clampImageMaxMb(body.groups_image_max_mb, 1),
    groups_image_max_count: clampImageMaxCount(body.groups_image_max_count, 4),
    profile_image_max_mb: clampImageMaxMb(body.profile_image_max_mb, 1),
    profile_image_max_count: clampImageMaxCount(body.profile_image_max_count, 4),
  };

  const { error } = await auth.admin.from("mobilize_policy_settings").upsert(
    {
      id: 1,
      allow_member_group_create: allowMember,
      allow_local_leader_group_create: allowLocalLeader,
      auto_close_inactive_days,
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
  return NextResponse.json({
    allow_member_group_create: policy.allowMember,
    allow_local_leader_group_create: policy.allowLocalLeader,
    auto_close_inactive_days,
    ...savedLimits,
  });
}
