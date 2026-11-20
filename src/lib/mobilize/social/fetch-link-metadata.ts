import { assertPublicDns, assertSafeHttpUrl } from "@/lib/http/ssrf-safe-url";
import { parseLinkPreviewFromHtml, type LinkPreviewMeta } from "@/lib/mobilize/social/link-preview";

const MAX_REDIRECTS = 3;
const FETCH_TIMEOUT_MS = 12_000;
const MAX_HTML_BYTES = 750_000;

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
          "User-Agent": "FlashPointArmy-Dashboard/1.0 (+link-preview)",
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

      const declaredLen = res.headers.get("content-length");
      if (declaredLen && Number(declaredLen) > MAX_HTML_BYTES) {
        throw new Error("Page is too large to preview.");
      }

      const ab = await res.arrayBuffer();
      if (ab.byteLength > MAX_HTML_BYTES) {
        throw new Error("Page is too large to preview.");
      }

      const html = Buffer.from(ab).toString("utf8");
      return parseLinkPreviewFromHtml(parsed.toString(), html);
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