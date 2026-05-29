import { getMailTransportAndFrom } from "@/lib/mail/get-mail-transport";
import type { EmailProvider } from "@/lib/broadcast/types";

export type SendEmailPayload = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export async function sendBroadcastEmail(
  provider: EmailProvider,
  payload: SendEmailPayload
): Promise<void> {
  switch (provider) {
    case "dashboard":
      await sendViaDashboard(payload);
      return;
    case "brevo":
      await sendViaBrevo(payload);
      return;
    case "sendgrid":
      await sendViaSendGrid(payload);
      return;
    case "mailchimp":
      await sendViaMailchimpTransactional(payload);
      return;
    default:
      throw new Error(`Unknown email provider: ${provider}`);
  }
}

async function sendViaDashboard(payload: SendEmailPayload): Promise<void> {
  const { transporter, from } = await getMailTransportAndFrom();
  await transporter.sendMail({
    from,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
  });
}

async function sendViaBrevo(payload: SendEmailPayload): Promise<void> {
  const key = process.env.BREVO_API_KEY?.trim();
  if (!key) throw new Error("BREVO_API_KEY is not configured.");
  const fromEmail = process.env.BREVO_FROM_EMAIL?.trim() || process.env.SMTP_FROM?.trim();
  const fromName = process.env.BREVO_FROM_NAME?.trim() || "Flashpoint Dashboard";
  if (!fromEmail) throw new Error("Set BREVO_FROM_EMAIL or SMTP_FROM for the sender address.");

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": key,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: { email: fromEmail, name: fromName },
      to: [{ email: payload.to }],
      subject: payload.subject,
      htmlContent: payload.html,
      textContent: payload.text,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Brevo error (${res.status}): ${body.slice(0, 400)}`);
  }
}

async function sendViaSendGrid(payload: SendEmailPayload): Promise<void> {
  const key = process.env.SENDGRID_API_KEY?.trim();
  if (!key) throw new Error("SENDGRID_API_KEY is not configured.");
  const fromEmail = process.env.SENDGRID_FROM_EMAIL?.trim() || process.env.SMTP_FROM?.trim();
  const fromName = process.env.SENDGRID_FROM_NAME?.trim() || "Flashpoint Dashboard";
  if (!fromEmail) throw new Error("Set SENDGRID_FROM_EMAIL or SMTP_FROM for the sender address.");

  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: payload.to }] }],
      from: { email: fromEmail, name: fromName },
      subject: payload.subject,
      content: [
        ...(payload.text ? [{ type: "text/plain", value: payload.text }] : []),
        { type: "text/html", value: payload.html },
      ],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`SendGrid error (${res.status}): ${body.slice(0, 400)}`);
  }
}

async function sendViaMailchimpTransactional(payload: SendEmailPayload): Promise<void> {
  const key = process.env.MAILCHIMP_TRANSACTIONAL_API_KEY?.trim();
  if (!key) throw new Error("MAILCHIMP_TRANSACTIONAL_API_KEY is not configured.");
  const fromEmail =
    process.env.MAILCHIMP_FROM_EMAIL?.trim() || process.env.SMTP_FROM?.trim();
  const fromName = process.env.MAILCHIMP_FROM_NAME?.trim() || "Flashpoint Dashboard";
  if (!fromEmail) throw new Error("Set MAILCHIMP_FROM_EMAIL or SMTP_FROM for the sender address.");

  const res = await fetch("https://mandrillapp.com/api/1.0/messages/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      key,
      message: {
        from_email: fromEmail,
        from_name: fromName,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
        to: [{ email: payload.to, type: "to" }],
      },
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Mailchimp Transactional error (${res.status}): ${body.slice(0, 400)}`);
  }
  const data = (await res.json()) as { status?: string; reject_reason?: string }[];
  const first = data?.[0];
  if (first?.status === "rejected" || first?.status === "invalid") {
    throw new Error(first.reject_reason || `Mailchimp rejected message (${first.status})`);
  }
}

export async function sendBroadcastSms(to: string, body: string): Promise<void> {
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_SMS_FROM?.trim();
  if (!sid || !token || !from) {
    throw new Error("TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_SMS_FROM must be configured.");
  }

  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const params = new URLSearchParams({ To: to, From: from, Body: body });
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });
  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Twilio SMS error (${res.status}): ${errBody.slice(0, 400)}`);
  }
}
