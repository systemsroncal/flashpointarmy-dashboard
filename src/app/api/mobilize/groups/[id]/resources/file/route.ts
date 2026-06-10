import { NextResponse } from "next/server";
import { getMobilizeResourcesPostAccess } from "@/lib/mobilize/mobilize-resources-access";
import {
  detectResourceDocumentExt,
  validateResourceDocument,
} from "@/lib/mobilize/validate-resource-document";
import { writeMobilizeGroupResourceFile } from "@/lib/uploads/local-public-image";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;
  const { id: groupId } = await ctx.params;

  const access = await getMobilizeResourcesPostAccess(auth.admin, groupId, auth.userId);
  if (!access) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  if (!access.canPost) {
    return NextResponse.json({ error: "Only group leaders can add resources." }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file." }, { status: 400 });
    }

    const basicErr = validateResourceDocument(file);
    if (basicErr) {
      return NextResponse.json({ error: basicErr.error }, { status: 400 });
    }

    const buf = await file.arrayBuffer();
    const ext = detectResourceDocumentExt(file, buf);
    if (!ext) {
      return NextResponse.json({ error: "Invalid PDF, DOC, or DOCX file." }, { status: 400 });
    }

    const url = await writeMobilizeGroupResourceFile(
      groupId,
      auth.userId,
      Buffer.from(buf),
      ext
    );
    return NextResponse.json({ ok: true, url, file_name: file.name });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload failed." },
      { status: 500 }
    );
  }
}
