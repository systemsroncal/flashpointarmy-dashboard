import { NextResponse } from "next/server";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";
import { loadMobilizeSocialAlerts } from "@/lib/mobilize/social/load-social-alerts";

export async function GET(req: Request) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const limit = Math.min(60, Math.max(1, Number(url.searchParams.get("limit") || 40)));

  try {
    const alerts = await loadMobilizeSocialAlerts(auth.admin, auth.userId, limit);
    return NextResponse.json({ alerts });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load alerts.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
