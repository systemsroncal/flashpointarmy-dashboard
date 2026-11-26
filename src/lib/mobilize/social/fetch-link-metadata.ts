import { assertPublicDns, assertSafeHttpUrl } from "@/lib/http/ssrf-safe-url";
import {
  fallbackLinkPreviewMeta,
  parseLinkPreviewFromHtml,
  type LinkPreviewMeta,
} from "@/lib/mobilize/social/link-preview";

const MAX_REDIRECTS = 3;
const FETCH_TIMEOUT_MS = 12_000;
/** Only the document head (and early body) is needed for Open Graph tags. */
const MAX_HTML_BYTES = 512_000;
const EARLY_EXIT_CHECK_BYTES = 48_000;

const LINK_PREVIEW_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

function htmlChunkHasOgSignals(html: string): boolean {
  const slice = html.slice(0, EARLY_EXIT_CHECK_BYTES);
  return (
    /property=["']og:title["']/i.test(slice) ||
    /property=["']og:image["']/i.test(slice) ||
    /name=["']twitter:title["']/i.test(slice) ||
    /<title[^>]*>/i.test(slice)
  );
}

function previewIsRich(meta: LinkPreviewMeta): boolean {
  return Boolean(meta.title?.trim() || meta.imageUrl || meta.description?.trim());
}

function mergePreviews(primary: LinkPreviewMeta, secondary: LinkPreviewMeta | null): LinkPreviewMeta {
  if (!secondary) return primary;
  return {
    url: primary.url,
    title: primary.title?.trim() ? primary.title : secondary.title,
    description: primary.description?.trim() ? primary.description : secondary.description,
    imageUrl: primary.imageUrl ?? secondary.imageUrl,
    siteName: primary.siteName?.trim() ? primary.siteName : secondary.siteName,
  };
}

async function readLimitedHtml(res: Response, maxBytes: number): Promise<string> {
  const body = res.body;
  if (!body) {
    const ab = await res.arrayBuffer();
    const len = Math.min(ab.byteLength, maxBytes);
    return Buffer.from(ab.slice(0, len)).toString("utf8");
  }

  const reader = body.getReader();
  const parts: Uint8Array[] = [];
  let total = 0;

  try {
    while (total < maxBytes) {
      const { done, value } = await reader.read();
      if (done || !value?.byteLength) break;
      const take = Math.min(value.byteLength, maxBytes - total);
      parts.push(take === value.byteLength ? value : value.slice(0, take));
      total += take;

      if (total >= EARLY_EXIT_CHECK_BYTES) {
        const probe = Buffer.concat(parts).toString("utf8");
        if (htmlChunkHasOgSignals(probe) && /property=["']og:image["']/i.test(probe)) {
          break;
        }
        if (total >= 120_000 && htmlChunkHasOgSignals(probe)) {
          break;
        }
      }
    }
  } finally {
    try {
      await reader.cancel();
    } catch {
      /* ignore */
    }
  }

  return Buffer.concat(parts).toString("utf8");
}

function enrichPreview(pageUrl: string, html: string): LinkPreviewMeta {
  const meta = parseLinkPreviewFromHtml(pageUrl, html);
  if (meta.title || meta.description || meta.imageUrl) return meta;
  const fb = fallbackLinkPreviewMeta(pageUrl);
  return {
    ...meta,
    title: meta.title ?? fb.title,
    siteName: meta.siteName ?? fb.siteName,
  };
}

async function fetchHtmlPreview(urlString: string): Promise<LinkPreviewMeta> {
  let current = urlString.trim();
  if (!current) throw new Error("Missing URL.");

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const parsed = assertSafeHttpUrl(current);
    await assertPublicDns(parsed.hostname);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(parsed.toString(), {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: {
          Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "User-Agent": LINK_PREVIEW_USER_AGENT,
        },
      });

      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get("location");
        if (!loc) throw new Error("Redirect without a location.");
        current = new URL(loc, parsed).toString();
        continue;
      }

      if (!res.ok) {
        throw new Error(`Could not load page (${res.status}).`);
      }

      const ctype = (res.headers.get("content-type") || "").toLowerCase();
      if (ctype && !ctype.includes("text/html") && !ctype.includes("application/xhtml")) {
        throw new Error("URL is not an HTML page.");
      }

      const html = await readLimitedHtml(res, MAX_HTML_BYTES);
      if (!html.trim()) {
        throw new Error("No preview metadata found for this URL.");
      }

      return enrichPreview(parsed.toString(), html);
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") {
        throw new Error("Page load timed out.");
      }
      throw e;
    } finally {
      clearTimeout(timer);
    }
  }

  throw new Error("Too many redirects.");
}

async function fetchNoembedPreview(pageUrl: string): Promise<LinkPreviewMeta | null> {
  const parsed = assertSafeHttpUrl(pageUrl);
  const endpoint = new URL("https://noembed.com/embed");
  endpoint.searchParams.set("url", parsed.toString());
  endpoint.searchParams.set("maxwidth", "1200");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(endpoint.toString(), {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    const json = (await res.json()) as {
      error?: string;
      title?: string;
      author_name?: string;
      thumbnail_url?: string;
      provider_name?: string;
      url?: string;
    };
    if (json.error || !res.ok) return null;
    const title = json.title?.trim() || null;
    const imageUrl = json.thumbnail_url?.trim() || null;
    if (!title && !imageUrl) return null;
    return {
      url: parsed.toString(),
      title,
      description: json.author_name?.trim() || null,
      imageUrl,
      siteName: json.provider_name?.trim() || parsed.hostname.replace(/^www\./i, ""),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchLinkMetadata(urlString: string): Promise<LinkPreviewMeta> {
  const trimmed = urlString.trim();
  if (!trimmed) throw new Error("Missing URL.");

  try {
    const htmlMeta = await fetchHtmlPreview(trimmed);
    if (previewIsRich(htmlMeta) && htmlMeta.imageUrl) return htmlMeta;
    const embed = await fetchNoembedPreview(htmlMeta.url);
    const merged = mergePreviews(htmlMeta, embed);
    if (previewIsRich(merged)) return merged;
    return htmlMeta;
  } catch {
    const embed = await fetchNoembedPreview(trimmed);
    if (embed && previewIsRich(embed)) return embed;
    throw new Error("Could not load link preview for this URL.");
  }
}