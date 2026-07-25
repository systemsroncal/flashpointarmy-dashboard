/** Turn stored paths like `/logos/x.svg` into absolute URLs so email clients (Gmail) can load images. */
export function toAbsolutePublicUrl(siteBase: string, href: string | null | undefined): string | null {
  if (href == null) return null;
  const t = String(href).trim();
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) return t;
  const b = siteBase.replace(/\/+$/, "");
  if (t.startsWith("//")) return `https:${t}`;
  if (t.startsWith("/")) return `${b}${t}`;
  return `${b}/${t}`;
}

export type EmailBranding = {
  logo_url: string | null;
  logo_bg_color: string;
  container_bg_color: string;
  body_bg_color?: string | null;
  body_text_color?: string | null;
  body_link_color?: string | null;
  footer_text_color?: string | null;
  footer_html: string;
};

type Template = {
  subject: string;
  body_html: string;
};

export type EmailShortcodes = Record<string, string | null | undefined>;

function replaceShortcodes(input: string, shortcodes: EmailShortcodes) {
  return input.replace(/\{([a-zA-Z0-9_]+)\}/g, (_m, key: string) => {
    const val = shortcodes[key];
    return val == null ? "" : String(val);
  });
}

const DEFAULT_BODY_BG = "#101215";
const DEFAULT_BODY_TEXT = "#e5e7eb";
const DEFAULT_BODY_LINK = "#c9a227";
const DEFAULT_FOOTER_TEXT = "#a1a1aa";

function normalizeHexColor(value: string | null | undefined, fallback: string): string {
  const t = (value ?? "").trim();
  return t || fallback;
}

function isLightHexColor(hex: string): boolean {
  const h = hex.replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return false;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.62;
}

/** Applies branding colors to template HTML (text + links) for email clients. */
function styleEmailBodyHtml(html: string, bodyText: string, linkColor: string): string {
  const withLinkColors = html.replace(/<a\b([^>]*)>/gi, (_match, attrs: string) => {
    const styleMatch = attrs.match(/\sstyle\s*=\s*(["'])([\s\S]*?)\1/i);
    if (styleMatch) {
      const quote = styleMatch[1];
      let style = styleMatch[2];
      if (!/color\s*:/i.test(style)) {
        style = `${style};color:${linkColor}`;
      }
      const nextAttrs = attrs.replace(styleMatch[0], ` style=${quote}${style}${quote}`);
      return `<a${nextAttrs}>`;
    }
    return `<a${attrs} style="color:${linkColor};text-decoration:underline">`;
  });

  return `<style type="text/css">
.fp-email-body, .fp-email-body p, .fp-email-body li, .fp-email-body span, .fp-email-body td, .fp-email-body div { color: ${bodyText} !important; }
.fp-email-body a, .fp-email-body a:visited { color: ${linkColor} !important; text-decoration: underline !important; }
</style>
<div class="fp-email-body" style="color:${bodyText}">${withLinkColors}</div>`;
}

export function renderTemplatedEmail(
  branding: EmailBranding,
  template: Template,
  shortcodes: EmailShortcodes
) {
  const allShortcodes: EmailShortcodes = {
    current_year: String(new Date().getFullYear()),
    ...shortcodes,
  };

  const bodyBg = normalizeHexColor(branding.body_bg_color, DEFAULT_BODY_BG);
  const bodyText = normalizeHexColor(branding.body_text_color, DEFAULT_BODY_TEXT);
  const bodyLink = normalizeHexColor(branding.body_link_color, DEFAULT_BODY_LINK);
  const footerText = normalizeHexColor(branding.footer_text_color, DEFAULT_FOOTER_TEXT);
  const cardBorder = isLightHexColor(bodyBg) ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.1)";
  const footerBorder = isLightHexColor(bodyBg) ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)";

  const subject = replaceShortcodes(template.subject, allShortcodes);
  const bodyRaw = replaceShortcodes(template.body_html, allShortcodes);
  const body = styleEmailBodyHtml(bodyRaw, bodyText, bodyLink);
  const footer = replaceShortcodes(branding.footer_html, allShortcodes);
  const logoBlock = branding.logo_url
    ? `<img src="${branding.logo_url}" alt="logo" style="max-height:72px;max-width:260px;display:block;margin:0 auto" />`
    : `<div style="font-size:20px;font-weight:700;text-align:center;color:${bodyText}">Flashpoint Army</div>`;

  const html = `
  <div style="background:${branding.container_bg_color};padding:24px;font-family:Arial,sans-serif;color:${bodyText}">
    <div style="max-width:640px;margin:0 auto;border:1px solid ${cardBorder};border-radius:10px;overflow:hidden;background:${bodyBg};color:${bodyText}">
      <div style="padding:18px;background:${branding.logo_bg_color}">
        ${logoBlock}
      </div>
      <div style="padding:22px;background:${bodyBg};color:${bodyText}">
        ${body}
      </div>
      <div style="padding:14px 22px;border-top:1px solid ${footerBorder};font-size:12px;color:${footerText}">
        ${footer}
      </div>
    </div>
  </div>`;

  return { subject, html };
}
