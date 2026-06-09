import { NextResponse } from "next/server";
import { fetchMobilizeNotifications } from "@/lib/mobilize/fetch-mobilize-notifications";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";

export async function GET() {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;

  try {
    const payload = await fetchMobilizeNotifications(auth.admin, auth.userId);
    return NextResponse.json(payload);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to load notifications.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
