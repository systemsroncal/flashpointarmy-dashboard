import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/server-session";
import { loadMobilizeSocialAlerts } from "@/lib/mobilize/social/load-social-alerts";
import { createAdminClient } from "@/utils/supabase/admin";

export async function GET(req: Request) {
  const authResult = await requireApiAuth();
  if ("response" in authResult) return authResult.response;

  const url = new URL(req.url);
  const limit = Math.min(60, Math.max(1, Number(url.searchParams.get("limit") || 40)));

  try {
    const admin = createAdminClient();
    const alerts = await loadMobilizeSocialAlerts(admin, authResult.user.id, limit);
    return NextResponse.json({ alerts });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load notifications.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
