import { tickCommunityAutoFeeds } from "@/lib/community/community-auto-feed";
import { requireApiAuth } from "@/lib/auth/server-session";
import { NextResponse } from "next/server";

export async function POST() {
  const authResult = await requireApiAuth();
  if ("response" in authResult) return authResult.response;

  try {
    const result = await tickCommunityAutoFeeds();
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Auto feed tick failed." },
      { status: 500 }
    );
  }
}
