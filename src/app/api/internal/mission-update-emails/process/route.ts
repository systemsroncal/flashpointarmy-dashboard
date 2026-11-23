import { drainMissionUpdateEmailJob } from "@/lib/dashboard/mission-update-email-process";
import { resolveMissionUpdateEmailThrottleProfile } from "@/lib/dashboard/mission-update-email-office365-limits";
import { createAdminClient } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function authorizeCron(req: Request): boolean {
  const secret =
    process.env.MISSION_UPDATE_EMAIL_CRON_SECRET?.trim() || process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const auth = req.headers.get("authorization")?.trim() ?? "";
  if (auth === `Bearer ${secret}`) return true;
  const header = req.headers.get("x-cron-secret")?.trim();
  return header === secret;
}

export async function POST(req: Request) {
  if (!authorizeCron(req)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: { job_id?: string; announcement_id?: string };
  try {
    body = (await req.json()) as { job_id?: string; announcement_id?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const admin = createAdminClient();
  let jobId = (body.job_id ?? "").trim();

  if (!jobId && body.announcement_id?.trim()) {
    const { data } = await admin
      .from("dashboard_announcement_email_jobs")
      .select("id")
      .eq("announcement_id", body.announcement_id.trim())
      .maybeSingle();
    jobId = data ? String((data as { id: string }).id) : "";
  }

  if (!UUID_RE.test(jobId)) {
    return NextResponse.json({ error: "Valid job_id required." }, { status: 400 });
  }

  try {
    const profile = await resolveMissionUpdateEmailThrottleProfile(admin);
    const result = await drainMissionUpdateEmailJob(admin, jobId, profile);

    if (!result.done && result.remaining > 0 && !result.paused) {
      const secret =
        process.env.MISSION_UPDATE_EMAIL_CRON_SECRET?.trim() || process.env.CRON_SECRET?.trim();
      const base =
        process.env.APP_URL?.trim() ||
        process.env.NEXT_PUBLIC_APP_URL?.trim() ||
        new URL(req.url).origin;
      if (secret) {
        await new Promise((r) => setTimeout(r, profile.continuationDelayMs));
        void fetch(`${base.replace(/\/$/, "")}/api/internal/mission-update-emails/process`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${secret}`,
          },
          body: JSON.stringify({ job_id: jobId }),
          cache: "no-store",
        }).catch(() => undefined);
      }
    }

    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Processing failed." },
      { status: 500 }
    );
  }
}