import dns from "node:dns/promises";
import net from "node:net";
import {
  detectImageKindFromBuffer,
  MAX_AVATAR_BYTES,
  type ValidatedImageKind,
} from "@/lib/upload/validate-image";

const MAX_REDIRECTS = 3;
const FETCH_TIMEOUT_MS = 12_000;

function isBlockedIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const p = ip.split(".").map(Number);
    if (p[0] === 0 || p[0] === 10 || p[0] === 127) return true;
    if (p[0] === 169 && p[1] === 254) return true;
    if (p[0] === 172 && p[1] >= 16 && p[1] <= 31) return true;
    if (p[0] === 192 && p[1] === 168) return true;
    if (p[0] === 100 && p[1] >= 64 && p[1] <= 127) return true;
    if (p[0] === 198 && (p[1] === 18 || p[1] === 19)) return true;
    return false;
  }
  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    if (lower === "::1" || lower === "::") return true;
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true;
    if (lower.startsWith("fe80")) return true;
    if (lower.startsWith("::ffff:")) {
      return isBlockedIp(lower.slice("::ffff:".length));
    }
    return false;
  }
  return true;
}

function assertSafeHttpUrl(raw: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(raw.trim());
  } catch {
    throw new Error("Invalid image URL.");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only HTTP(S) image URLs are allowed.");
  }
  if (parsed.username || parsed.password) {
    throw new Error("URL credentials are not allowed.");
  }
  const host = parsed.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host === "metadata.google.internal"
  ) {
    throw new Error("That host is not allowed.");
  }
  if (net.isIP(host) && isBlockedIp(host)) {
    throw new Error("That host is not allowed.");
  }
  return parsed;
}

async function assertPublicDns(hostname: string): Promise<void> {
  if (net.isIP(hostname)) {
    if (isBlockedIp(hostname)) throw new Error("That host is not allowed.");
    return;
  }
  const addrs = await dns.lookup(hostname, { all: true, verbatim: true });
  if (!addrs.length) throw new Error("Could not resolve image host.");
  if (addrs.some((a) => isBlockedIp(a.address))) {
    throw new Error("That host is not allowed.");
  }
}

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
