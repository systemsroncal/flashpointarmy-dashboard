import type { SupabaseClient } from "@supabase/supabase-js";
import {
  insertAnnouncementEmailQueueRows,
  resolveAnnouncementEmailUserIds,
} from "@/lib/dashboard/announcement-email-audience";
import { filterMissionUpdateEmailRecipients } from "@/lib/dashboard/mission-update-email-active-recipients";
import { normalizeAnnouncementAudience } from "@/lib/dashboard/announcements-types";

export type MissionUpdateEmailJobRow = {
  id: string;
  announcement_id: string;
  status: string;
};

export async function enqueueMissionUpdateEmailJob(
  admin: SupabaseClient,
  opts: {
    announcementId: string;
    audience: unknown;
    targetUserId?: string | null;
    createdBy: string | null;
  }
): Promise<MissionUpdateEmailJobRow | null> {
  const audience = normalizeAnnouncementAudience(opts.audience);

  const { data: existing } = await admin
    .from("dashboard_announcement_email_jobs")
    .select("id, announcement_id, status")
    .eq("announcement_id", opts.announcementId)
    .maybeSingle();
  if (existing) {
    return existing as MissionUpdateEmailJobRow;
  }

  const audienceUserIds = await resolveAnnouncementEmailUserIds(admin, {
    audience,
    announcementId: opts.announcementId,
    targetUserId: opts.targetUserId,
  });

  const { recipientIds: userIds, excludedInactive } = await filterMissionUpdateEmailRecipients(
    admin,
    audienceUserIds,
    { bypassActivityFilter: Boolean(opts.targetUserId) }
  );

  const { data: job, error: jobErr } = await admin
    .from("dashboard_announcement_email_jobs")
    .insert({
      announcement_id: opts.announcementId,
      status: userIds.length ? "pending" : "completed",
      total_queued: userIds.length,
      excluded_inactive_count: excludedInactive,
      completed_at: userIds.length ? null : new Date().toISOString(),
      created_by: opts.createdBy,
    })
    .select("id, announcement_id, status")
    .single();

  if (jobErr) throw new Error(jobErr.message);
  const jobRow = job as MissionUpdateEmailJobRow;

  if (!userIds.length) return jobRow;

  await insertAnnouncementEmailQueueRows(admin, jobRow.id, opts.announcementId, userIds);

  return jobRow;
}