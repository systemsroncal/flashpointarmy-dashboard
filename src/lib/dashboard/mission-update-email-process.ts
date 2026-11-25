import type { SupabaseClient } from "@supabase/supabase-js";
import { getAppBaseUrl } from "@/lib/mail/app-base-url";
import { resolveUserEmailForDelivery } from "@/lib/mail/resolve-user-email";
import { sendTemplatedEmail } from "@/lib/mail/send-templated-email";
import {
  missionUpdateEmailPreviewHtml,
  missionUpdateEmailUrl,
} from "@/lib/dashboard/mission-update-email-content";
import {
  isMicrosoft365ThrottleSmtpError,
  resolveMissionUpdateEmailThrottleProfile,
  type MissionUpdateEmailThrottleProfile,
} from "@/lib/dashboard/mission-update-email-office365-limits";
import { acquireMissionUpdateEmailSendSlot } from "@/lib/dashboard/mission-update-email-throttle";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function displayNameForUser(admin: SupabaseClient, userId: string, email: string) {
  const { data: prof } = await admin
    .from("profiles")
    .select("first_name, last_name, display_name")
    .eq("id", userId)
    .maybeSingle();
  if (prof?.first_name || prof?.last_name) {
    return `${prof.first_name ?? ""} ${prof.last_name ?? ""}`.trim();
  }
  if (prof?.display_name) return String(prof.display_name);
  const { data: du } = await admin
    .from("dashboard_users")
    .select("first_name, last_name, display_name")
    .eq("id", userId)
    .maybeSingle();
  if (du?.first_name || du?.last_name) {
    return `${du.first_name ?? ""} ${du.last_name ?? ""}`.trim();
  }
  if (du?.display_name) return String(du.display_name);
  return email.split("@")[0] || "there";
}

export type ProcessMissionUpdateEmailResult = {
  processed: number;
  sent: number;
  failed: number;
  skipped: number;
  remaining: number;
  jobStatus: string;
  done: boolean;
  paused?: boolean;
};

async function pauseJobForDailyLimit(admin: SupabaseClient, jobId: string) {
  const ts = new Date().toISOString();
  await admin
    .from("dashboard_announcement_email_jobs")
    .update({
      last_error:
        "Paused: Microsoft 365 daily sending limit reached for this mailbox. Remaining emails will send after the UTC day resets (or raise your tenant limit).",
      updated_at: ts,
    })
    .eq("id", jobId);
}

export async function processMissionUpdateEmailJob(
  admin: SupabaseClient,
  jobId: string
): Promise<ProcessMissionUpdateEmailResult> {
  const profile = await resolveMissionUpdateEmailThrottleProfile(admin);

  const { data: job, error: jobErr } = await admin
    .from("dashboard_announcement_email_jobs")
    .select(
      "id, announcement_id, status, total_queued, sent_count, failed_count, skipped_count, started_at"
    )
    .eq("id", jobId)
    .maybeSingle();

  if (jobErr) throw new Error(jobErr.message);
  if (!job) throw new Error("Email job not found.");

  const jobRow = job as {
    id: string;
    announcement_id: string;
    status: string;
    total_queued: number;
    sent_count: number;
    failed_count: number;
    skipped_count: number;
    started_at: string | null;
  };

  if (jobRow.status === "completed" || jobRow.status === "failed") {
    return {
      processed: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
      remaining: 0,
      jobStatus: jobRow.status,
      done: true,
    };
  }

  const now = new Date().toISOString();
  if (jobRow.status === "pending") {
    await admin
      .from("dashboard_announcement_email_jobs")
      .update({ status: "processing", started_at: now, updated_at: now, last_error: null })
      .eq("id", jobId);
  }

  const { data: announcement, error: annErr } = await admin
    .from("dashboard_announcements")
    .select("id, title, description, created_by")
    .eq("id", jobRow.announcement_id)
    .maybeSingle();

  if (annErr) throw new Error(annErr.message);
  if (!announcement) {
    await admin
      .from("dashboard_announcement_email_jobs")
      .update({
        status: "failed",
        last_error: "Announcement not found.",
        completed_at: now,
        updated_at: now,
      })
      .eq("id", jobId);
    return {
      processed: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
      remaining: 0,
      jobStatus: "failed",
      done: true,
    };
  }

  const siteBase = await getAppBaseUrl(admin);
  const missionUpdateUrl = missionUpdateEmailUrl(siteBase, jobRow.announcement_id);
  const previewHtml = missionUpdateEmailPreviewHtml(String(announcement.description ?? ""));
  const title = String(announcement.title ?? "Mission Update");
  const triggeredBy = (announcement as { created_by?: string | null }).created_by ?? null;

  const { data: pendingRows, error: qErr } = await admin
    .from("dashboard_announcement_email_queue")
    .select("id, user_id")
    .eq("job_id", jobId)
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(profile.maxBatchPerRun);

  if (qErr) throw new Error(qErr.message);

  const start = Date.now();
  let processed = 0;
  let sent = 0;
  let failed = 0;
  let skipped = 0;
  let paused = false;

  for (const row of pendingRows ?? []) {
    if (Date.now() - start >= profile.maxRuntimeMs) break;

    const queueId = String((row as { id: string }).id);
    const userId = String((row as { user_id: string }).user_id);

    processed += 1;

    try {
      const delivery = await resolveUserEmailForDelivery(admin, userId);
      const to = delivery.email?.trim().toLowerCase();
      if (!to || !to.includes("@")) {
        skipped += 1;
        await admin
          .from("dashboard_announcement_email_queue")
          .update({ status: "skipped", error_message: "No deliverable email." })
          .eq("id", queueId);
        continue;
      }

      const slot = await acquireMissionUpdateEmailSendSlot(admin, profile);
      if (!slot.ok) {
        if (slot.reason === "daily_limit") {
          await pauseJobForDailyLimit(admin, jobId);
          paused = true;
        }
        processed -= 1;
        break;
      }

      const fullName = await displayNameForUser(admin, userId, to);
      await sendTemplatedEmail(
        "mission_update_new",
        to,
        {
          user_fullname: fullName,
          user_email: to,
          mission_update_title: title,
          mission_update_url: missionUpdateUrl,
          mission_update_preview_html: previewHtml,
          app_name:
            "FlashPoint Army Chapters Command Center - Connect. Grow. Lead. Mobile. Impact Your City.",
          current_year: String(new Date().getFullYear()),
          resetpassword_url: "",
          validateemail_url: "",
        },
        { triggeredByUserId: triggeredBy }
      );

      sent += 1;
      await admin
        .from("dashboard_announcement_email_queue")
        .update({ status: "sent", sent_at: new Date().toISOString(), error_message: null })
        .eq("id", queueId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (isMicrosoft365ThrottleSmtpError(msg)) {
        await admin
          .from("dashboard_announcement_email_queue")
          .update({
            status: "pending",
            error_message: `Throttled by mail provider; will retry. ${msg.slice(0, 1800)}`,
          })
          .eq("id", queueId);
        await sleep(90_000);
        break;
      }
      failed += 1;
      await admin
        .from("dashboard_announcement_email_queue")
        .update({ status: "failed", error_message: msg.slice(0, 2000) })
        .eq("id", queueId);
    }

    const moreInThisBatch = processed < (pendingRows?.length ?? 0);
    if (moreInThisBatch && !paused) {
      await sleep(profile.minDelayBetweenSendsMs);
    }
  }

  const { count: remainingCount } = await admin
    .from("dashboard_announcement_email_queue")
    .select("id", { count: "exact", head: true })
    .eq("job_id", jobId)
    .eq("status", "pending");

  const remaining = remainingCount ?? 0;
  const ts = new Date().toISOString();

  let jobStatus = "processing";
  let done = false;

  await admin
    .from("dashboard_announcement_email_jobs")
    .update({
      sent_count: jobRow.sent_count + sent,
      failed_count: jobRow.failed_count + failed,
      skipped_count: jobRow.skipped_count + skipped,
      updated_at: ts,
    })
    .eq("id", jobId);

  if (remaining === 0) {
    jobStatus = failed > 0 && sent === 0 && jobRow.sent_count === 0 ? "failed" : "completed";
    done = true;
    await admin
      .from("dashboard_announcement_email_jobs")
      .update({
        status: jobStatus,
        completed_at: ts,
        updated_at: ts,
        last_error: null,
      })
      .eq("id", jobId);
  }

  return {
    processed,
    sent,
    failed,
    skipped,
    remaining,
    jobStatus,
    done,
    paused,
  };
}

export async function drainMissionUpdateEmailJob(
  admin: SupabaseClient,
  jobId: string,
  profile?: MissionUpdateEmailThrottleProfile
): Promise<ProcessMissionUpdateEmailResult> {
  const limits = profile ?? (await resolveMissionUpdateEmailThrottleProfile(admin));
  const wallStart = Date.now();
  let last: ProcessMissionUpdateEmailResult = {
    processed: 0,
    sent: 0,
    failed: 0,
    skipped: 0,
    remaining: 0,
    jobStatus: "pending",
    done: false,
  };

  while (Date.now() - wallStart < limits.maxRuntimeMs) {
    last = await processMissionUpdateEmailJob(admin, jobId);
    if (last.done || last.remaining === 0 || last.paused) break;
    if (last.processed === 0) break;
    await sleep(limits.continuationDelayMs);
  }

  return last;
}