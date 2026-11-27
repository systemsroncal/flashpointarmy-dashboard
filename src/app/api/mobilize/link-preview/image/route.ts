import { consumeRateLimit } from "@/lib/http/in-memory-rate-limit";
import { assertPublicDns, assertSafeHttpUrl } from "@/lib/http/ssrf-safe-url";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";
import { isBrowserBlockedPreviewImage } from "@/lib/mobilize/social/link-preview";
import { detectImageKindFromBuffer, type ValidatedImageKind } from "@/lib/upload/validate-image";
import { NextResponse } from "next/server";

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_REDIRECTS = 3;
const FETCH_TIMEOUT_MS = 12_000;
const CRAWLER_UA = "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)";

const MIME: Record<ValidatedImageKind, string> = {
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
};

function isAllowedImageHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return (
    host === "lookaside.fbsbx.com" ||
    host === "lookaside.facebook.com" ||
    host === "fbcdn.net" ||
    host.endsWith(".fbcdn.net") ||
    host.endsWith(".fbsbx.com")
  );
}

async function fetchPreviewImage(urlString: string): Promise<{ buffer: Buffer; kind: ValidatedImageKind }> {
  let current = urlString.trim();
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const parsed = assertSafeHttpUrl(current);
    if (!isAllowedImageHost(parsed.hostname)) {
      throw new Error("That image host is not allowed.");
    }
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
          "User-Agent": CRAWLER_UA,
        },
      });
      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get("location");
        if (!loc) throw new Error("Redirect without a location.");
        current = new URL(loc, parsed).toString();
        continue;
      }
      if (!res.ok) throw new Error(`Could not download image (${res.status}).`);
      const ab = await res.arrayBuffer();
      if (ab.byteLength > MAX_BYTES || ab.byteLength < 16) {
        throw new Error("Image is not a usable preview.");
      }
      const kind = detectImageKindFromBuffer(ab);
      if (!kind) throw new Error("URL did not return an image.");
      return { buffer: Buffer.from(ab), kind };
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error("Too many redirects.");
}

export async function GET(req: Request) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;

  const rate = consumeRateLimit(`mobilize-link-preview-image:${auth.userId}`, 60, 60_000);
  if (!rate.ok) {
    return NextResponse.json(
      { error: "Too many images. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSec) } }
    );
  }

  const url = new URL(req.url).searchParams.get("url")?.trim() ?? "";
  if (!url || !isBrowserBlockedPreviewImage(url)) {
    return NextResponse.json({ error: "That image URL is not allowed." }, { status: 400 });
  }

  try {
    const { buffer, kind } = await fetchPreviewImage(url);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": MIME[kind],
        "Cache-Control": "private, max-age=86400",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Image failed." },
      { status: 400 }
    );
  }
}
