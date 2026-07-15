import { NextResponse } from "next/server";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";
import { canViewMobilizeProfile } from "@/lib/mobilize/social/profile-access";
import { resolveMobilizeAuthors } from "@/lib/mobilize/social/resolve-authors";
import { summarizeReactions, type ReactionType } from "@/lib/mobilize/social/reaction-summary";

type Ctx = { params: Promise<{ userId: string; postId: string }> };

type CommentRow = {
  id: string;
  post_id: string;
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

function buildTree(
  rows: CommentRow[],
  authors: Awaited<ReturnType<typeof resolveMobilizeAuthors>>,
  reactionsByComment: Map<string, { reaction_type: string }[]>,
  viewerReactions: Map<string, ReactionType>
): CommentNode[] {
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
  const { userId, postId } = await ctx.params;

  const allowed = await canViewMobilizeProfile(auth.admin, auth.userId, userId);
  if (!allowed) return NextResponse.json({ error: "This profile is private." }, { status: 403 });

  const { data: post } = await auth.admin
    .from("mobilize_profile_posts")
    .select("id")
    .eq("id", postId)
    .eq("author_id", userId)
    .maybeSingle();
  if (!post) return NextResponse.json({ error: "Post not found." }, { status: 404 });

  const { data: rows, error } = await auth.admin
    .from("mobilize_profile_post_comments")
    .select("id, post_id, author_id, parent_id, depth, content, created_at")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const commentRows = (rows ?? []) as CommentRow[];
  const commentIds = commentRows.map((r) => r.id);
  const [{ data: reactionRows }, authors] = await Promise.all([
    commentIds.length
      ? auth.admin
          .from("mobilize_profile_comment_reactions")
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
    if (r.user_id === auth.userId) viewerReactions.set(cid, r.reaction_type as ReactionType);
  }

  return NextResponse.json({ comments: buildTree(commentRows, authors, reactionsByComment, viewerReactions) });
}

export async function POST(req: Request, ctx: Ctx) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;
  const { userId, postId } = await ctx.params;

  const allowed = await canViewMobilizeProfile(auth.admin, auth.userId, userId);
  if (!allowed) return NextResponse.json({ error: "This profile is private." }, { status: 403 });

  const { data: post } = await auth.admin
    .from("mobilize_profile_posts")
    .select("id")
    .eq("id", postId)
    .eq("author_id", userId)
    .maybeSingle();
  if (!post) return NextResponse.json({ error: "Post not found." }, { status: 404 });

  const body = (await req.json()) as { content?: string; parent_id?: string | null };
  const content = String(body.content ?? "").trim();
  if (!content) return NextResponse.json({ error: "Comment cannot be empty." }, { status: 400 });

  let depth = 1;
  let parent_id: string | null = null;
  if (body.parent_id) {
    const { data: parent } = await auth.admin
      .from("mobilize_profile_post_comments")
      .select("id, depth, post_id")
      .eq("id", body.parent_id)
      .eq("post_id", postId)
      .maybeSingle();
    if (!parent) return NextResponse.json({ error: "Parent comment not found." }, { status: 404 });
    if (parent.depth >= 3) {
      return NextResponse.json({ error: "Maximum reply depth is 3 levels." }, { status: 400 });
    }
    depth = parent.depth + 1;
    parent_id = parent.id;
  }

  const { data, error } = await auth.admin
    .from("mobilize_profile_post_comments")
    .insert({ post_id: postId, author_id: auth.userId, parent_id, depth, content })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ comment: data });
}
