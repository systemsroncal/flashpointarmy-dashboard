import { assertSuperAdminExportAccess } from "@/lib/export/require-super-admin-export";
import { buildUserDirectoryExportRows } from "@/lib/export/user-directory-export";
import { buildXlsxBuffer, xlsxAttachmentHeaders } from "@/lib/export/xlsx-buffer";
import { requireApiAuth } from "@/lib/auth/server-session";
import { createAdminClient, hasSupabaseAdminEnv } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const authResult = await requireApiAuth();
  if ("response" in authResult) return authResult.response;

  const { supabase, user } = authResult;
  const forbidden = await assertSuperAdminExportAccess(supabase, user.id);
  if (forbidden) return forbidden;
  if (!hasSupabaseAdminEnv()) {
    return NextResponse.json({ error: "Server export is not configured." }, { status: 503 });
  }

  const url = new URL(req.url);
  const chapterId = url.searchParams.get("chapterId") ?? "all";
  const stateFilter = url.searchParams.get("state") ?? "all";

  try {
    const admin = createAdminClient();
    const rows = await buildUserDirectoryExportRows(admin, "leaders", { chapterId, stateFilter });
    const dateStamp = new Date().toISOString().slice(0, 10);
    const filename = `leaders-${dateStamp}.xlsx`;
    const buffer = buildXlsxBuffer(rows, "Leaders");
    return new NextResponse(new Uint8Array(buffer), { headers: xlsxAttachmentHeaders(filename) });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Export failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
