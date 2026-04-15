type Branding = {
  logo_url: string | null;
  logo_bg_color: string;
  container_bg_color: string;
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

export function renderTemplatedEmail(
  branding: Branding,
  template: Template,
  shortcodes: EmailShortcodes
) {
  const allShortcodes: EmailShortcodes = {
    current_year: String(new Date().getFullYear()),
    ...shortcodes,
  };

  const subject = replaceShortcodes(template.subject, allShortcodes);
  const body = replaceShortcodes(template.body_html, allShortcodes);
  const footer = replaceShortcodes(branding.footer_html, allShortcodes);
  const logoBlock = branding.logo_url
    ? `<img src="${branding.logo_url}" alt="logo" style="max-height:72px;max-width:260px;display:block;margin:0 auto" />`
    : `<div style="font-size:20px;font-weight:700;text-align:center">Flashpoint Army</div>`;

  const html = `
  <div style="background:${branding.container_bg_color};padding:24px;font-family:Arial,sans-serif;color:#e5e7eb">
    <div style="max-width:640px;margin:0 auto;border:1px solid rgba(255,255,255,0.1);border-radius:10px;overflow:hidden;background:#101215">
      <div style="padding:18px;background:${branding.logo_bg_color}">
        ${logoBlock}
      </div>
      <div style="padding:22px">
        ${body}
      </div>
      <div style="padding:14px 22px;border-top:1px solid rgba(255,255,255,0.08);font-size:12px;color:#a1a1aa">
        ${footer}
      </div>
    </div>
  </div>`;

  return { subject, html };
}
