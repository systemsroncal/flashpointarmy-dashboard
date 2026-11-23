import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchEmailDeliverySettings } from "@/lib/mail/email-delivery-settings";

/**
 * Microsoft 365 / Exchange Online sending limits (single mailbox, SMTP AUTH / client submission).
 * @see https://learn.microsoft.com/en-us/office365/servicedescriptions/exchange-online-service-description/exchange-online-limits
 */
export const OFFICE365_MESSAGES_PER_MINUTE = 30;
/** Headroom under the 30/minute tenant/mailbox rate limit. */
export const OFFICE365_MESSAGES_PER_MINUTE_SAFE = 28;
/** Default daily recipient cap for many Exchange Online mailboxes. */
export const OFFICE365_RECIPIENTS_PER_24H = 10_000;

export type MissionUpdateEmailThrottleProfile = {
  name: "office365" | "conservative";
  messagesPerMinute: number;
  recipientsPerDay: number;
  minDelayBetweenSendsMs: number;
  maxBatchPerRun: number;
  maxRuntimeMs: number;
  continuationDelayMs: number;
};

const OFFICE365_PROFILE: MissionUpdateEmailThrottleProfile = {
  name: "office365",
  messagesPerMinute: OFFICE365_MESSAGES_PER_MINUTE_SAFE,
  recipientsPerDay: OFFICE365_RECIPIENTS_PER_24H,
  /** ~28/min ⇒ ≥ 2143 ms; round up for safety. */
  minDelayBetweenSendsMs: 2200,
  maxBatchPerRun: 24,
  maxRuntimeMs: 55_000,
  continuationDelayMs: 8000,
};

function envInt(name: string, fallback: number, opts?: { min?: number; max?: number }): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) return fallback;
  let v = n;
  if (opts?.min != null) v = Math.max(opts.min, v);
  if (opts?.max != null) v = Math.min(opts.max, v);
  return v > 0 ? v : fallback;
}

export function isMicrosoft365SmtpHost(host: string | null | undefined): boolean {
  const h = (host ?? "").trim().toLowerCase();
  if (!h) return false;
  return (
    h === "smtp.office365.com" ||
    h === "smtp-mail.outlook.com" ||
    h.includes("outlook.com") ||
    h.includes("office365.com") ||
    h.includes("protection.outlook.com")
  );
}

function profileFromEnv(): MissionUpdateEmailThrottleProfile {
  const forced = process.env.MISSION_UPDATE_EMAIL_THROTTLE_PROFILE?.trim().toLowerCase();
  const base = forced === "conservative" ? { ...OFFICE365_PROFILE, name: "conservative" as const } : OFFICE365_PROFILE;

  const messagesPerMinute = envInt("MISSION_UPDATE_EMAIL_MESSAGES_PER_MINUTE", base.messagesPerMinute, {
    min: 1,
    max: OFFICE365_MESSAGES_PER_MINUTE,
  });
  const minDelay = envInt("MISSION_UPDATE_EMAIL_SEND_DELAY_MS", base.minDelayBetweenSendsMs, {
    min: Math.ceil(60_000 / messagesPerMinute),
  });

  return {
    ...base,
    messagesPerMinute,
    recipientsPerDay: envInt("MISSION_UPDATE_EMAIL_RECIPIENTS_PER_DAY", base.recipientsPerDay, {
      min: 100,
      max: OFFICE365_RECIPIENTS_PER_24H,
    }),
    minDelayBetweenSendsMs: minDelay,
    maxBatchPerRun: envInt("MISSION_UPDATE_EMAIL_BATCH_SIZE", base.maxBatchPerRun, {
      min: 1,
      max: messagesPerMinute,
    }),
    maxRuntimeMs: envInt("MISSION_UPDATE_EMAIL_MAX_RUNTIME_MS", base.maxRuntimeMs),
    continuationDelayMs: envInt("MISSION_UPDATE_EMAIL_CONTINUATION_DELAY_MS", base.continuationDelayMs, {
      min: 3000,
    }),
  };
}

/** Mission Update mail always uses Microsoft 365–safe pacing (default for Office 365 SMTP). */
export async function resolveMissionUpdateEmailThrottleProfile(
  _admin?: SupabaseClient
): Promise<MissionUpdateEmailThrottleProfile> {
  void _admin;
  return profileFromEnv();
}

/** @deprecated Use resolveMissionUpdateEmailThrottleProfile; kept for delivery UI hints. */
export async function isOffice365SmtpConfigured(admin: SupabaseClient): Promise<boolean> {
  try {
    const row = await fetchEmailDeliverySettings(admin);
    if (row?.provider === "dashboard_smtp") return isMicrosoft365SmtpHost(row.smtp_host);
    const envHost = process.env.SMTP_HOST?.trim();
    return row?.provider === "env_smtp" && isMicrosoft365SmtpHost(envHost);
  } catch {
    return false;
  }
}

export function isMicrosoft365ThrottleSmtpError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("451") ||
    m.includes("4.7.652") ||
    m.includes("4.7.0") ||
    m.includes("432") ||
    m.includes("throttl") ||
    m.includes("rate limit") ||
    m.includes("too many recipients") ||
    m.includes("messages per minute")
  );
}