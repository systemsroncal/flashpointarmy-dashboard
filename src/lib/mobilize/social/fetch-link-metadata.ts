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

export async function fetchLinkMetadata(urlString: string): Promise<LinkPreviewMeta> {
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