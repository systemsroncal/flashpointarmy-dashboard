import { NextResponse } from "next/server";
import { loadMobilizeImageUploadLimits } from "@/lib/mobilize/image-upload-limits";
import { sanitizeSocialPostImageUrls } from "@/lib/mobilize/announcement-images";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";
import { isMobilizeSuperAdmin } from "@/lib/mobilize/mobilize-content-access";
import { normalizeFeedContent } from "@/lib/mobilize/social/sanitize-feed-html";

type Ctx = { params: Promise<{ userId: string; postId: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;
  const { userId, postId } = await ctx.params;

  const { data: post, error: postErr } = await auth.admin
    .from("mobilize_profile_posts")
    .select("id, author_id, content, content_html, image_urls")
    .eq("id", postId)
    .eq("author_id", userId)
    .maybeSingle();

  if (postErr || !post) {
    return NextResponse.json({ error: "Post not found." }, { status: 404 });
  }

  const isSuperAdmin = isMobilizeSuperAdmin(auth.roleNames);
  const isAuthor = post.author_id === auth.userId;
  if (!isAuthor && !isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const body = (await req.json()) as {
    content?: string;
    content_html?: string;
    image_urls?: unknown;
  };

  const patch: Record<string, unknown> = {};
  if (typeof body.content_html === "string" || typeof body.content === "string") {
    const normalized = normalizeFeedContent(body);
    patch.content = normalized.content;
    patch.content_html = normalized.content_html;
  }
  if ("image_urls" in body) {
    const limits = await loadMobilizeImageUploadLimits(auth.admin);
    const image_urls =
      sanitizeSocialPostImageUrls(body.image_urls, limits.profile_image_max_count) ?? [];
    patch.image_urls = image_urls;
  }

  if (!Object.keys(patch).length) {
    return NextResponse.json({ error: "No changes provided." }, { status: 400 });
  }

  const nextContent =
    typeof patch.content === "string" ? patch.content : (post.content as string);
  const nextImages = Array.isArray(patch.image_urls)
    ? (patch.image_urls as string[])
    : ((post.image_urls as string[]) ?? []);
  if (!nextContent.trim() && !nextImages.length) {
    return NextResponse.json({ error: "Add text or at least one image." }, { status: 400 });
  }

  const { data, error } = await auth.admin
    .from("mobilize_profile_posts")
    .update(patch)
    .eq("id", postId)
    .eq("author_id", userId)
    .select("id, author_id, content, content_html, image_urls, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ post: data });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;
  const { userId, postId } = await ctx.params;

  const { data: post, error: postErr } = await auth.admin
    .from("mobilize_profile_posts")
    .select("id, author_id")
    .eq("id", postId)
    .eq("author_id", userId)
    .maybeSingle();

  if (postErr || !post) {
    return NextResponse.json({ error: "Post not found." }, { status: 404 });
  }

  const isSuperAdmin = isMobilizeSuperAdmin(auth.roleNames);
  const isAuthor = post.author_id === auth.userId;
  if (!isAuthor && !isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { error } = await auth.admin
    .from("mobilize_profile_posts")
    .delete()
    .eq("id", postId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
