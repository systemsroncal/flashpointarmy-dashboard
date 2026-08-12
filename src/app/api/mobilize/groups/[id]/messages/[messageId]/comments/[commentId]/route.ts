import { NextResponse } from "next/server";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";
import { isMobilizeSuperAdmin } from "@/lib/mobilize/mobilize-content-access";

type Ctx = { params: Promise<{ id: string; messageId: string; commentId: string }> };

async function loadMembership(
  admin: import("@supabase/supabase-js").SupabaseClient,
  groupId: string,
  userId: string
) {
  const { data } = await admin
    .from("mobilize_group_members")
    .select("member_role, membership_status")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .maybeSingle();
  return data;
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;
  const { id: groupId, messageId, commentId } = await ctx.params;

  const me = await loadMembership(auth.admin, groupId, auth.userId);
  const isSuperAdmin = isMobilizeSuperAdmin(auth.roleNames);
  if (!isSuperAdmin && (!me || me.membership_status !== "approved")) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { data: msg } = await auth.admin
    .from("mobilize_group_messages")
    .select("id")
    .eq("id", messageId)
    .eq("group_id", groupId)
    .maybeSingle();
  if (!msg) return NextResponse.json({ error: "Message not found." }, { status: 404 });

  const { data: comment, error: cErr } = await auth.admin
    .from("mobilize_message_comments")
    .select("id, author_id")
    .eq("id", commentId)
    .eq("message_id", messageId)
    .maybeSingle();

  if (cErr || !comment) {
    return NextResponse.json({ error: "Comment not found." }, { status: 404 });
  }

  const isAuthor = comment.author_id === auth.userId;
  if (!isAuthor && !isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { error } = await auth.admin
    .from("mobilize_message_comments")
    .delete()
    .eq("id", commentId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
