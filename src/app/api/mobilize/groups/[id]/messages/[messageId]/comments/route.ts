import { NextResponse } from "next/server";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";
import { isMobilizeSuperAdmin } from "@/lib/mobilize/mobilize-content-access";
import { resolveMobilizeAuthors } from "@/lib/mobilize/social/resolve-authors";
import { summarizeReactions, type ReactionType } from "@/lib/mobilize/social/reaction-summary";

type Ctx = { params: Promise<{ id: string; messageId: string }> };

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

type CommentRow = {
  id: string;
  message_id: string;
  author_id: string;
  parent_id: string | null;
  depth: number;
  content: string;
  created_at: string;
};

type CommentNode = CommentRow & {
  author: {
    id: string;
    display_name: string;
    handle: string;
    avatar_url: string | null;
  };
  reactions: ReturnType<typeof summarizeReactions>;
  replies: CommentNode[];
};

function buildCommentTree(rows: CommentRow[], authors: Awaited<ReturnType<typeof resolveMobilizeAuthors>>, reactionsByComment: Map<string, { reaction_type: string }[]>, viewerReactions: Map<string, ReactionType>): CommentNode[] {
  const nodes = new Map<string, CommentNode>();
  for (const row of rows) {
    const author = authors.get(row.author_id) ?? {
      id: row.author_id,
      display_name: "Member",
      handle: `@${row.author_id.slice(0, 8)}`,
      avatar_url: null,
    };
    nodes.set(row.id, {
      ...row,
      author,
      reactions: summarizeReactions(reactionsByComment.get(row.id) ?? [], viewerReactions.get(row.id) ?? null),
      replies: [],
    });
  }
  const roots: CommentNode[] = [];
  for (const node of nodes.values()) {
    if (node.parent_id && nodes.has(node.parent_id)) {
      nodes.get(node.parent_id)!.replies.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

export async function GET(_req: Request, ctx: Ctx) {
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

  const { data: rows, error } = await auth.admin
    .from("mobilize_message_comments")
    .select("id, message_id, author_id, parent_id, depth, content, created_at")
    .eq("message_id", messageId)
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const commentRows = (rows ?? []) as CommentRow[];
  const commentIds = commentRows.map((r) => r.id);
  const [{ data: reactionRows }, authors] = await Promise.all([
    commentIds.length
      ? auth.admin
          .from("mobilize_message_comment_reactions")
          .select("comment_id, user_id, reaction_type")
          .in("comment_id", commentIds)
      : Promise.resolve({ data: [] as { comment_id: string; user_id: string; reaction_type: string }[] }),
    resolveMobilizeAuthors(auth.admin, commentRows.map((r) => r.author_id)),
  ]);

  const reactionsByComment = new Map<string, { reaction_type: string }[]>();
  const viewerReactions = new Map<string, ReactionType>();
  for (const r of reactionRows ?? []) {
    const cid = r.comment_id as string;
    const list = reactionsByComment.get(cid) ?? [];
    list.push({ reaction_type: r.reaction_type as string });
    reactionsByComment.set(cid, list);
    if (r.user_id === auth.userId) {
      viewerReactions.set(cid, r.reaction_type as ReactionType);
    }
  }

  return NextResponse.json({
    comments: buildCommentTree(commentRows, authors, reactionsByComment, viewerReactions),
  });
}

export async function POST(req: Request, ctx: Ctx) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;
  const { id: groupId, messageId } = await ctx.params;

  const me = await loadMembership(auth.admin, groupId, auth.userId);
  const isSuperAdmin = isMobilizeSuperAdmin(auth.roleNames);
  if (!isSuperAdmin && (!me || me.membership_status !== "approved")) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { data: msg } = await auth.admin
    .from("mobilize_group_messages")
    .select("id, comments_policy")
    .eq("id", messageId)
    .eq("group_id", groupId)
    .maybeSingle();
  if (!msg) return NextResponse.json({ error: "Message not found." }, { status: 404 });

  const isLeader = me?.membership_status === "approved" && me.member_role === "leader";
  if (msg.comments_policy === "leaders_only" && !isLeader && !isSuperAdmin) {
    return NextResponse.json({ error: "Only leaders can comment on this post." }, { status: 403 });
  }

  const body = (await req.json()) as { content?: string; parent_id?: string | null };
  const content = String(body.content ?? "").trim();
  if (!content) return NextResponse.json({ error: "Comment cannot be empty." }, { status: 400 });

  let depth = 1;
  let parent_id: string | null = null;
  if (body.parent_id) {
    const { data: parent } = await auth.admin
      .from("mobilize_message_comments")
      .select("id, depth, message_id")
      .eq("id", body.parent_id)
      .eq("message_id", messageId)
      .maybeSingle();
    if (!parent) return NextResponse.json({ error: "Parent comment not found." }, { status: 404 });
    if (parent.depth >= 3) {
      return NextResponse.json({ error: "Maximum reply depth is 3 levels." }, { status: 400 });
    }
    depth = parent.depth + 1;
    parent_id = parent.id;
  }

  const { data, error } = await auth.admin
    .from("mobilize_message_comments")
    .insert({
      message_id: messageId,
      author_id: auth.userId,
      parent_id,
      depth,
      content,
    })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ comment: data });
}
