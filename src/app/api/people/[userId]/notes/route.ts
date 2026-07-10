import { isChapterStaffRole, loadUserRoleNames } from "@/lib/auth/user-roles";
import { loadPersonNotes, loadPersonProfilePage } from "@/lib/people/person-profile-data";
import { requireApiAuth } from "@/lib/auth/server-session";
import { createAdminClient } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(
  _req: Request,
  context: { params: Promise<{ userId: string }> }
) {
  const auth = await requireApiAuth();
  if ("response" in auth) return auth.response;
  const { userId } = await context.params;
  if (!UUID_RE.test(userId)) {
    return NextResponse.json({ error: "Invalid user id." }, { status: 400 });
  }

  const access = await loadPersonProfilePage(auth.supabase, auth.user.id, userId);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const items = await loadPersonNotes(userId);
  return NextResponse.json({ ok: true, items });
}

export async function POST(
  req: Request,
  context: { params: Promise<{ userId: string }> }
) {
  const auth = await requireApiAuth();
  if ("response" in auth) return auth.response;
  const { userId } = await context.params;
  if (!UUID_RE.test(userId)) {
    return NextResponse.json({ error: "Invalid user id." }, { status: 400 });
  }

  const roles = await loadUserRoleNames(auth.supabase, auth.user.id);
  if (!isChapterStaffRole(roles)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const access = await loadPersonProfilePage(auth.supabase, auth.user.id, userId);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  let body: { body?: string };
  try {
    body = (await req.json()) as { body?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const text = String(body.body ?? "").trim();
  if (!text) {
    return NextResponse.json({ error: "Note text is required." }, { status: 400 });
  }
  if (text.length > 8000) {
    return NextResponse.json({ error: "Note is too long." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("person_profile_notes")
    .insert({
      person_user_id: userId,
      author_user_id: auth.user.id,
      body: text,
    })
    .select("id, body, created_at, updated_at, author_user_id")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message || "Could not save note. Apply migration 064 if missing." },
      { status: 500 }
    );
  }

  const { data: author } = await admin
    .from("profiles")
    .select("first_name, last_name, display_name")
    .eq("id", auth.user.id)
    .maybeSingle();
  const authorName =
    [author?.first_name, author?.last_name].filter(Boolean).join(" ").trim() ||
    author?.display_name?.trim() ||
    "Staff";

  return NextResponse.json({
    ok: true,
    item: {
      id: data.id as string,
      body: data.body as string,
      created_at: String(data.created_at),
      updated_at: String(data.updated_at),
      author_user_id: data.author_user_id as string,
      author_name: authorName,
    },
  });
}
