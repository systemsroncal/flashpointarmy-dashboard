export type LinkPreviewMeta = {
  url: string;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  siteName: string | null;
};

function decodeBasicEntities(value: string): string {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'");
}

function readMetaContent(html: string, key: string, by: "property" | "name"): string | null {
  const attr = by === "property" ? "property" : "name";
  const patterns = [
    new RegExp(
      `<meta[^>]+${attr}=["']${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'][^>]+content=["']([^"']+)["']`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+${attr}=["']${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`,
      "i"
    ),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]?.trim()) return decodeBasicEntities(m[1].trim());
  }
  return null;
}

function readTitleTag(html: string): string | null {
  const m = html.match(/<title[^>]*>([^<]{1,500})<\/title>/i);
  return m?.[1]?.trim() ? decodeBasicEntities(m[1].trim()) : null;
}

function resolveMaybeRelativeUrl(base: URL, href: string): string | null {
  const raw = href.trim();
  if (!raw) return null;
  try {
    return new URL(raw, base).toString();
  } catch {
    return null;
  }
}

export function parseLinkPreviewFromHtml(pageUrl: string, html: string): LinkPreviewMeta {
  const base = new URL(pageUrl);
  const title =
    readMetaContent(html, "og:title", "property") ??
    readMetaContent(html, "twitter:title", "name") ??
    readTitleTag(html);
  const description =
    readMetaContent(html, "og:description", "property") ??
    readMetaContent(html, "twitter:description", "name") ??
    readMetaContent(html, "description", "name");
  const imageRaw =
    readMetaContent(html, "og:image", "property") ??
    readMetaContent(html, "twitter:image", "name") ??
    readMetaContent(html, "twitter:image:src", "name");
  const imageUrl = imageRaw ? resolveMaybeRelativeUrl(base, imageRaw) : null;
  const siteName =
    readMetaContent(html, "og:site_name", "property") ?? base.hostname.replace(/^www\./i, "");

  return {
    url: base.toString(),
    title: title ?? null,
    description: description ?? null,
    imageUrl,
    siteName,
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/'/g, "&#39;");
}

const LINK_PREVIEW_MARKER = 'class="mobilize-link-preview"';

export function contentHasLinkPreview(html: string): boolean {
  return html.includes(LINK_PREVIEW_MARKER);
}

export function appendLinkPreviewHtml(html: string, meta: LinkPreviewMeta): string {
  if (contentHasLinkPreview(html)) return html;
  const title = escapeHtml(meta.title?.trim() || meta.siteName || meta.url);
  const desc = meta.description?.trim() ? escapeHtml(meta.description.trim()) : "";
  const host = escapeHtml(meta.siteName?.trim() || new URL(meta.url).hostname.replace(/^www\./i, ""));
  const img = meta.imageUrl
    ? `<img class="mobilize-link-preview__image" src="${escapeAttr(meta.imageUrl)}" alt="" loading="lazy" />`
    : "";
  const block = `<aside class="mobilize-link-preview" contenteditable="false" data-mce-block="1" data-link-url="${escapeAttr(meta.url)}"><a href="${escapeAttr(meta.url)}" target="_blank" rel="noopener noreferrer" class="mobilize-link-preview__card">${img}<span class="mobilize-link-preview__body"><strong class="mobilize-link-preview__title">${title}</strong>${desc ? `<span class="mobilize-link-preview__desc">${desc}</span>` : ""}<span class="mobilize-link-preview__host">${host}</span></span></a></aside>`;
  const trimmed = html.trim();
  return trimmed ? `${trimmed}${block}` : block;
}

export function extractPastedUrl(pasteHtml: string): string | null {
  const raw = pasteHtml.trim();
  if (!raw) return null;
  const plain = raw.replace(/<[^>]+>/g, "").trim();
  if (/^https?:\/\/\S+$/i.test(plain)) return plain.replace(/[.,;:!?)]+$/, "");
  const hrefMatch = raw.match(/\bhref=["'](https?:\/\/[^"']+)["']/i);
  if (hrefMatch?.[1]) return hrefMatch[1];
  return null;
}