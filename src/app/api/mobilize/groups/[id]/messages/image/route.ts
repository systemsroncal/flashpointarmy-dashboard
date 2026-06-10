import { NextResponse } from "next/server";
import { getMobilizeWallPostAccess } from "@/lib/mobilize/mobilize-wall-post-access";
import {
  assertMimeMatchesKind,
  detectImageKindFromBuffer,
  fileExtensionForKind,
  validateAvatarFile,
} from "@/lib/upload/validate-image";
import { writeMobilizeAnnouncementImage } from "@/lib/uploads/local-public-image";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;
  const { id: groupId } = await ctx.params;

  const access = await getMobilizeWallPostAccess(auth.admin, groupId, auth.userId);
  if (!access) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  if (!access.canPost) {
    return NextResponse.json({ error: "Only group leaders can post on this wall." }, { status: 403 });
  }

  try {
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
    const image_url = await writeMobilizeAnnouncementImage(groupId, auth.userId, Buffer.from(buf), ext);
    return NextResponse.json({ ok: true, image_url });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload failed." },
      { status: 500 }
    );
  }
}
