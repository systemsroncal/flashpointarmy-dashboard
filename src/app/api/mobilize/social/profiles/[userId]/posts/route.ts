import { NextResponse } from "next/server";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";
import { canViewMobilizeProfile } from "@/lib/mobilize/social/profile-access";
import { resolveMobilizeAuthors } from "@/lib/mobilize/social/resolve-authors";
import { summarizeReactions, type ReactionType } from "@/lib/mobilize/social/reaction-summary";
import { normalizeFeedContent } from "@/lib/mobilize/social/sanitize-feed-html";
import { sanitizeAnnouncementImageUrls } from "@/lib/mobilize/announcement-images";

type Ctx = { params: Promise<{ userId: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;
  const { userId } = await ctx.params;

  const allowed = await canViewMobilizeProfile(auth.admin, auth.userId, userId);
  if (!allowed) return NextResponse.json({ error: "This profile is private." }, { status: 403 });

  const url = new URL(req.url);
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") || 20)));

  const { data: rows, error } = await auth.admin
    .from("mobilize_profile_posts")
    .select("id, author_id, content, content_html, image_urls, created_at")
    .eq("author_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const postIds = (rows ?? []).map((r) => r.id as string);
  const [authors, { data: reactions }, { data: comments }] = await Promise.all([
    resolveMobilizeAuthors(auth.admin, [userId]),
    postIds.length
      ? auth.admin
          .from("mobilize_profile_post_reactions")
          .select("post_id, user_id, reaction_type")
          .in("post_id", postIds)
      : Promise.resolve({ data: [] as { post_id: string; user_id: string; reaction_type: string }[] }),
    postIds.length
      ? auth.admin.from("mobilize_profile_post_comments").select("post_id").in("post_id", postIds)
      : Promise.resolve({ data: [] as { post_id: string }[] }),
  ]);

  const author = authors.get(userId)!;
  const reactionsByPost = new Map<string, { reaction_type: string }[]>();
  const viewerByPost = new Map<string, ReactionType>();
  for (const r of reactions ?? []) {
    const pid = r.post_id as string;
    const list = reactionsByPost.get(pid) ?? [];
    list.push({ reaction_type: r.reaction_type as string });
    reactionsByPost.set(pid, list);
    if (r.user_id === auth.userId) viewerByPost.set(pid, r.reaction_type as ReactionType);
  }
  const commentCount = new Map<string, number>();
  for (const c of comments ?? []) {
    const pid = c.post_id as string;
    commentCount.set(pid, (commentCount.get(pid) ?? 0) + 1);
  }

  const posts = (rows ?? []).map((row) => ({
    id: row.id as string,
    author_id: row.author_id as string,
    content: row.content as string,
    content_html: (row.content_html as string | null) ?? null,
    image_urls: (row.image_urls as string[]) ?? [],
    created_at: row.created_at as string,
    author,
    reactions: summarizeReactions(reactionsByPost.get(row.id as string) ?? [], viewerByPost.get(row.id as string) ?? null),
    comment_count: commentCount.get(row.id as string) ?? 0,
  }));

  return NextResponse.json({ posts });
}

export async function POST(req: Request, ctx: Ctx) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;
  const { userId } = await ctx.params;

  if (auth.userId !== userId) {
    return NextResponse.json({ error: "You can only post on your own wall." }, { status: 403 });
  }

  const body = (await req.json()) as { content?: string; content_html?: string; image_urls?: unknown };
  const normalized = normalizeFeedContent(body);
  const image_urls = sanitizeAnnouncementImageUrls(body.image_urls) ?? [];
  if (!normalized.content && !image_urls.length) {
    return NextResponse.json({ error: "Add text or at least one image." }, { status: 400 });
  }

  const { data, error } = await auth.admin
    .from("mobilize_profile_posts")
    .insert({
      author_id: userId,
      content: normalized.content,
      content_html: normalized.content_html,
      image_urls,
    })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ post: data });
}
