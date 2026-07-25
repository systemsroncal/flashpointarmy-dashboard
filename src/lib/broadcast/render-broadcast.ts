import {
  renderTemplatedEmail,
  toAbsolutePublicUrl,
  type EmailBranding,
  type EmailShortcodes,
} from "@/lib/mail/render-email";

export type BroadcastShortcodes = EmailShortcodes;

export function replaceShortcodes(input: string, shortcodes: BroadcastShortcodes): string {
  const all: BroadcastShortcodes = {
    current_year: String(new Date().getFullYear()),
    app_name: "Flashpoint Dashboard",
    ...shortcodes,
  };
  return input.replace(/\{([a-zA-Z0-9_]+)\}/g, (_m, key: string) => {
    const val = all[key];
    return val == null ? "" : String(val);
  });
}

export function renderBroadcastSms(bodyText: string, shortcodes: BroadcastShortcodes): string {
  return replaceShortcodes(bodyText, shortcodes);
}

type Branding = EmailBranding;

export function renderBroadcastEmail(
  branding: Branding,
  subject: string,
  bodyHtml: string,
  shortcodes: BroadcastShortcodes
) {
  return renderTemplatedEmail(branding, { subject, body_html: bodyHtml }, shortcodes);
}

export { toAbsolutePublicUrl };
