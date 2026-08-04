import {
  ANNOUNCEMENT_PDF_UPLOAD_PREFIX,
  isPdfMagic,
  normalizeAnnouncementPdfUrl,
} from "@/lib/dashboard/announcement-pdf";
import { requireApiAuth } from "@/lib/auth/server-session";
import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

/**
 * Streams a PDF for in-app preview (same-origin for pdf.js).
 * Local uploads are read from disk; remote https URLs are fetched server-side.
 */
export async function GET(req: Request) {
  const authResult = await requireApiAuth();
  if ("response" in authResult) return authResult.response;

  const urlParam = new URL(req.url).searchParams.get("url")?.trim() ?? "";
  const normalized = normalizeAnnouncementPdfUrl(urlParam);
  if (!normalized) {
    return NextResponse.json({ error: "Invalid PDF URL." }, { status: 400 });
  }

  try {
    let bytes: Buffer;
    let localPath: string | null = null;

    if (normalized.startsWith(ANNOUNCEMENT_PDF_UPLOAD_PREFIX)) {
      localPath = normalized;
    } else {
      try {
        const u = new URL(normalized);
        if (u.pathname.startsWith(ANNOUNCEMENT_PDF_UPLOAD_PREFIX)) {
          localPath = u.pathname;
        }
      } catch {
        /* remote */
      }
    }

    if (localPath) {
      const rel = localPath.replace(/^\//, "");
      const abs = path.join(process.cwd(), "public", rel);
      const uploadsRoot = path.join(process.cwd(), "public", "uploads", "announcement-pdfs");
      const resolved = path.resolve(abs);
      if (!resolved.startsWith(path.resolve(uploadsRoot))) {
        return NextResponse.json({ error: "Invalid path." }, { status: 400 });
      }
      bytes = await readFile(resolved);
    } else {
      const upstream = await fetch(normalized, {
        redirect: "follow",
        headers: { Accept: "application/pdf,*/*" },
        signal: AbortSignal.timeout(25_000),
      });
      if (!upstream.ok) {
        return NextResponse.json({ error: "Could not fetch PDF." }, { status: 502 });
      }
      const ab = await upstream.arrayBuffer();
      bytes = Buffer.from(ab);
    }

    if (bytes.byteLength > 7 * 1024 * 1024) {
      return NextResponse.json({ error: "PDF exceeds 7 MB." }, { status: 400 });
    }
    if (!isPdfMagic(bytes)) {
      return NextResponse.json({ error: "Remote file is not a PDF." }, { status: 400 });
    }

    return new NextResponse(new Uint8Array(bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(bytes.byteLength),
        "Cache-Control": "private, max-age=300",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "PDF proxy failed." },
      { status: 500 }
    );
  }
}
