import type { EmailProvider } from "@/lib/broadcast/types";

export type AvailableProviders = {
  email: { id: EmailProvider; label: string; configured: boolean }[];
  sms: { id: "twilio"; label: string; configured: boolean }[];
};

function envSet(key: string): boolean {
  return Boolean(process.env[key]?.trim());
}

export function listAvailableProviders(): AvailableProviders {
  const dashboardConfigured =
    envSet("SMTP_HOST") && envSet("SMTP_USER") && envSet("SMTP_PASS") && envSet("SMTP_FROM");

  return {
    email: [
      {
        id: "dashboard",
        label: "Dashboard SMTP / Gmail",
        configured: dashboardConfigured || true,
      },
      { id: "brevo", label: "Brevo API", configured: envSet("BREVO_API_KEY") },
      {
        id: "sendgrid",
        label: "SendGrid (Twilio Email)",
        configured: envSet("SENDGRID_API_KEY"),
      },
      {
        id: "mailchimp",
        label: "Mailchimp Transactional",
        configured: envSet("MAILCHIMP_TRANSACTIONAL_API_KEY"),
      },
    ],
    sms: [
      {
        id: "twilio",
        label: "Twilio SMS",
        configured:
          envSet("TWILIO_ACCOUNT_SID") &&
          envSet("TWILIO_AUTH_TOKEN") &&
          envSet("TWILIO_SMS_FROM"),
      },
    ],
  };
}

export function isEmailProviderConfigured(provider: EmailProvider): boolean {
  const found = listAvailableProviders().email.find((p) => p.id === provider);
  if (provider === "dashboard") return true;
  return Boolean(found?.configured);
}

export function isTwilioSmsConfigured(): boolean {
  return listAvailableProviders().sms[0]?.configured ?? false;
}
