import type { SupabaseClient } from "@supabase/supabase-js";
import type { MissionUpdateEmailThrottleProfile } from "@/lib/dashboard/mission-update-email-office365-limits";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type ClaimRow = {
  allowed: boolean;
  wait_seconds: number | null;
  reason: string | null;
};

const MAX_WAIT_LOOPS = 120;

/**
 * Waits until the global counter allows another outbound Mission Update email.
 * Uses Postgres `claim_mission_update_email_send` when recipientsPerDay > 0 (Office 365 profile).
 */
export async function acquireMissionUpdateEmailSendSlot(
  admin: SupabaseClient,
  profile: MissionUpdateEmailThrottleProfile
): Promise<{ ok: true } | { ok: false; reason: "daily_limit" | "throttle_unavailable" }> {
  for (let i = 0; i < MAX_WAIT_LOOPS; i++) {
    const { data, error } = await admin.rpc("claim_mission_update_email_send", {
      p_max_per_minute: profile.messagesPerMinute,
      p_max_per_day: profile.recipientsPerDay > 0 ? profile.recipientsPerDay : 2_000_000_000,
    });

    if (error) {
      console.warn("[mission-update-email] throttle RPC unavailable, using delay only:", error.message);
      await sleep(profile.minDelayBetweenSendsMs);
      return { ok: true };
    }

    const row = (Array.isArray(data) ? data[0] : data) as ClaimRow | undefined;
    if (row?.allowed) {
      return { ok: true };
    }
    if (row?.reason === "daily_limit") {
      return { ok: false, reason: "daily_limit" };
    }
    const waitSec = Math.min(Math.max(row?.wait_seconds ?? 30, 1), 120);
    await sleep(waitSec * 1000);
  }

  return { ok: false, reason: "throttle_unavailable" };
}