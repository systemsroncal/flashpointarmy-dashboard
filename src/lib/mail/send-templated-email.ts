import { createAdminClient } from "@/utils/supabase/admin";
import { insertEmailSendLog } from "@/lib/mail/email-send-log";
import { getAppBaseUrl } from "@/lib/mail/app-base-url";
import { renderTemplatedEmail, toAbsolutePublicUrl, type EmailShortcodes } from "./render-email";
import { getMailTransportAndFrom } from "@/lib/mail/get-mail-transport";

export type TemplateKey =
  | "verify_email"
  | "password_reset"
  | "local_leader_assigned"
  | "gathering_created"
  | "register_otp";

export type SendTemplatedEmailOptions = {
  triggeredByUserId?: string | null;
};

export async function sendTemplatedEmail(
  templateKey: TemplateKey,
  to: string,
  shortcodes: EmailShortcodes,
  options?: SendTemplatedEmailOptions
) {
  const fromFallback = process.env.SMTP_FROM?.trim() || "";

  const supabase = createAdminClient();
  const [{ data: branding }, { data: template }] = await Promise.all([
    supabase.from("email_branding_settings").select("*").eq("id", true).maybeSingle(),
    supabase
      .from("email_templates")
      .select("subject, body_html")
      .eq("template_key", templateKey)
      .maybeSingle(),
  ]);

  if (!branding || !template) {
    const err = `Missing email branding/template for ${templateKey}`;
    await insertEmailSendLog({
      status: "failed",
      templateKey,
      fromAddress: fromFallback || "",
      toAddress: to,
      subject: "",
      bodyPreview: "",
      errorMessage: err,
      triggeredByUserId: options?.triggeredByUserId ?? null,
    });
    throw new Error(err);
  }

  const siteBase = await getAppBaseUrl(supabase);
  const brandingResolved = {
    ...branding,
    logo_url: toAbsolutePublicUrl(siteBase, branding.logo_url as string | null),
  };
  const rendered = renderTemplatedEmail(brandingResolved, template, shortcodes);
  let transporter: Awaited<ReturnType<typeof getMailTransportAndFrom>>["transporter"];
  let from: string;
  try {
    ({ transporter, from } = await getMailTransportAndFrom());
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await insertEmailSendLog({
      status: "failed",
      templateKey,
      fromAddress: fromFallback || "",
      toAddress: to,
      subject: rendered.subject,
      bodyPreview: rendered.html,
      errorMessage: msg,
      triggeredByUserId: options?.triggeredByUserId ?? null,
    });
    throw e;
  }

  try {
    await transporter.sendMail({
      from,
      to,
      subject: rendered.subject,
      html: rendered.html,
    });
    await insertEmailSendLog({
      status: "sent",
      templateKey,
      fromAddress: from,
      toAddress: to,
      subject: rendered.subject,
      bodyPreview: rendered.html,
      triggeredByUserId: options?.triggeredByUserId ?? null,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await insertEmailSendLog({
      status: "failed",
      templateKey,
      fromAddress: from,
      toAddress: to,
      subject: rendered.subject,
      bodyPreview: rendered.html,
      errorMessage: msg,
      triggeredByUserId: options?.triggeredByUserId ?? null,
    });
    throw e;
  }
}
