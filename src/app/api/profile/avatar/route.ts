import {
  assertMimeMatchesKind,
  detectImageKindFromBuffer,
  fileExtensionForKind,
  validateAvatarFile,
} from "@/lib/upload/validate-image";
import { writeUserAvatarImage } from "@/lib/uploads/local-public-image";
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
    const publicPath = await writeUserAvatarImage(user.id, Buffer.from(buf), ext);

    const fallbackDisplayName =
      (user.user_metadata?.display_name as string | undefined)?.trim() ||
      [user.user_metadata?.first_name, user.user_metadata?.last_name]
        .map((v) => String(v ?? "").trim())
        .filter(Boolean)
        .join(" ") ||
      (user.email?.split("@")[0] ?? "User");

    const { error: pErr } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          avatar_url: publicPath,
          display_name: fallbackDisplayName,
        },
        { onConflict: "id" }
      );

    if (pErr) {
      return NextResponse.json({ error: pErr.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, avatar_url: publicPath });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload failed." },
      { status: 500 }
    );
  }
}
