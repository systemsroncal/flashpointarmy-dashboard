import { NextResponse } from "next/server";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";
import { canSendDirectMessage, loadMobilizeDirectMessages } from "@/lib/mobilize/social/load-direct-messages";

export async function GET(req: Request) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const limit = Math.min(80, Math.max(1, Number(url.searchParams.get("limit") || 60)));

  try {
    const messages = await loadMobilizeDirectMessages(auth.admin, auth.userId, limit);
    return NextResponse.json({ messages });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load messages.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;

  const body = (await req.json()) as { recipient_id?: string; body?: string };
  const recipientId = body.recipient_id?.trim();
  const text = body.body?.trim();

  if (!recipientId || !text) {
    return NextResponse.json({ error: "Recipient and message body are required." }, { status: 400 });
  }

  const gate = await canSendDirectMessage(auth.admin, auth.userId, recipientId);
  if (!gate.ok) return NextResponse.json({ error: gate.reason }, { status: 403 });

  const { data, error } = await auth.admin
    .from("mobilize_direct_messages")
    .insert({
      sender_id: auth.userId,
      recipient_id: recipientId,
      body: text,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}
