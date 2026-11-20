import { consumeRateLimit } from "@/lib/http/in-memory-rate-limit";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";
import { fetchLinkMetadata } from "@/lib/mobilize/social/fetch-link-metadata";
import { assertSafeHttpUrl } from "@/lib/http/ssrf-safe-url";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;

  const rate = consumeRateLimit(`mobilize-link-preview:${auth.userId}`, 40, 60_000);
  if (!rate.ok) {
    return NextResponse.json(
      { error: "Too many previews. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSec) } }
    );
  }

  try {
    const body = (await req.json().catch(() => null)) as { url?: string } | null;
    const url = typeof body?.url === "string" ? body.url.trim() : "";
    if (!url) {
      return NextResponse.json({ error: "Missing url." }, { status: 400 });
    }
    assertSafeHttpUrl(url);
    const preview = await fetchLinkMetadata(url);
    const hasAny =
      Boolean(preview.title) || Boolean(preview.description) || Boolean(preview.imageUrl);
    if (!hasAny) {
      return NextResponse.json({ error: "No preview metadata found for this URL." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, preview });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Preview failed." },
      { status: 400 }
    );
  }
}