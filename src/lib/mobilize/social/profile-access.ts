import type { SupabaseClient } from "@supabase/supabase-js";

export type ProfileVisibility = "public" | "private";

export async function loadProfileVisibility(
  admin: SupabaseClient,
  userId: string
): Promise<ProfileVisibility> {
  const { data } = await admin
    .from("profiles")
    .select("profile_visibility")
    .eq("id", userId)
    .maybeSingle();
  return data?.profile_visibility === "private" ? "private" : "public";
}

export async function canViewMobilizeProfile(
  admin: SupabaseClient,
  viewerId: string,
  profileUserId: string
): Promise<boolean> {
  if (viewerId === profileUserId) return true;
  const visibility = await loadProfileVisibility(admin, profileUserId);
  if (visibility === "public") return true;
  const { data } = await admin
    .from("mobilize_user_follows")
    .select("follower_id")
    .eq("follower_id", viewerId)
    .eq("following_id", profileUserId)
    .maybeSingle();
  return Boolean(data);
}

export async function isFollowingUser(
  admin: SupabaseClient,
  followerId: string,
  followingId: string
): Promise<boolean> {
  const { data } = await admin
    .from("mobilize_user_follows")
    .select("follower_id")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .maybeSingle();
  return Boolean(data);
}
