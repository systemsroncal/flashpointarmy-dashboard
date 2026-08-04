import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/server-session";
import {
  loadAnnouncementRecipientsByIds,
  normalizeTargetUserIds,
  syncAnnouncementRecipients,
  type AnnouncementTargetUser,
} from "@/lib/dashboard/announcement-recipients";
import { normalizeAnnouncementAudience, normalizeCtas } from "@/lib/dashboard/announcements-types";
import {
  normalizeAnnouncementPdfFileName,
  normalizeAnnouncementPdfUrl,
} from "@/lib/dashboard/announcement-pdf";
import { loadUserRoleNames } from "@/lib/auth/user-roles";
import { createAdminClient } from "@/utils/supabase/admin";

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
  if (body.audience !== undefined) {
    patch.audience = normalizeAnnouncementAudience(body.audience);
    if (patch.audience !== "specific_users") {
      patch.target_user_id = null;
    }
  }
  if (body.expires_at !== undefined) {
    const v = body.expires_at;
    patch.expires_at =
      v === null || v === "" ? null : typeof v === "string" ? v : null;
  }
  if (body.pdf_url !== undefined) {
    if (body.pdf_url === null || body.pdf_url === "") {
      patch.pdf_url = null;
      patch.pdf_file_name = null;
    } else {
      const pdf_url = normalizeAnnouncementPdfUrl(body.pdf_url);
      if (!pdf_url) {
        return NextResponse.json(
          { error: "PDF must be an https URL or an uploaded announcement PDF." },
          { status: 400 }
        );
      }
      patch.pdf_url = pdf_url;
      patch.pdf_file_name =
        normalizeAnnouncementPdfFileName(body.pdf_file_name) || "document.pdf";
    }
  } else if (body.pdf_file_name !== undefined && body.pdf_url === undefined) {
    // ignore orphan name updates without url
  }

  if (String(patch.title ?? "").length === 0 && body.title !== undefined) {
    return NextResponse.json({ error: "Title cannot be empty." }, { status: 400 });
  }

  const nextAudience =
    body.audience !== undefined ? normalizeAnnouncementAudience(body.audience) : null;
  const targetUserIds =
    body.target_user_ids !== undefined ? normalizeTargetUserIds(body.target_user_ids) : null;

  if (nextAudience === "specific_users" && targetUserIds !== null && targetUserIds.length === 0) {
    return NextResponse.json(
      { error: "Select at least one user for Specific user(s)." },
      { status: 400 }
    );
  }

  const { data: row, error } = await supabase
    .from("dashboard_announcements")
    .update(patch)
    .eq("id", id)
    .select(
      "id, title, description, expires_at, read_more_collapsed, audience, ctas, pdf_url, pdf_file_name, created_at, updated_at, created_by"
    )
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!row) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const audienceAfter = normalizeAnnouncementAudience((row as { audience?: unknown }).audience);
  const admin = createAdminClient();

  if (audienceAfter === "specific_users") {
    let ids = targetUserIds;
    if (ids === null) {
      const existing = await loadAnnouncementRecipientsByIds(admin, [id]);
      ids = (existing.get(id) ?? []).map((u) => u.id);
    }
    if (!ids.length) {
      return NextResponse.json(
        { error: "Select at least one user for Specific user(s)." },
        { status: 400 }
      );
    }
    try {
      await syncAnnouncementRecipients(admin, id, ids);
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Could not update recipients." },
        { status: 500 }
      );
    }
  } else if (body.audience !== undefined || targetUserIds !== null) {
    try {
      await syncAnnouncementRecipients(admin, id, []);
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Could not update recipients." },
        { status: 500 }
      );
    }
  }

  let target_users: AnnouncementTargetUser[] = [];
  if (audienceAfter === "specific_users") {
    const map = await loadAnnouncementRecipientsByIds(admin, [id]);
    target_users = map.get(id) ?? [];
  }

  return NextResponse.json({
    announcement: {
      ...row,
      audience: audienceAfter,
      ctas: normalizeCtas(row.ctas),
      ...(audienceAfter === "specific_users"
        ? {
            target_user_ids: target_users.map((u) => u.id),
            target_users,
          }
        : {}),
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
