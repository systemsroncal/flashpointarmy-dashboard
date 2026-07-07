import { NextResponse } from "next/server";
import { fetchMobilizeNotifications } from "@/lib/mobilize/fetch-mobilize-notifications";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";

export async function GET(req: Request) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;

  const groupId = new URL(req.url).searchParams.get("groupId");

  try {
    const payload = await fetchMobilizeNotifications(auth.admin, auth.userId, {
      groupId,
    });
    return NextResponse.json(payload);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to load notifications.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
