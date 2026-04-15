import { createAdminClient } from "@/utils/supabase/admin";

export type EmailSendLogInput = {
  status: "sent" | "failed";
  templateKey: string | null;
  fromAddress: string;
  toAddress: string;
  subject: string;
  bodyPreview: string;
  errorMessage?: string | null;
  triggeredByUserId?: string | null;
};

const PREVIEW_MAX = 8000;

export async function insertEmailSendLog(input: EmailSendLogInput): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("email_send_logs").insert({
      status: input.status,
      template_key: input.templateKey,
      from_address: input.fromAddress,
      to_address: input.toAddress,
      subject: input.subject?.slice(0, 500) ?? null,
      body_preview: input.bodyPreview.slice(0, PREVIEW_MAX),
      error_message: input.errorMessage?.slice(0, 2000) ?? null,
      triggered_by_user_id: input.triggeredByUserId ?? null,
    });
  } catch (e) {
    console.error("insertEmailSendLog failed:", e);
  }
}
