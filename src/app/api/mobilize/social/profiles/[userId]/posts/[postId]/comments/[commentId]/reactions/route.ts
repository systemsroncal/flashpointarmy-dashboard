import { NextResponse } from "next/server";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";
import { canViewMobilizeProfile } from "@/lib/mobilize/social/profile-access";
import { summarizeReactions, type ReactionType } from "@/lib/mobilize/social/reaction-summary";

type Ctx = { params: Promise<{ userId: string; postId: string; commentId: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;
  const { userId, postId, commentId } = await ctx.params;

  const allowed = await canViewMobilizeProfile(auth.admin, auth.userId, userId);
  if (!allowed) return NextResponse.json({ error: "This profile is private." }, { status: 403 });

  const { data: comment } = await auth.admin
    .from("mobilize_profile_post_comments")
    .select("id, post_id")
    .eq("id", commentId)
    .eq("post_id", postId)
    .maybeSingle();
  if (!comment) return NextResponse.json({ error: "Comment not found." }, { status: 404 });

  const { data: post } = await auth.admin
    .from("mobilize_profile_posts")
    .select("id")
    .eq("id", postId)
    .eq("author_id", userId)
    .maybeSingle();
  if (!post) return NextResponse.json({ error: "Post not found." }, { status: 404 });

  const body = (await req.json()) as { reaction_type?: ReactionType | null };
  const reaction_type = body.reaction_type;
  if (reaction_type !== "like" && reaction_type !== "love" && reaction_type !== null) {
    return NextResponse.json({ error: "Invalid reaction." }, { status: 400 });
  }

  if (reaction_type === null) {
    await auth.admin
      .from("mobilize_profile_comment_reactions")
      .delete()
      .eq("comment_id", commentId)
      .eq("user_id", auth.userId);
  } else {
    await auth.admin.from("mobilize_profile_comment_reactions").upsert(
      { comment_id: commentId, user_id: auth.userId, reaction_type },
      { onConflict: "comment_id,user_id" }
    );
  }

  const { data: rows } = await auth.admin
    .from("mobilize_profile_comment_reactions")
    .select("reaction_type, user_id")
    .eq("comment_id", commentId);

  const viewer =
    (rows ?? []).find((r) => r.user_id === auth.userId)?.reaction_type as ReactionType | undefined;
  return NextResponse.json({
    reactions: summarizeReactions(
      (rows ?? []).map((r) => ({ reaction_type: r.reaction_type as string })),
      viewer ?? null
    ),
  });
}
