import { NextResponse } from "next/server";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";
import { loadMutualFollowRecipients } from "@/lib/mobilize/social/load-direct-messages";

export async function GET(req: Request) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim();

  try {
    const recipients = await loadMutualFollowRecipients(auth.admin, auth.userId, q);
    return NextResponse.json({
      recipients: recipients.map((recipient) => ({
        id: recipient.id,
        display_name: recipient.display_name,
        handle: recipient.handle,
        avatar_url: recipient.avatar_url,
      })),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load recipients.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
