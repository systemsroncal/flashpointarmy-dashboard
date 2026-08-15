import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/server-session";
import { loadMobilizeSocialAlerts } from "@/lib/mobilize/social/load-social-alerts";
import { createAdminClient } from "@/utils/supabase/admin";

const ALERT_ID_MAX = 200;

function parseAlertId(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const id = raw.trim();
  if (!id || id.length > ALERT_ID_MAX) return null;
  return id;
}

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

/** Dismiss a social alert for the signed-in user (hide from dropdown + page). */
export async function DELETE(req: Request) {
  const authResult = await requireApiAuth();
  if ("response" in authResult) return authResult.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const alertId = parseAlertId(
    body && typeof body === "object" && "alert_id" in body
      ? (body as { alert_id: unknown }).alert_id
      : null
  );
  if (!alertId) {
    return NextResponse.json({ error: "alert_id is required." }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.from("mobilize_social_alert_dismissed").upsert(
      {
        user_id: authResult.user.id,
        alert_id: alertId,
        dismissed_at: new Date().toISOString(),
      },
      { onConflict: "user_id,alert_id" }
    );
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to delete notification.";
    // Table may not exist yet before migration 092 — treat as soft failure for deploy lag.
    if (typeof message === "string" && /mobilize_social_alert_dismissed|schema cache/i.test(message)) {
      return NextResponse.json(
        { error: "Delete is not available yet. Please try again after the next update." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
