import {
  assertMimeMatchesKind,
  detectImageKindFromBuffer,
  fileExtensionForKind,
  validateAvatarFile,
} from "@/lib/upload/validate-image";
import { writeTrainingCertificate } from "@/lib/uploads/local-public-image";
import { requireApiAuth } from "@/lib/auth/server-session";
import { NextResponse } from "next/server";

function isPdf(buf: ArrayBuffer): boolean {
  const u = new Uint8Array(buf.slice(0, 5));
  return u[0] === 0x25 && u[1] === 0x50 && u[2] === 0x44 && u[3] === 0x46 && u[4] === 0x2d;
}

export async function POST(req: Request) {
  const authResult = await requireApiAuth();
  if ("response" in authResult) return authResult.response;
  const { user } = authResult;

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file." }, { status: 400 });
  }

  const buf = await file.arrayBuffer();
  const mime = file.type || "";

  if (mime === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    if (!isPdf(buf)) {
      return NextResponse.json({ error: "Invalid PDF file." }, { status: 400 });
    }
    const publicPath = await writeTrainingCertificate(user.id, Buffer.from(buf), "pdf");
    return NextResponse.json({
      ok: true,
      url: publicPath,
      file_name: file.name,
      mime: "application/pdf",
    });
  }

  const basicErr = validateAvatarFile(file);
  if (basicErr) {
    return NextResponse.json({ error: basicErr.error }, { status: 400 });
  }

  const imageKind = detectImageKindFromBuffer(buf);
  if (!imageKind) {
    return NextResponse.json({ error: "File must be an image or PDF." }, { status: 400 });
  }
  const mimeErr = assertMimeMatchesKind(file.type, imageKind);
  if (mimeErr) {
    return NextResponse.json({ error: mimeErr.error }, { status: 400 });
  }

  const ext = fileExtensionForKind(imageKind);
  const publicPath = await writeTrainingCertificate(user.id, Buffer.from(buf), ext);
  return NextResponse.json({
    ok: true,
    url: publicPath,
    file_name: file.name,
    mime: file.type || `image/${ext}`,
  });
}
