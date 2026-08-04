import {
  ANNOUNCEMENT_PDF_MAX_BYTES,
  isPdfMagic,
} from "@/lib/dashboard/announcement-pdf";
import { loadUserRoleNames } from "@/lib/auth/user-roles";
import { writeAnnouncementPdf } from "@/lib/uploads/local-public-image";
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
    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file." }, { status: 400 });
    }

    if (file.size > ANNOUNCEMENT_PDF_MAX_BYTES) {
      return NextResponse.json({ error: "PDF must be 7 MB or smaller." }, { status: 400 });
    }
    if (file.size < 16) {
      return NextResponse.json({ error: "File is too small to be a valid PDF." }, { status: 400 });
    }

    const buf = await file.arrayBuffer();
    const mime = (file.type || "").toLowerCase();
    const nameOk = file.name.toLowerCase().endsWith(".pdf");
    if (mime && mime !== "application/pdf" && !nameOk) {
      return NextResponse.json({ error: "Only PDF files are allowed." }, { status: 400 });
    }
    if (!isPdfMagic(buf)) {
      return NextResponse.json({ error: "File is not a valid PDF." }, { status: 400 });
    }

    const pdf_url = await writeAnnouncementPdf(user.id, Buffer.from(buf));
    const pdf_file_name = file.name.trim().slice(0, 180) || "document.pdf";
    return NextResponse.json({ ok: true, pdf_url, pdf_file_name });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload failed." },
      { status: 500 }
    );
  }
}
