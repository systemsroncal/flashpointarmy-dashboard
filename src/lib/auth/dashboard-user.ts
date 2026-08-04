import type { SupabaseClient } from "@supabase/supabase-js";
import { loadUserRoleNames } from "@/lib/auth/user-roles";
import type { TrainingGraduateBadgeRole } from "@/lib/courses/course-completion";
import type { MemberOnboardingSnapshot } from "@/lib/onboarding/member-onboarding-status";

/** Row in public.dashboard_users (mirrors auth.users in Supabase dev). */
export type DashboardUser = {
  id: string;
  email: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  /** From dashboard_users / profiles */
  phone: string | null;
  primary_chapter_id: string | null;
  /** From profiles.avatar_url when present */
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  /** Role slugs from `user_roles` + `roles` (e.g. member, local_leader, admin). */
  role_names: string[];
  /**
   * From `mobilize_policy_settings.chapters_viewer_roles` — roles (besides super_admin)
   * allowed to open Mobilize Chapters.
   */
  mobilize_chapters_viewer_roles?: string[];
  /** From `mobilize_policy_settings.chapters_viewer_user_ids` — explicit user whitelist. */
  mobilize_chapters_viewer_user_ids?: string[];
  /** Shown when user completed Biblical Citizenship and is a member or local leader. */
  training_graduate_badge?: TrainingGraduateBadgeRole | null;
  /** Onboarding progress for members and local leaders (sidebar + national overview). */
  member_onboarding?: MemberOnboardingSnapshot | null;
};

const ALLOWED_CHAPTERS_VIEWER_ROLES = new Set([
  "admin",
  "sub_admin",
  "local_leader",
  "member",
]);

const ALLOWED_GROUP_CREATOR_ROLES = new Set([
  "local_leader",
  "verified_local_leader",
]);

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function normalizeChaptersViewerRoles(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return [
    ...new Set(
      raw
        .map((x) => String(x || "").trim())
        .filter((r) => ALLOWED_CHAPTERS_VIEWER_ROLES.has(r))
    ),
  ];
}

export function normalizeChaptersViewerUserIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return [
    ...new Set(
      raw
        .map((x) => String(x || "").trim())
        .filter((id) => UUID_RE.test(id))
    ),
  ];
}

export function normalizeGroupCreatorRoles(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return [
    ...new Set(
      raw
        .map((x) => String(x || "").trim())
        .filter((r) => ALLOWED_GROUP_CREATOR_ROLES.has(r))
    ),
  ];
}

export async function loadDashboardUser(
  supabase: SupabaseClient,
  userId: string
): Promise<DashboardUser | null> {
  const { data: du, error } = await supabase
    .from("dashboard_users")
    .select(
      "id, email, display_name, first_name, last_name, phone, primary_chapter_id, created_at, updated_at"
    )
    .eq("id", userId)
    .maybeSingle();

  if (error || !du) return null;

  const [{ data: prof, error: profErr }, role_names, viewerRolesRes] = await Promise.all([
    supabase.from("profiles").select("avatar_url, phone").eq("id", userId).maybeSingle(),
    loadUserRoleNames(supabase, userId),
    supabase
      .from("mobilize_policy_settings")
      .select("chapters_viewer_roles, chapters_viewer_user_ids")
      .eq("id", 1)
      .maybeSingle(),
  ]);

  let avatar_url: string | null = null;
  if (!profErr && prof && "avatar_url" in prof && prof.avatar_url != null) {
    avatar_url = String(prof.avatar_url);
  }

  const duPhone =
    (du as { phone?: string | null }).phone?.trim() ||
    (prof && "phone" in prof && prof.phone != null ? String(prof.phone).trim() : "") ||
    null;

  const settingsRow = viewerRolesRes.data as {
    chapters_viewer_roles?: unknown;
    chapters_viewer_user_ids?: unknown;
  } | null;

  const mobilize_chapters_viewer_roles = normalizeChaptersViewerRoles(
    settingsRow?.chapters_viewer_roles
  );
  const mobilize_chapters_viewer_user_ids = normalizeChaptersViewerUserIds(
    settingsRow?.chapters_viewer_user_ids
  );

  return {
    ...(du as Omit<
      DashboardUser,
      | "avatar_url"
      | "role_names"
      | "phone"
      | "mobilize_chapters_viewer_roles"
      | "mobilize_chapters_viewer_user_ids"
    >),
    phone: duPhone,
    avatar_url,
    role_names,
    mobilize_chapters_viewer_roles,
    mobilize_chapters_viewer_user_ids,
  };
}
