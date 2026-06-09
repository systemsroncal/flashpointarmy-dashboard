import { MODULE_SLUGS } from "@/config/modules";
import {
  buildCourseProgressExportRows,
  type CourseProgressExportRoleFilter,
} from "@/lib/export/course-progress-export";
import { buildXlsxBuffer, xlsxAttachmentHeaders } from "@/lib/export/xlsx-buffer";
import { requireApiAuth } from "@/lib/auth/server-session";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { can } from "@/types/permissions";
import { createAdminClient, hasSupabaseAdminEnv } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parseRoleFilter(raw: string | null): CourseProgressExportRoleFilter {
  if (raw === "member" || raw === "leader") return raw;
  return "all";
}

export async function GET(req: Request) {
  const authResult = await requireApiAuth();
  if ("response" in authResult) return authResult.response;

  const { supabase } = authResult;
  const permissions = await loadModulePermissions(supabase, authResult.user.id);
  if (!can(permissions, MODULE_SLUGS.courses, "read")) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  if (!hasSupabaseAdminEnv()) {
    return NextResponse.json({ error: "Server export is not configured." }, { status: 503 });
  }

  const url = new URL(req.url);
  const courseId = (url.searchParams.get("courseId") ?? "").trim();
  if (!UUID_RE.test(courseId)) {
    return NextResponse.json({ error: "Invalid courseId." }, { status: 400 });
  }

  const roleFilter = parseRoleFilter(url.searchParams.get("role"));
  const chapterId = url.searchParams.get("chapterId") ?? "all";
  const stateFilter = url.searchParams.get("state") ?? "all";

  try {
    const admin = createAdminClient();
    const { rows, courseTitle } = await buildCourseProgressExportRows(admin, courseId, {
      roleFilter,
      chapterId,
      stateFilter,
    });
    const slug = courseTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40);
    const dateStamp = new Date().toISOString().slice(0, 10);
    const filename = `course-progress-${slug || "course"}-${dateStamp}.xlsx`;
    const buffer = buildXlsxBuffer(rows, "Progress");
    return new NextResponse(new Uint8Array(buffer), { headers: xlsxAttachmentHeaders(filename) });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Export failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
