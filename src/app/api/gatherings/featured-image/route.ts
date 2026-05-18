import {
  assertMimeMatchesKind,
  detectImageKindFromBuffer,
  fileExtensionForKind,
  validateAvatarFile,
} from "@/lib/upload/validate-image";
import { writeGatheringImage } from "@/lib/uploads/local-public-image";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/server-session";

export async function POST(req: Request) {
  try {
    const authResult = await requireApiAuth();
  if ("response" in authResult) return authResult.response;
  const { supabase, user } = authResult;

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
    const publicPath = await writeGatheringImage(user.id, Buffer.from(buf), ext);

    return NextResponse.json({ ok: true, image_url: publicPath });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload failed." },
      { status: 500 }
    );
  }
}
