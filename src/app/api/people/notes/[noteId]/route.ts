import { MODULE_SLUGS } from "@/config/modules";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { isChapterStaffRole, loadUserRoleNames } from "@/lib/auth/user-roles";
import {
  getPersonProfileNoteById,
  updatePersonProfileNote,
} from "@/lib/people/person-notes-admin";
import { requireApiAuth } from "@/lib/auth/server-session";
import { can } from "@/types/permissions";
import { NextResponse } from "next/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(
  _req: Request,
  context: { params: Promise<{ noteId: string }> }
) {
  const auth = await requireApiAuth();
  if ("response" in auth) return auth.response;
  const { noteId } = await context.params;

  if (!UUID_RE.test(noteId)) {
    return NextResponse.json({ error: "Invalid note id." }, { status: 400 });
  }

  const roles = await loadUserRoleNames(auth.supabase, auth.user.id);
  if (!isChapterStaffRole(roles)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const permissions = await loadModulePermissions(auth.supabase, auth.user.id);
  if (!can(permissions, MODULE_SLUGS.courses, "read")) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const item = await getPersonProfileNoteById(noteId);
  if (!item) {
    return NextResponse.json({ error: "Note not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, item });
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ noteId: string }> }
) {
  const auth = await requireApiAuth();
  if ("response" in auth) return auth.response;
  const { noteId } = await context.params;

  if (!UUID_RE.test(noteId)) {
    return NextResponse.json({ error: "Invalid note id." }, { status: 400 });
  }

  const roles = await loadUserRoleNames(auth.supabase, auth.user.id);
  if (!isChapterStaffRole(roles)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const permissions = await loadModulePermissions(auth.supabase, auth.user.id);
  if (!can(permissions, MODULE_SLUGS.courses, "read")) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  let body: { body?: string };
  try {
    body = (await req.json()) as { body?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const result = await updatePersonProfileNote(noteId, String(body.body ?? ""));
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const item = await getPersonProfileNoteById(noteId);
  return NextResponse.json({ ok: true, item });
}
