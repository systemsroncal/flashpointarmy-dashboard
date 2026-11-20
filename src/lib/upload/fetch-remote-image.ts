import { assertPublicDns, assertSafeHttpUrl } from "@/lib/http/ssrf-safe-url";
import {
  detectImageKindFromBuffer,
  MAX_AVATAR_BYTES,
  type ValidatedImageKind,
} from "@/lib/upload/validate-image";

const MAX_REDIRECTS = 3;
const FETCH_TIMEOUT_MS = 12_000;

/**
 * Download a remote image for re-hosting. Blocks private/link-local hosts (SSRF).
 * Validates magic bytes; max size defaults to avatar cap (1 MB).
 */
export async function fetchRemoteImageForUpload(
  urlString: string,
  maxBytes: number = MAX_AVATAR_BYTES
): Promise<{ buffer: Buffer; kind: ValidatedImageKind }> {
  let current = urlString.trim();
  if (!current) throw new Error("Missing image URL.");

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
          Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
          "User-Agent": "FlashPointArmy-Dashboard/1.0 (+image-import)",
        },
      });

      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get("location");
        if (!loc) throw new Error("Redirect without a location.");
        current = new URL(loc, parsed).toString();
        continue;
      }

      if (!res.ok) {
        throw new Error(`Could not download image (${res.status}).`);
      }

      const declaredLen = res.headers.get("content-length");
      if (declaredLen && Number(declaredLen) > maxBytes) {
        throw new Error(`Image must be ${Math.round(maxBytes / (1024 * 1024))} MB or smaller.`);
      }

      const ab = await res.arrayBuffer();
      if (ab.byteLength > maxBytes) {
        throw new Error(`Image must be ${Math.round(maxBytes / (1024 * 1024))} MB or smaller.`);
      }
      if (ab.byteLength < 16) {
        throw new Error("File is too small to be a valid image.");
      }

      const kind = detectImageKindFromBuffer(ab);
      if (!kind) {
        throw new Error("URL did not return a valid JPEG, PNG, GIF, or WebP image.");
      }

      return { buffer: Buffer.from(ab), kind };
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") {
        throw new Error("Image download timed out.");
      }
      throw e;
    } finally {
      clearTimeout(timer);
    }
  }

  throw new Error("Too many redirects.");
}
