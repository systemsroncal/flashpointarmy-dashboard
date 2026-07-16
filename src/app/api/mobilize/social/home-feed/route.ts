import { NextResponse } from "next/server";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";
import { loadMobilizeHomeFeed } from "@/lib/mobilize/social/load-home-feed";

export async function GET(req: Request) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const limit = Math.min(60, Math.max(1, Number(url.searchParams.get("limit") || 40)));

  try {
    const feed = await loadMobilizeHomeFeed(auth.admin, auth.userId, limit);
    return NextResponse.json(feed);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load feed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
