import { insertInviteShareActivity, isInviteShareChannel } from "@/lib/community/invite-share-feed";
import { requireApiAuth } from "@/lib/auth/server-session";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const authResult = await requireApiAuth();
    if ("response" in authResult) return authResult.response;
    const { supabase, user } = authResult;

    const body = (await req.json()) as { channel?: string };
    const channel = (body.channel || "").trim().toLowerCase();
    if (!isInviteShareChannel(channel)) {
      return NextResponse.json({ error: "Invalid share channel." }, { status: 400 });
    }

    await insertInviteShareActivity({ supabase, userId: user.id, channel });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not log invite share." },
      { status: 500 }
    );
  }
}
