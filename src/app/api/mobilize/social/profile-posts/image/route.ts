import { NextResponse } from "next/server";
import { loadMobilizeImageUploadLimits, mbToBytes } from "@/lib/mobilize/image-upload-limits";
import {
  assertMimeMatchesKind,
  detectImageKindFromBuffer,
  fileExtensionForKind,
  validateAvatarFile,
} from "@/lib/upload/validate-image";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";
import { writeMobilizeProfilePostImage } from "@/lib/uploads/local-public-image";

export async function POST(req: Request) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file." }, { status: 400 });
    }

    const limits = await loadMobilizeImageUploadLimits(auth.admin);
    const basicErr = validateAvatarFile(file, mbToBytes(limits.profile_image_max_mb));
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
    const image_url = await writeMobilizeProfilePostImage(auth.userId, Buffer.from(buf), ext);
    return NextResponse.json({ ok: true, image_url });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload failed." },
      { status: 500 }
    );
  }
}
