import { MODULE_SLUGS } from "@/config/modules";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { isChapterStaffRole, loadUserRoleNames } from "@/lib/auth/user-roles";
import { loadPersonNotesAdminList } from "@/lib/people/person-notes-admin";
import { requireApiAuth } from "@/lib/auth/server-session";
import { can } from "@/types/permissions";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const auth = await requireApiAuth();
  if ("response" in auth) return auth.response;

  const roles = await loadUserRoleNames(auth.supabase, auth.user.id);
  if (!isChapterStaffRole(roles)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const permissions = await loadModulePermissions(auth.supabase, auth.user.id);
  if (!can(permissions, MODULE_SLUGS.courses, "read")) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const url = new URL(req.url);
  const page = Math.max(0, Number(url.searchParams.get("page") || 0));
  const perPage = Math.min(100, Math.max(1, Number(url.searchParams.get("perPage") || 25)));
  const q = (url.searchParams.get("q") || "").trim();

  try {
    const { rows, total } = await loadPersonNotesAdminList({ page, perPage, q });
    return NextResponse.json({ ok: true, rows, total });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not load notes.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
