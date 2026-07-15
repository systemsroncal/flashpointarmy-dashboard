import { NextResponse } from "next/server";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";
import { summarizeReactions, type ReactionType } from "@/lib/mobilize/social/reaction-summary";

type Ctx = { params: Promise<{ id: string; messageId: string; commentId: string }> };

async function isApprovedMember(
  admin: import("@supabase/supabase-js").SupabaseClient,
  groupId: string,
  userId: string
) {
  const { data } = await admin
    .from("mobilize_group_members")
    .select("membership_status")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .maybeSingle();
  return data?.membership_status === "approved";
}

export async function POST(req: Request, ctx: Ctx) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;
  const { id: groupId, messageId, commentId } = await ctx.params;

  if (!(await isApprovedMember(auth.admin, groupId, auth.userId))) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { data: comment } = await auth.admin
    .from("mobilize_message_comments")
    .select("id, message_id")
    .eq("id", commentId)
    .eq("message_id", messageId)
    .maybeSingle();
  if (!comment) return NextResponse.json({ error: "Comment not found." }, { status: 404 });

  const { data: msg } = await auth.admin
    .from("mobilize_group_messages")
    .select("id")
    .eq("id", messageId)
    .eq("group_id", groupId)
    .maybeSingle();
  if (!msg) return NextResponse.json({ error: "Message not found." }, { status: 404 });

  const body = (await req.json()) as { reaction_type?: ReactionType | null };
  const reaction_type = body.reaction_type;
  if (reaction_type !== "like" && reaction_type !== "love" && reaction_type !== null) {
    return NextResponse.json({ error: "Invalid reaction." }, { status: 400 });
  }

  if (reaction_type === null) {
    await auth.admin
      .from("mobilize_message_comment_reactions")
      .delete()
      .eq("comment_id", commentId)
      .eq("user_id", auth.userId);
  } else {
    await auth.admin.from("mobilize_message_comment_reactions").upsert(
      { comment_id: commentId, user_id: auth.userId, reaction_type },
      { onConflict: "comment_id,user_id" }
    );
  }

  const { data: rows } = await auth.admin
    .from("mobilize_message_comment_reactions")
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
