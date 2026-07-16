import type { SupabaseClient } from "@supabase/supabase-js";
import type { MobilizeAuthorSummary } from "@/lib/mobilize/social/resolve-authors";
import { resolveMobilizeAuthors } from "@/lib/mobilize/social/resolve-authors";

export type SocialAlertKind = "follow" | "like_profile_post" | "like_group_post";

export type SocialAlert = {
  id: string;
  kind: SocialAlertKind;
  created_at: string;
  actor: MobilizeAuthorSummary;
  summary: string;
  href: string | null;
};

export async function loadMobilizeSocialAlerts(
  admin: SupabaseClient,
  viewerId: string,
  limit = 40
): Promise<SocialAlert[]> {
  const [{ data: followRows }, { data: myPosts }, { data: myMessages }] = await Promise.all([
    admin
      .from("mobilize_user_follows")
      .select("follower_id, created_at")
      .eq("following_id", viewerId)
      .order("created_at", { ascending: false })
      .limit(limit),
    admin.from("mobilize_profile_posts").select("id").eq("author_id", viewerId),
    admin.from("mobilize_group_messages").select("id").eq("author_id", viewerId),
  ]);

  const myPostIds = (myPosts ?? []).map((r) => r.id as string);
  const myMessageIds = (myMessages ?? []).map((r) => r.id as string);

  const [{ data: postReactions }, { data: messageReactions }] = await Promise.all([
    myPostIds.length
      ? admin
          .from("mobilize_profile_post_reactions")
          .select("post_id, user_id, reaction_type, created_at")
          .in("post_id", myPostIds)
          .neq("user_id", viewerId)
          .order("created_at", { ascending: false })
          .limit(limit)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
    myMessageIds.length
      ? admin
          .from("mobilize_message_reactions")
          .select("message_id, user_id, reaction_type, created_at")
          .in("message_id", myMessageIds)
          .neq("user_id", viewerId)
          .order("created_at", { ascending: false })
          .limit(limit)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
  ]);

  const actorIds = new Set<string>();
  for (const row of followRows ?? []) actorIds.add(row.follower_id as string);
  for (const row of postReactions ?? []) actorIds.add(row.user_id as string);
  for (const row of messageReactions ?? []) actorIds.add(row.user_id as string);

  const authors = await resolveMobilizeAuthors(admin, [...actorIds]);

  const alerts: SocialAlert[] = [];

  for (const row of followRows ?? []) {
    const actor = authors.get(row.follower_id as string);
    if (!actor) continue;
    alerts.push({
      id: `follow-${row.follower_id}-${row.created_at}`,
      kind: "follow",
      created_at: row.created_at as string,
      actor,
      summary: "started following you",
      href: `/dashboard/mobilize/profile/${actor.id}`,
    });
  }

  for (const row of postReactions ?? []) {
    const actor = authors.get(row.user_id as string);
    if (!actor) continue;
    const reaction = row.reaction_type === "love" ? "loved" : "liked";
    alerts.push({
      id: `ppr-${row.post_id}-${row.user_id}`,
      kind: "like_profile_post",
      created_at: row.created_at as string,
      actor,
      summary: `${reaction} your post`,
      href: `/dashboard/mobilize/profile/${viewerId}`,
    });
  }

  for (const row of messageReactions ?? []) {
    const actor = authors.get(row.user_id as string);
    if (!actor) continue;
    const reaction = row.reaction_type === "love" ? "loved" : "liked";
    alerts.push({
      id: `gmr-${row.message_id}-${row.user_id}`,
      kind: "like_group_post",
      created_at: row.created_at as string,
      actor,
      summary: `${reaction} your group post`,
      href: null,
    });
  }

  return alerts
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);
}
