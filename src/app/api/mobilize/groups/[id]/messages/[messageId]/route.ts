import { NextResponse } from "next/server";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";

type Ctx = { params: Promise<{ id: string; messageId: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;
  const { id: groupId, messageId } = await ctx.params;

  const { data: me } = await auth.admin
    .from("mobilize_group_members")
    .select("member_role, membership_status")
    .eq("group_id", groupId)
    .eq("user_id", auth.userId)
    .maybeSingle();

  if (!me || me.membership_status !== "approved") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { data: msg, error: mErr } = await auth.admin
    .from("mobilize_group_messages")
    .select("id, author_id, content, comments_policy")
    .eq("id", messageId)
    .eq("group_id", groupId)
    .maybeSingle();

  if (mErr || !msg) return NextResponse.json({ error: "Message not found." }, { status: 404 });

  const isLeader = me.member_role === "leader";
  const isAuthor = msg.author_id === auth.userId;
  if (!isAuthor && !isLeader) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const body = (await req.json()) as {
    content?: string;
    comments_policy?: string;
  };

  const patch: Record<string, unknown> = {};
  if (typeof body.content === "string") {
    const c = body.content.trim();
    if (!c) return NextResponse.json({ error: "content cannot be empty." }, { status: 400 });
    patch.content = c;
  }
  if ("comments_policy" in body && isLeader) {
    patch.comments_policy =
      body.comments_policy === "leaders_only" ? "leaders_only" : "everyone";
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No valid fields." }, { status: 400 });
  }

  const { data, error } = await auth.admin
    .from("mobilize_group_messages")
    .update(patch)
    .eq("id", messageId)
    .eq("group_id", groupId)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: data });
}
