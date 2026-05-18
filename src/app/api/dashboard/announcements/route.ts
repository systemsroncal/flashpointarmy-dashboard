import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/server-session";
import { normalizeAnnouncementAudience, normalizeCtas } from "@/lib/dashboard/announcements-types";
import { loadUserRoleNames } from "@/lib/auth/user-roles";
import { createClient } from "@/utils/supabase/server";

function isCommunicationsAdmin(roleNames: string[]) {
  return roleNames.includes("super_admin") || roleNames.includes("admin");
}

export async function GET() {
  const authResult = await requireApiAuth();
  if ("response" in authResult) return authResult.response;
  const { supabase, user } = authResult;

  await supabase.rpc("prune_expired_dashboard_announcements");

  const nowIso = new Date().toISOString();
  const { data: rows, error } = await supabase
    .from("dashboard_announcements")
    .select(
      "id, title, description, expires_at, read_more_collapsed, audience, ctas, created_at, updated_at, created_by"
    )
    .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const announcements = (rows ?? []).map((r) => ({
    ...r,
    audience: normalizeAnnouncementAudience((r as { audience?: unknown }).audience),
    ctas: normalizeCtas((r as { ctas?: unknown }).ctas),
  }));

  const ids = announcements.map((a) => a.id);
  const readBy = new Map<string, string | null>();
  const dismissed = new Set<string>();
  if (ids.length) {
    const [readsRes, disRes] = await Promise.all([
      supabase.from("announcement_reads").select("announcement_id, read_at").eq("user_id", user.id).in("announcement_id", ids),
      supabase.from("announcement_dismissed").select("announcement_id").eq("user_id", user.id).in("announcement_id", ids),
    ]);
    for (const row of (readsRes.data ?? []) as { announcement_id: string; read_at: string }[]) {
      readBy.set(row.announcement_id, row.read_at);
    }
    for (const row of (disRes.data ?? []) as { announcement_id: string }[]) {
      dismissed.add(row.announcement_id);
    }
  }

  const visible = announcements.filter((a) => !dismissed.has(a.id));
  const withRead = visible.map((a) => ({
    ...a,
    read_at: readBy.get(a.id) ?? null,
  }));

  const unreadCount = withRead.filter((a) => !a.read_at).length;

  return NextResponse.json({ announcements: withRead, unreadCount });
}

export async function POST(req: Request) {
  const authResult = await requireApiAuth();
  if ("response" in authResult) return authResult.response;
  const { supabase, user } = authResult;

  const roles = await loadUserRoleNames(supabase, user.id);
  if (!isCommunicationsAdmin(roles)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const title = String(body.title ?? "").trim();
  const description = String(body.description ?? "").trim();
  if (!title) return NextResponse.json({ error: "Title is required." }, { status: 400 });

  const expiresRaw = body.expires_at;
  const expires_at =
    expiresRaw === null || expiresRaw === undefined || expiresRaw === ""
      ? null
      : typeof expiresRaw === "string"
        ? expiresRaw
        : null;

  const read_more_collapsed = Boolean(body.read_more_collapsed);
  const ctas = normalizeCtas(body.ctas);
  const audience = normalizeAnnouncementAudience(body.audience);

  const { data: row, error } = await supabase
    .from("dashboard_announcements")
    .insert({
      title,
      description,
      expires_at,
      read_more_collapsed,
      audience,
      ctas,
      created_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .select(
      "id, title, description, expires_at, read_more_collapsed, audience, ctas, created_at, updated_at, created_by"
    )
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({
    announcement: {
      ...row,
      audience: normalizeAnnouncementAudience((row as { audience?: unknown }).audience),
      ctas: normalizeCtas(row.ctas),
    },
  });
}
