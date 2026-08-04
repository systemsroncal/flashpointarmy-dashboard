import {
  assertMimeMatchesKind,
  detectImageKindFromBuffer,
  fileExtensionForKind,
  validateAvatarFile,
} from "@/lib/upload/validate-image";
import { fetchRemoteImageForUpload } from "@/lib/upload/fetch-remote-image";
import { loadUserRoleNames } from "@/lib/auth/user-roles";
import { writeAnnouncementImage } from "@/lib/uploads/local-public-image";
import { requireApiAuth } from "@/lib/auth/server-session";
import { NextResponse } from "next/server";

function isCommunicationsAdmin(roleNames: string[]) {
  return roleNames.includes("super_admin") || roleNames.includes("admin");
}

export async function POST(req: Request) {
  const authResult = await requireApiAuth();
  if ("response" in authResult) return authResult.response;
  const { supabase, user } = authResult;

  const roles = await loadUserRoleNames(supabase, user.id);
  if (!isCommunicationsAdmin(roles)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  try {
    const contentType = (req.headers.get("content-type") || "").toLowerCase();

    // Paste / Image dialog: remote HTTPS URL → re-host on this server (VPS).
    if (contentType.includes("application/json")) {
      const body = (await req.json().catch(() => null)) as { url?: string } | null;
      const url = typeof body?.url === "string" ? body.url.trim() : "";
      if (!url) {
        return NextResponse.json({ error: "Missing url." }, { status: 400 });
      }
      const { buffer, kind } = await fetchRemoteImageForUpload(url);
      const location = await writeAnnouncementImage(user.id, buffer, fileExtensionForKind(kind));
      return NextResponse.json({ ok: true, location });
    }

    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file." }, { status: 400 });
    }

    const basicErr = validateAvatarFile(file);
    if (basicErr) {
      return NextResponse.json({ error: basicErr.error }, { status: 400 });
    }

    const buf = await file.arrayBuffer();
    const kind = detectImageKindFromBuffer(buf);
    if (!kind) {
      return NextResponse.json(
        { error: "File is not a valid JPEG, PNG, GIF, or WebP image." },
        { status: 400 }
      );
    }
    const mimeErr = assertMimeMatchesKind(file.type, kind);
    if (mimeErr) {
      return NextResponse.json({ error: mimeErr.error }, { status: 400 });
    }

    const ext = fileExtensionForKind(kind);
    const location = await writeAnnouncementImage(user.id, Buffer.from(buf), ext);
    return NextResponse.json({ ok: true, location });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload failed." },
      { status: 500 }
    );
  }
}
