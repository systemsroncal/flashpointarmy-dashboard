import { NextResponse } from "next/server";
import { canManageGroupUpdateNotifications } from "@/lib/mobilize/group-update-notifications-access";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";
import { canViewMobilizeGroupMemberContent } from "@/lib/mobilize/mobilize-content-access";
import { normalizeFeedContent } from "@/lib/mobilize/social/sanitize-feed-html";
import { resolveMobilizeAuthors } from "@/lib/mobilize/social/resolve-authors";

type Ctx = { params: Promise<{ id: string }> };

async function loadMembership(
  admin: import("@supabase/supabase-js").SupabaseClient,
  groupId: string,
  userId: string
) {
  const { data } = await admin
    .from("mobilize_group_members")
    .select("member_role, membership_status")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .maybeSingle();
  return data;
}

export async function GET(_req: Request, ctx: Ctx) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;
  const { id: groupId } = await ctx.params;

  const me = await loadMembership(auth.admin, groupId, auth.userId);
  const isApproved = me?.membership_status === "approved";
  if (
    !canViewMobilizeGroupMemberContent({
      roleNames: auth.roleNames,
      isApprovedMember: Boolean(isApproved),
    })
  ) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const canManage = await canManageGroupUpdateNotifications({
    admin: auth.admin,
    roleNames: auth.roleNames,
    groupId,
    userId: auth.userId,
  });

  const { data: rows, error } = await auth.admin
    .from("mobilize_group_update_notifications")
    .select("id, group_id, title, body, body_html, created_by, created_at, updated_at")
    .eq("group_id", groupId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const authorIds = [...new Set((rows ?? []).map((r) => r.created_by as string))];
  const authors = await resolveMobilizeAuthors(auth.admin, authorIds);

  const notifications = (rows ?? []).map((row) => ({
    id: row.id as string,
    group_id: row.group_id as string,
    title: row.title as string,
    body: row.body as string,
    body_html: (row.body_html as string | null) ?? null,
    created_by: row.created_by as string,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    author: authors.get(row.created_by as string) ?? {
      id: row.created_by as string,
      display_name: "Member",
      avatar_url: null,
    },
  }));

  return NextResponse.json({ notifications, can_manage: canManage });
}

export async function POST(req: Request, ctx: Ctx) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;
  const { id: groupId } = await ctx.params;

  const allowed = await canManageGroupUpdateNotifications({
    admin: auth.admin,
    roleNames: auth.roleNames,
    groupId,
    userId: auth.userId,
  });
  if (!allowed) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const body = (await req.json()) as {
    title?: string;
    body?: string;
    body_html?: string;
    content?: string;
    content_html?: string;
  };

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title || title.length > 200) {
    return NextResponse.json({ error: "Title is required (max 200 characters)." }, { status: 400 });
  }

  const normalized = normalizeFeedContent({
    content: body.body ?? body.content,
    content_html: body.body_html ?? body.content_html,
  });

  const { data, error } = await auth.admin
    .from("mobilize_group_update_notifications")
    .insert({
      group_id: groupId,
      title,
      body: normalized.content,
      body_html: normalized.content_html,
      created_by: auth.userId,
    })
    .select("id, group_id, title, body, body_html, created_by, created_at, updated_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ notification: data }, { status: 201 });
}
