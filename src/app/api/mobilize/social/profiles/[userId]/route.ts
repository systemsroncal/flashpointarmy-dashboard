import { NextResponse } from "next/server";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";
import { isFollowingUser, isMutualFollow } from "@/lib/mobilize/social/profile-access";
import { resolveMobilizeAuthors } from "@/lib/mobilize/social/resolve-authors";

type Ctx = { params: Promise<{ userId: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;
  const { userId } = await ctx.params;

  const isOwn = auth.userId === userId;

  const [{ data: profile }, authors, following, followers, isFollowing, isFollowedBy, isMutual] =
    await Promise.all([
    auth.admin
      .from("profiles")
      .select("id, display_name, first_name, last_name, avatar_url, bio, profile_visibility, created_at, city, state")
      .eq("id", userId)
      .maybeSingle(),
    resolveMobilizeAuthors(auth.admin, [userId]),
    auth.admin
      .from("mobilize_user_follows")
      .select("follower_id", { count: "exact", head: true })
      .eq("following_id", userId),
    auth.admin
      .from("mobilize_user_follows")
      .select("following_id", { count: "exact", head: true })
      .eq("follower_id", userId),
    isFollowingUser(auth.admin, auth.userId, userId),
    isFollowingUser(auth.admin, userId, auth.userId),
    isMutualFollow(auth.admin, auth.userId, userId),
  ]);

  if (!profile) return NextResponse.json({ error: "User not found." }, { status: 404 });

  const visibility = profile.profile_visibility === "private" ? "private" : "public";
  const author = authors.get(userId)!;
  const isPrivateLocked = visibility === "private" && !isOwn;

  if (isPrivateLocked) {
    return NextResponse.json({
      profile: {
        ...author,
        bio: null,
        profile_visibility: visibility,
        city: null,
        state: null,
        joined_at: profile.created_at as string,
        followers_count: following.count ?? 0,
        following_count: followers.count ?? 0,
        is_own_profile: false,
        is_following: isFollowing,
        is_followed_by: isFollowedBy,
        is_mutual_follow: isMutual,
        can_message: false,
        is_private_locked: true,
      },
    });
  }

  return NextResponse.json({
    profile: {
      ...author,
      bio: (profile.bio as string | null) ?? null,
      profile_visibility: visibility,
      city: (profile.city as string | null) ?? null,
      state: (profile.state as string | null) ?? null,
      joined_at: profile.created_at as string,
      followers_count: following.count ?? 0,
      following_count: followers.count ?? 0,
      is_own_profile: isOwn,
      is_following: isFollowing,
      is_followed_by: isFollowedBy,
      is_mutual_follow: isMutual,
      can_message: !isOwn && isMutual,
      is_private_locked: false,
    },
  });
}
