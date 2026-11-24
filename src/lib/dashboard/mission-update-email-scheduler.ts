import { createAdminClient } from "@/utils/supabase/admin";
import { drainMissionUpdateEmailJob } from "@/lib/dashboard/mission-update-email-process";
import { resolveMissionUpdateEmailThrottleProfile } from "@/lib/dashboard/mission-update-email-office365-limits";
import { after } from "next/server";
import { getAppBaseUrl } from "@/lib/mail/app-base-url";

function workerSecret(): string | null {
  return (
    process.env.MISSION_UPDATE_EMAIL_CRON_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim() ||
    null
  );
}

async function kickRemoteWorker(jobId: string) {
  const secret = workerSecret();
  if (!secret) return;
  try {
    const admin = createAdminClient();
    const base = await getAppBaseUrl(admin);
    await fetch(`${base.replace(/\/$/, "")}/api/internal/mission-update-emails/process`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({ job_id: jobId }),
      cache: "no-store",
    });
  } catch {
    /* best-effort */
  }
}

export function scheduleMissionUpdateEmailProcessing(jobId: string) {
  after(async () => {
    const admin = createAdminClient();
    const profile = await resolveMissionUpdateEmailThrottleProfile(admin);
    const result = await drainMissionUpdateEmailJob(admin, jobId, profile);
    if (!result.done && result.remaining > 0 && !result.paused) {
      await new Promise((r) => setTimeout(r, profile.continuationDelayMs));
      await kickRemoteWorker(jobId);
    }
  });
}