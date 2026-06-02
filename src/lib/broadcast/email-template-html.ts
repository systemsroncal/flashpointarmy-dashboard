/** Default starter markup for the visual email builder (newsletter blocks). */
export const DEFAULT_EMAIL_TEMPLATE_HTML = `<table class="main" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;">
  <tr>
    <td style="padding:24px;">
      <h1 style="margin:0 0 16px;font-size:24px;color:#111;">Hello {user_first_name}</h1>
      <p style="margin:0 0 12px;font-size:16px;line-height:1.5;color:#333;">Hello {user_fullname},</p>
      <p style="margin:0;font-size:16px;line-height:1.5;color:#333;">Your message here.</p>
    </td>
  </tr>
</table>`;

/** Serialize GrapesJS canvas to stored template HTML (inline styles when available). */
export function exportGrapesEmailHtml(editor: {
  getHtml: () => string;
  getCss: () => string;
  runCommand: (cmd: string, opts?: object) => unknown;
}): string {
  try {
    const result = editor.runCommand("gjs-get-inlined-html");
    if (typeof result === "string" && result.trim()) return result;
  } catch {
    /* preset command optional */
  }
  const html = editor.getHtml();
  const css = editor.getCss();
  if (css?.trim()) {
    return `<style>${css}</style>\n${html}`;
  }
  return html;
}
