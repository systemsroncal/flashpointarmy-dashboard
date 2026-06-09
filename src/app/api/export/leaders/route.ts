import { MODULE_SLUGS } from "@/config/modules";
import { buildUserDirectoryExportRows } from "@/lib/export/user-directory-export";
import { buildXlsxBuffer, xlsxAttachmentHeaders } from "@/lib/export/xlsx-buffer";
import { requireApiAuth } from "@/lib/auth/server-session";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { can } from "@/types/permissions";
import { createAdminClient, hasSupabaseAdminEnv } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const authResult = await requireApiAuth();
  if ("response" in authResult) return authResult.response;

  const { supabase } = authResult;
  const permissions = await loadModulePermissions(supabase, authResult.user.id);
  if (!can(permissions, MODULE_SLUGS.leaders, "read")) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
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
