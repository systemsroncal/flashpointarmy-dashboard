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
  return visibility === "public";
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

/** True when both users follow each other. */
export async function isMutualFollow(
  admin: SupabaseClient,
  userIdA: string,
  userIdB: string
): Promise<boolean> {
  if (userIdA === userIdB) return false;
  const [aFollowsB, bFollowsA] = await Promise.all([
    isFollowingUser(admin, userIdA, userIdB),
    isFollowingUser(admin, userIdB, userIdA),
  ]);
  return aFollowsB && bFollowsA;
}
