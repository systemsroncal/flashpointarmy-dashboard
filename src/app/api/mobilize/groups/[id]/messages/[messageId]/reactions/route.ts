import { NextResponse } from "next/server";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";
import { isMobilizeSuperAdmin } from "@/lib/mobilize/mobilize-content-access";
import { summarizeReactions, type ReactionType } from "@/lib/mobilize/social/reaction-summary";

type Ctx = { params: Promise<{ id: string; messageId: string }> };

async function loadMembership(
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
  return data;
}

export async function POST(req: Request, ctx: Ctx) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;
  const { id: groupId, messageId } = await ctx.params;

  const me = await loadMembership(auth.admin, groupId, auth.userId);
  if (!isMobilizeSuperAdmin(auth.roleNames) && (!me || me.membership_status !== "approved")) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

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
      .from("mobilize_message_reactions")
      .delete()
      .eq("message_id", messageId)
      .eq("user_id", auth.userId);
  } else {
    await auth.admin.from("mobilize_message_reactions").upsert(
      { message_id: messageId, user_id: auth.userId, reaction_type },
      { onConflict: "message_id,user_id" }
    );
  }

  const { data: rows } = await auth.admin
    .from("mobilize_message_reactions")
    .select("reaction_type, user_id")
    .eq("message_id", messageId);

  const viewer =
    (rows ?? []).find((r) => r.user_id === auth.userId)?.reaction_type as ReactionType | undefined;
  return NextResponse.json({
    reactions: summarizeReactions(
      (rows ?? []).map((r) => ({ reaction_type: r.reaction_type as string })),
      viewer ?? null
    ),
  });
}
