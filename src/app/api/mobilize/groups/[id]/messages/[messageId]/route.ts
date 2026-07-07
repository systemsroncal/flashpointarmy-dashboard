import { NextResponse } from "next/server";
import { sanitizeAnnouncementImageUrls } from "@/lib/mobilize/announcement-images";
import { canManageMobilizeGroupContent, isMobilizeSuperAdmin } from "@/lib/mobilize/mobilize-content-access";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";

type Ctx = { params: Promise<{ id: string; messageId: string }> };

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

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;
  const { id: groupId, messageId } = await ctx.params;

  const me = await loadMembership(auth.admin, groupId, auth.userId);
  const isSuperAdmin = isMobilizeSuperAdmin(auth.roleNames);
  if (!isSuperAdmin && (!me || me.membership_status !== "approved")) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { data: msg, error: mErr } = await auth.admin
    .from("mobilize_group_messages")
    .select("id, author_id, content, comments_policy, image_urls")
    .eq("id", messageId)
    .eq("group_id", groupId)
    .maybeSingle();

  if (mErr || !msg) return NextResponse.json({ error: "Message not found." }, { status: 404 });

  const isLeader = me?.membership_status === "approved" && me.member_role === "leader";
  const isAuthor = msg.author_id === auth.userId;
  if (
    !canManageMobilizeGroupContent({
      roleNames: auth.roleNames,
      isLeader,
      isAuthor,
    })
  ) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const body = (await req.json()) as {
    content?: string;
    comments_policy?: string;
    image_urls?: unknown;
  };

  const patch: Record<string, unknown> = {};
  if (typeof body.content === "string") {
    patch.content = body.content.trim();
  }
  if ("image_urls" in body) {
    const image_urls = sanitizeAnnouncementImageUrls(body.image_urls);
    if (image_urls === null) {
      return NextResponse.json({ error: "Invalid image URLs." }, { status: 400 });
    }
    patch.image_urls = image_urls;
  }

  const nextContent = typeof patch.content === "string" ? patch.content : String(msg.content ?? "").trim();
  const nextImages = Array.isArray(patch.image_urls)
    ? (patch.image_urls as string[])
    : Array.isArray((msg as { image_urls?: string[] }).image_urls)
      ? ((msg as { image_urls: string[] }).image_urls ?? [])
      : [];
  if (!nextContent && !nextImages.length) {
    return NextResponse.json({ error: "Add text or at least one image." }, { status: 400 });
  }

  if ("comments_policy" in body && (isLeader || isSuperAdmin)) {
    patch.comments_policy =
      body.comments_policy === "leaders_only" ? "leaders_only" : "everyone";
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No valid fields." }, { status: 400 });
  }

  const { data, error } = await auth.admin
    .from("mobilize_group_messages")
    .update(patch)
    .eq("id", messageId)
    .eq("group_id", groupId)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: data });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;
  const { id: groupId, messageId } = await ctx.params;

  const me = await loadMembership(auth.admin, groupId, auth.userId);
  const isSuperAdmin = isMobilizeSuperAdmin(auth.roleNames);
  if (!isSuperAdmin && (!me || me.membership_status !== "approved")) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { data: msg, error: mErr } = await auth.admin
    .from("mobilize_group_messages")
    .select("id, author_id")
    .eq("id", messageId)
    .eq("group_id", groupId)
    .maybeSingle();

  if (mErr || !msg) return NextResponse.json({ error: "Message not found." }, { status: 404 });

  const isLeader = me?.membership_status === "approved" && me.member_role === "leader";
  const isAuthor = msg.author_id === auth.userId;
  if (
    !canManageMobilizeGroupContent({
      roleNames: auth.roleNames,
      isLeader,
      isAuthor,
    })
  ) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { error } = await auth.admin
    .from("mobilize_group_messages")
    .delete()
    .eq("id", messageId)
    .eq("group_id", groupId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
