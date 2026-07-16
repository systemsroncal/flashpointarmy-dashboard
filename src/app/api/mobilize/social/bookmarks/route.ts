import { NextResponse } from "next/server";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";
import { loadMobilizeBookmarks } from "@/lib/mobilize/social/load-bookmarks";

export async function GET(req: Request) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const limit = Math.min(60, Math.max(1, Number(url.searchParams.get("limit") || 40)));

  try {
    const posts = await loadMobilizeBookmarks(auth.admin, auth.userId, limit);
    return NextResponse.json({ posts });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load bookmarks.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;

  const body = (await req.json()) as { post_kind?: string; post_ref_id?: string };
  const postKind = body.post_kind;
  const postRefId = body.post_ref_id?.trim();

  if ((postKind !== "profile_post" && postKind !== "group_message") || !postRefId) {
    return NextResponse.json({ error: "Invalid bookmark payload." }, { status: 400 });
  }

  const { error } = await auth.admin.from("mobilize_social_bookmarks").upsert({
    user_id: auth.userId,
    post_kind: postKind,
    post_ref_id: postRefId,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const postKind = url.searchParams.get("post_kind");
  const postRefId = url.searchParams.get("post_ref_id");

  if ((postKind !== "profile_post" && postKind !== "group_message") || !postRefId) {
    return NextResponse.json({ error: "Invalid bookmark payload." }, { status: 400 });
  }

  const { error } = await auth.admin
    .from("mobilize_social_bookmarks")
    .delete()
    .eq("user_id", auth.userId)
    .eq("post_kind", postKind)
    .eq("post_ref_id", postRefId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
