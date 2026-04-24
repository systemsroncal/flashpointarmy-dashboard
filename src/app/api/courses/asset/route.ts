import {
  assertMimeMatchesKind,
  detectImageKindFromBuffer,
  fileExtensionForKind,
  validateAvatarFile,
} from "@/lib/upload/validate-image";
import { writeCourseAsset } from "@/lib/uploads/local-public-image";
import { isElevatedRole, loadUserRoleNames } from "@/lib/auth/user-roles";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

function isPdf(buf: ArrayBuffer): boolean {
  const u = new Uint8Array(buf.slice(0, 5));
  return u[0] === 0x25 && u[1] === 0x50 && u[2] === 0x44 && u[3] === 0x46 && u[4] === 0x2d; // %PDF-
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const roles = await loadUserRoleNames(supabase, user.id);
  if (!isElevatedRole(roles)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  const kind = String(formData.get("kind") ?? "image");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file." }, { status: 400 });
  }

  const buf = await file.arrayBuffer();

  if (kind === "pdf") {
    if (file.type !== "application/pdf" || !isPdf(buf)) {
      return NextResponse.json({ error: "Invalid PDF file." }, { status: 400 });
    }
    const publicPath = await writeCourseAsset(user.id, Buffer.from(buf), "pdf");
    return NextResponse.json({ ok: true, url: publicPath });
  }

  const basicErr = validateAvatarFile(file);
  if (basicErr) {
    return NextResponse.json({ error: basicErr.error }, { status: 400 });
  }

  const imageKind = detectImageKindFromBuffer(buf);
  if (!imageKind) {
    return NextResponse.json({ error: "File is not a valid image." }, { status: 400 });
  }
  const mimeErr = assertMimeMatchesKind(file.type, imageKind);
  if (mimeErr) {
    return NextResponse.json({ error: mimeErr.error }, { status: 400 });
  }

  const ext = fileExtensionForKind(imageKind);
  const publicPath = await writeCourseAsset(user.id, Buffer.from(buf), ext);
  return NextResponse.json({ ok: true, url: publicPath });
}
