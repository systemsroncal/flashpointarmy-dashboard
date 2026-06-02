import { usStateByCode } from "@/data/usStates";

export const BROADCAST_CHANNELS = ["email", "sms"] as const;
export type BroadcastChannel = (typeof BROADCAST_CHANNELS)[number];

export const BROADCAST_AUDIENCES = [
  "all_users",
  "members",
  "local_leaders",
  "admins",
  "sub_admins",
  "all_admins",
  "all_staff",
] as const;
export type BroadcastAudience = (typeof BROADCAST_AUDIENCES)[number];

export const AUDIENCE_LABELS: Record<BroadcastAudience, string> = {
  all_users: "All users",
  members: "Members",
  local_leaders: "Local leaders",
  admins: "Administrators (admin + super admin)",
  sub_admins: "Sub administrators",
  all_admins: "All administrators (admin + super admin + sub admin)",
  all_staff: "All staff (admins + sub admins + local leaders)",
};

export const EMAIL_PROVIDERS = ["dashboard", "brevo", "sendgrid", "mailchimp"] as const;
export type EmailProvider = (typeof EMAIL_PROVIDERS)[number];

export const EMAIL_PROVIDER_LABELS: Record<EmailProvider, string> = {
  dashboard: "Dashboard SMTP / Gmail (configured in Emails)",
  brevo: "Brevo API",
  sendgrid: "SendGrid (Twilio Email)",
  mailchimp: "Mailchimp Transactional",
};

export type BroadcastAudienceFilter = {
  audience: BroadcastAudience;
  /** USPS state code (e.g. TX) or null for all states */
  stateCode?: string | null;
  /** Chapter UUID or null for all chapters (within state when stateCode is set) */
  chapterId?: string | null;
};

export type BroadcastRecipient = {
  userId: string;
  email: string | null;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  chapterName: string | null;
  roleNames: string[];
};

export type BroadcastTemplateRow = {
  id: string;
  name: string;
  channel: BroadcastChannel;
  subject: string | null;
  body_html: string | null;
  body_text: string;
  shortcodes_help: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type BroadcastCampaignRow = {
  id: string;
  name: string;
  channel: BroadcastChannel;
  template_id: string | null;
  subject: string | null;
  body_html: string | null;
  body_text: string;
  audience: BroadcastAudienceFilter;
  email_provider: EmailProvider;
  status: "draft" | "sending" | "sent" | "failed" | "cancelled";
  recipient_count: number;
  sent_count: number;
  failed_count: number;
  created_by: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
};

export const DEFAULT_SHORTCODES_HELP =
  "{user_fullname}, {user_first_name}, {user_last_name}, {user_email}, {user_phone}, {chapter_name}, {app_name}, {current_year}";

/** Human-readable scope for history / logs */
export function describeBroadcastAudienceFilter(filter: BroadcastAudienceFilter): string {
  const parts = [AUDIENCE_LABELS[filter.audience]];
  if (filter.stateCode) {
    parts.push(usStateByCode(filter.stateCode)?.name ?? filter.stateCode);
  }
  if (filter.chapterId) parts.push("Chapter");
  return parts.join(" · ");
}
