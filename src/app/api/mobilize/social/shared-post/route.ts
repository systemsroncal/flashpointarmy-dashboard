import { NextResponse } from "next/server";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";
import {
  loadSharedGroupMessage,
  loadSharedProfilePost,
} from "@/lib/mobilize/social/load-shared-post";

export async function GET(req: Request) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const kind = (url.searchParams.get("kind") || "").trim();
  const postId = (url.searchParams.get("post_id") || "").trim();

  if (!postId) {
    return NextResponse.json({ error: "post_id is required." }, { status: 400 });
  }

  if (kind === "group_message") {
    const groupId = (url.searchParams.get("group_id") || "").trim();
    if (!groupId) {
      return NextResponse.json({ error: "group_id is required." }, { status: 400 });
    }
    const post = await loadSharedGroupMessage(auth.admin, auth.userId, groupId, postId);
    if (!post) return NextResponse.json({ error: "Post not found." }, { status: 404 });
    return NextResponse.json({ post });
  }

  if (kind === "profile_post") {
    const userId = (url.searchParams.get("user_id") || "").trim();
    if (!userId) {
      return NextResponse.json({ error: "user_id is required." }, { status: 400 });
    }
    const post = await loadSharedProfilePost(auth.admin, auth.userId, userId, postId);
    if (!post) return NextResponse.json({ error: "Post not found." }, { status: 404 });
    return NextResponse.json({ post });
  }

  return NextResponse.json({ error: "Invalid kind." }, { status: 400 });
}