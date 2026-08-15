import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { isPdfMagic } from "@/lib/dashboard/announcement-pdf";
import {
  MOBILIZE_RESOURCE_PDF_MAX_BYTES,
  isMobilizePdfUrl,
  normalizeMobilizeDocumentUrl,
} from "@/lib/mobilize/default-group-resources";
import { isMobilizeSuperAdmin } from "@/lib/mobilize/mobilize-content-access";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";

type Ctx = { params: Promise<{ id: string }> };

/** Blocks loopback/link-local/private hosts so the proxy cannot reach internal services. */
function isBlockedHost(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".internal")) return true;
  if (h === "::1" || h.startsWith("fc") || h.startsWith("fd") || h.startsWith("fe80:")) return true;
  const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(h);
  if (!ipv4) return false;
  const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

/**
 * Streams a group resource PDF same-origin so the bundled pdf.js viewer can render it,
 * mirroring the Mission Updates preview.
 */
export async function GET(req: Request, ctx: Ctx) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;
  const { id: groupId } = await ctx.params;

  if (!isMobilizeSuperAdmin(auth.roleNames)) {
    const { data } = await auth.admin
      .from("mobilize_group_members")
      .select("membership_status")
      .eq("group_id", groupId)
      .eq("user_id", auth.userId)
      .maybeSingle();
    if (data?.membership_status !== "approved") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }
  }

  const urlParam = new URL(req.url).searchParams.get("url")?.trim() ?? "";
  const normalized = normalizeMobilizeDocumentUrl(urlParam);
  if (!normalized || !isMobilizePdfUrl(normalized)) {
    return NextResponse.json({ error: "Invalid PDF URL." }, { status: 400 });
  }

  try {
    let bytes: Buffer;

    if (normalized.startsWith("/")) {
      const publicRoot = path.resolve(path.join(process.cwd(), "public"));
      const resolved = path.resolve(path.join(publicRoot, normalized.replace(/^\//, "")));
      if (!resolved.startsWith(publicRoot + path.sep)) {
        return NextResponse.json({ error: "Invalid path." }, { status: 400 });
      }
      bytes = await readFile(resolved);
    } else {
      const remote = new URL(normalized);
      if (isBlockedHost(remote.hostname)) {
        return NextResponse.json({ error: "Invalid PDF URL." }, { status: 400 });
      }
      const upstream = await fetch(remote, {
        redirect: "follow",
        headers: { Accept: "application/pdf,*/*" },
        signal: AbortSignal.timeout(25_000),
      });
      if (!upstream.ok) {
        return NextResponse.json({ error: "Could not fetch PDF." }, { status: 502 });
      }
      bytes = Buffer.from(await upstream.arrayBuffer());
    }

    if (bytes.byteLength > MOBILIZE_RESOURCE_PDF_MAX_BYTES) {
      return NextResponse.json({ error: "PDF exceeds 7 MB." }, { status: 400 });
    }
    if (!isPdfMagic(bytes)) {
      return NextResponse.json({ error: "File is not a PDF." }, { status: 400 });
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
