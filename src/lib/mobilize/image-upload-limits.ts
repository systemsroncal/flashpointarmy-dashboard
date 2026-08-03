import type { SupabaseClient } from "@supabase/supabase-js";

export type MobilizeImageUploadLimits = {
  groups_image_max_mb: number;
  groups_image_max_count: number;
  profile_image_max_mb: number;
  profile_image_max_count: number;
};

export const DEFAULT_MOBILIZE_IMAGE_UPLOAD_LIMITS: MobilizeImageUploadLimits = {
  groups_image_max_mb: 1,
  groups_image_max_count: 4,
  profile_image_max_mb: 1,
  profile_image_max_count: 4,
};

export function clampImageMaxMb(raw: unknown, fallback = 1): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(50, Math.max(0.1, Math.round(n * 100) / 100));
}

export function clampImageMaxCount(raw: unknown, fallback = 4): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(20, Math.max(1, Math.round(n)));
}

export function mbToBytes(mb: number): number {
  return Math.round(mb * 1024 * 1024);
}

export function normalizeMobilizeImageUploadLimits(
  row: Partial<MobilizeImageUploadLimits> | null | undefined
): MobilizeImageUploadLimits {
  return {
    groups_image_max_mb: clampImageMaxMb(
      row?.groups_image_max_mb,
      DEFAULT_MOBILIZE_IMAGE_UPLOAD_LIMITS.groups_image_max_mb
    ),
    groups_image_max_count: clampImageMaxCount(
      row?.groups_image_max_count,
      DEFAULT_MOBILIZE_IMAGE_UPLOAD_LIMITS.groups_image_max_count
    ),
    profile_image_max_mb: clampImageMaxMb(
      row?.profile_image_max_mb,
      DEFAULT_MOBILIZE_IMAGE_UPLOAD_LIMITS.profile_image_max_mb
    ),
    profile_image_max_count: clampImageMaxCount(
      row?.profile_image_max_count,
      DEFAULT_MOBILIZE_IMAGE_UPLOAD_LIMITS.profile_image_max_count
    ),
  };
}

export async function loadMobilizeImageUploadLimits(
  admin: SupabaseClient
): Promise<MobilizeImageUploadLimits> {
  const { data } = await admin
    .from("mobilize_policy_settings")
    .select(
      "groups_image_max_mb, groups_image_max_count, profile_image_max_mb, profile_image_max_count"
    )
    .eq("id", 1)
    .maybeSingle();
  return normalizeMobilizeImageUploadLimits(
    data as Partial<MobilizeImageUploadLimits> | null
  );
}
