import { NextResponse } from "next/server";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";
import { loadProfileLikes, loadProfileReplies } from "@/lib/mobilize/social/load-profile-tab-feeds";
import { canViewMobilizeProfile } from "@/lib/mobilize/social/profile-access";

type Ctx = { params: Promise<{ userId: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;
  const { userId } = await ctx.params;

  const allowed = await canViewMobilizeProfile(auth.admin, auth.userId, userId);
  if (!allowed && auth.userId !== userId) {
    return NextResponse.json({ error: "This profile is private." }, { status: 403 });
  }

  const url = new URL(req.url);
  const tab = url.searchParams.get("tab");
  const limit = Math.min(60, Math.max(1, Number(url.searchParams.get("limit") || 40)));

  try {
    if (tab === "likes") {
      const posts = await loadProfileLikes(auth.admin, auth.userId, userId, limit);
      return NextResponse.json({ posts });
    }
    const posts = await loadProfileReplies(auth.admin, auth.userId, userId, limit);
    return NextResponse.json({ posts });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load profile tab.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
