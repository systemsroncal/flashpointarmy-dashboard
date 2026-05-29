import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveBroadcastRecipients } from "@/lib/broadcast/audience";
import {
  renderBroadcastEmail,
  renderBroadcastSms,
  toAbsolutePublicUrl,
} from "@/lib/broadcast/render-broadcast";
import { shortcodesForRecipient } from "@/lib/broadcast/shortcodes";
import {
  isEmailProviderConfigured,
  isTwilioSmsConfigured,
} from "@/lib/broadcast/providers/registry";
import { sendBroadcastEmail, sendBroadcastSms } from "@/lib/broadcast/providers/send";
import { getAppBaseUrl } from "@/lib/mail/app-base-url";
import type { BroadcastCampaignRow } from "@/lib/broadcast/types";

export type SendCampaignResult = {
  sent: number;
  failed: number;
  skipped: number;
};

export async function executeBroadcastCampaign(
  admin: SupabaseClient,
  campaign: BroadcastCampaignRow
): Promise<SendCampaignResult> {
  if (campaign.channel === "email" && !isEmailProviderConfigured(campaign.email_provider)) {
    throw new Error(`Email provider "${campaign.email_provider}" is not configured.`);
  }
  if (campaign.channel === "sms" && !isTwilioSmsConfigured()) {
    throw new Error("Twilio SMS is not configured.");
  }

  const recipients = await resolveBroadcastRecipients(admin, campaign.audience, campaign.channel);
  const subject = campaign.subject ?? "";
  const bodyHtml = campaign.body_html ?? "";
  const bodyText = campaign.body_text ?? "";

  let branding: {
    logo_url: string | null;
    logo_bg_color: string;
    container_bg_color: string;
    footer_html: string;
  } | null = null;

  if (campaign.channel === "email") {
    const siteBase = await getAppBaseUrl(admin);
    const { data } = await admin.from("email_branding_settings").select("*").eq("id", true).maybeSingle();
    if (data) {
      branding = {
        logo_url: toAbsolutePublicUrl(siteBase, data.logo_url as string | null),
        logo_bg_color: data.logo_bg_color as string,
        container_bg_color: data.container_bg_color as string,
        footer_html: data.footer_html as string,
      };
    } else {
      branding = {
        logo_url: null,
        logo_bg_color: "#111111",
        container_bg_color: "#0b0b0d",
        footer_html: "<p style=\"margin:0\">© {current_year} Flashpoint Army</p>",
      };
    }
  }

  await admin
    .from("broadcast_campaigns")
    .update({
      status: "sending",
      recipient_count: recipients.length,
      updated_at: new Date().toISOString(),
    })
    .eq("id", campaign.id);

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const recipient of recipients) {
    const sc = shortcodesForRecipient(recipient);
    const contact =
      campaign.channel === "email" ? recipient.email : recipient.phone;
    if (!contact) {
      skipped += 1;
      continue;
    }

    try {
      if (campaign.channel === "email") {
        const rendered = renderBroadcastEmail(branding!, subject, bodyHtml, sc);
        const plain = renderBroadcastSms(bodyText || rendered.subject, sc);
        await sendBroadcastEmail(campaign.email_provider, {
          to: contact,
          subject: rendered.subject,
          html: rendered.html,
          text: plain,
        });
      } else {
        const smsBody = renderBroadcastSms(bodyText, sc);
        await sendBroadcastSms(contact, smsBody);
      }

      sent += 1;
      await admin.from("broadcast_send_logs").insert({
        campaign_id: campaign.id,
        user_id: recipient.userId,
        channel: campaign.channel,
        contact,
        status: "sent",
      });
    } catch (e) {
      failed += 1;
      const msg = e instanceof Error ? e.message : String(e);
      await admin.from("broadcast_send_logs").insert({
        campaign_id: campaign.id,
        user_id: recipient.userId,
        channel: campaign.channel,
        contact,
        status: "failed",
        error_message: msg,
      });
    }
  }

  const finalStatus = failed > 0 && sent === 0 ? "failed" : "sent";
  await admin
    .from("broadcast_campaigns")
    .update({
      status: finalStatus,
      sent_count: sent,
      failed_count: failed,
      sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", campaign.id);

  return { sent, failed, skipped };
}
