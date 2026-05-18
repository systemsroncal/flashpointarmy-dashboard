import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/server-session";
import { normalizeAnnouncementAudience, normalizeCtas } from "@/lib/dashboard/announcements-types";
import { loadUserRoleNames } from "@/lib/auth/user-roles";
import { createClient } from "@/utils/supabase/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isCommunicationsAdmin(roleNames: string[]) {
  return roleNames.includes("super_admin") || roleNames.includes("admin");
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "Invalid id." }, { status: 400 });

  const authResult = await requireApiAuth();
  if ("response" in authResult) return authResult.response;
  const { supabase, user } = authResult;

  const roles = await loadUserRoleNames(supabase, user.id);
  if (!isCommunicationsAdmin(roles)) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.title !== undefined) patch.title = String(body.title ?? "").trim();
  if (body.description !== undefined) patch.description = String(body.description ?? "").trim();
  if (body.read_more_collapsed !== undefined) patch.read_more_collapsed = Boolean(body.read_more_collapsed);
  if (body.ctas !== undefined) patch.ctas = normalizeCtas(body.ctas);
  if (body.audience !== undefined) patch.audience = normalizeAnnouncementAudience(body.audience);
  if (body.expires_at !== undefined) {
    const v = body.expires_at;
    patch.expires_at =
      v === null || v === "" ? null : typeof v === "string" ? v : null;
  }

  if (String(patch.title ?? "").length === 0 && body.title !== undefined) {
    return NextResponse.json({ error: "Title cannot be empty." }, { status: 400 });
  }

  const { data: row, error } = await supabase
    .from("dashboard_announcements")
    .update(patch)
    .eq("id", id)
    .select(
      "id, title, description, expires_at, read_more_collapsed, audience, ctas, created_at, updated_at, created_by"
    )
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!row) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({
    announcement: {
      ...row,
      audience: normalizeAnnouncementAudience((row as { audience?: unknown }).audience),
      ctas: normalizeCtas(row.ctas),
    },
  });
}

export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "Invalid id." }, { status: 400 });

  const authResult = await requireApiAuth();
  if ("response" in authResult) return authResult.response;
  const { supabase, user } = authResult;

  const roles = await loadUserRoleNames(supabase, user.id);
  if (!isCommunicationsAdmin(roles)) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const { error } = await supabase.from("dashboard_announcements").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
