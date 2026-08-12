import { NextResponse } from "next/server";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";
import { isMobilizeSuperAdmin } from "@/lib/mobilize/mobilize-content-access";

type Ctx = { params: Promise<{ userId: string; postId: string }> };

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
