import { NextResponse } from "next/server";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";
import { canViewMobilizeProfile } from "@/lib/mobilize/social/profile-access";
import { resolveMobilizeAuthors } from "@/lib/mobilize/social/resolve-authors";

type Ctx = { params: Promise<{ userId: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;
  const { userId } = await ctx.params;

  const url = new URL(req.url);
  const type = (url.searchParams.get("type") || "followers").toLowerCase();

  if (type !== "followers" && type !== "following") {
    return NextResponse.json({ error: "type must be 'followers' or 'following'." }, { status: 400 });
  }

  // Only public profiles (or the user's own profile) expose follower/following lists.
  if (auth.userId !== userId) {
    const allowed = await canViewMobilizeProfile(auth.admin, auth.userId, userId);
    if (!allowed) {
      return NextResponse.json({ error: "This profile is private." }, { status: 403 });
    }
  }

  let rows: { other_user_id: string }[] = [];
  if (type === "followers") {
    const { data, error } = await auth.admin
      .from("mobilize_user_follows")
      .select("follower_id")
      .eq("following_id", userId)
      .order("created_at", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    rows = (data ?? []).map((r) => ({ other_user_id: r.follower_id as string }));
  } else {
    const { data, error } = await auth.admin
      .from("mobilize_user_follows")
      .select("following_id")
      .eq("follower_id", userId)
      .order("created_at", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    rows = (data ?? []).map((r) => ({ other_user_id: r.following_id as string }));
  }

  const userIds = [...new Set(rows.map((r) => r.other_user_id).filter(Boolean))];
  const authors = await resolveMobilizeAuthors(auth.admin, userIds);

  const users = userIds
    .map((id) => {
      const author = authors.get(id);
      if (!author) return null;
      return author;
    })
    .filter((u): u is NonNullable<typeof u> => Boolean(u));

  return NextResponse.json({ users });
}
