import { NextResponse } from "next/server";
import { canManageGroupUpdateNotifications } from "@/lib/mobilize/group-update-notifications-access";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";
import { normalizeFeedContent } from "@/lib/mobilize/social/sanitize-feed-html";

type Ctx = { params: Promise<{ id: string; notificationId: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;
  const { id: groupId, notificationId } = await ctx.params;

  const allowed = await canManageGroupUpdateNotifications({
    admin: auth.admin,
    roleNames: auth.roleNames,
    groupId,
    userId: auth.userId,
  });
  if (!allowed) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const { data: existing, error: findErr } = await auth.admin
    .from("mobilize_group_update_notifications")
    .select("id")
    .eq("id", notificationId)
    .eq("group_id", groupId)
    .maybeSingle();
  if (findErr || !existing) {
    return NextResponse.json({ error: "Notification not found." }, { status: 404 });
  }

  const body = (await req.json()) as {
    title?: string;
    body?: string;
    body_html?: string;
    content?: string;
    content_html?: string;
  };

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (typeof body.title === "string") {
    const title = body.title.trim();
    if (!title || title.length > 200) {
      return NextResponse.json({ error: "Title is required (max 200 characters)." }, { status: 400 });
    }
    patch.title = title;
  }

  if (
    typeof body.body_html === "string" ||
    typeof body.body === "string" ||
    typeof body.content_html === "string" ||
    typeof body.content === "string"
  ) {
    const normalized = normalizeFeedContent({
      content: body.body ?? body.content,
      content_html: body.body_html ?? body.content_html,
    });
    patch.body = normalized.content;
    patch.body_html = normalized.content_html;
  }

  const { data, error } = await auth.admin
    .from("mobilize_group_update_notifications")
    .update(patch)
    .eq("id", notificationId)
    .eq("group_id", groupId)
    .select("id, group_id, title, body, body_html, created_by, created_at, updated_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ notification: data });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;
  const { id: groupId, notificationId } = await ctx.params;

  const allowed = await canManageGroupUpdateNotifications({
    admin: auth.admin,
    roleNames: auth.roleNames,
    groupId,
    userId: auth.userId,
  });
  if (!allowed) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const { error } = await auth.admin
    .from("mobilize_group_update_notifications")
    .delete()
    .eq("id", notificationId)
    .eq("group_id", groupId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
