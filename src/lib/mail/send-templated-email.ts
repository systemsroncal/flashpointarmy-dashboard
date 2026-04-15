import { createAdminClient } from "@/utils/supabase/admin";
import { insertEmailSendLog } from "@/lib/mail/email-send-log";
import { renderTemplatedEmail, type EmailShortcodes } from "./render-email";
import nodemailer from "nodemailer";

export type TemplateKey =
  | "verify_email"
  | "password_reset"
  | "local_leader_assigned"
  | "gathering_created"
  | "register_otp";

export type SendTemplatedEmailOptions = {
  triggeredByUserId?: string | null;
};

function getTransport() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) throw new Error("SMTP config missing.");
  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
  });
}

export async function sendTemplatedEmail(
  templateKey: TemplateKey,
  to: string,
  shortcodes: EmailShortcodes,
  options?: SendTemplatedEmailOptions
) {
  const from = process.env.SMTP_FROM;
  if (!from) throw new Error("Missing SMTP_FROM");

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
      fromAddress: from,
      toAddress: to,
      subject: "",
      bodyPreview: "",
      errorMessage: err,
      triggeredByUserId: options?.triggeredByUserId ?? null,
    });
    throw new Error(err);
  }

  const rendered = renderTemplatedEmail(branding, template, shortcodes);
  const transporter = getTransport();

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
