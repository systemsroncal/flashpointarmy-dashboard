import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

const UPLOADS_ROOT = path.join(process.cwd(), "public", "uploads");

function contentType(filePath: string): string {
  switch (path.extname(filePath).toLowerCase()) {
    case ".webp":
      return "image/webp";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".gif":
      return "image/gif";
    case ".svg":
      return "image/svg+xml";
    default:
      return "application/octet-stream";
  }
}

/**
 * Serves files from `public/uploads` (gatherings, avatars, etc.).
 * Used via rewrite from `/uploads/*` so dev (Turbopack) and prod behave consistently.
 */
export async function GET(
  _req: Request,
  context: { params: Promise<{ path: string | string[] }> }
) {
  const { path: raw } = await context.params;
  const segments = (Array.isArray(raw) ? raw : [raw]).filter(Boolean);
  if (!segments.length) {
    return new NextResponse(null, { status: 404 });
  }

  for (const seg of segments) {
    if (seg === "." || seg === ".." || seg.includes("/") || seg.includes("\\")) {
      return new NextResponse(null, { status: 400 });
    }
  }

  const root = path.resolve(UPLOADS_ROOT);
  const abs = path.resolve(path.join(root, ...segments));
  const rel = path.relative(root, abs);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    return new NextResponse(null, { status: 400 });
  }

  try {
    const buf = await readFile(abs);
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": contentType(abs),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
