import { NextResponse } from "next/server";
import { normalizeMobilizeResourceUrl } from "@/lib/mobilize/resource-url";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";

type Ctx = { params: Promise<{ id: string; resourceId: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;
  const { id: groupId, resourceId } = await ctx.params;

  const { data: me } = await auth.admin
    .from("mobilize_group_members")
    .select("member_role, membership_status")
    .eq("group_id", groupId)
    .eq("user_id", auth.userId)
    .maybeSingle();

  if (!me || me.membership_status !== "approved") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { data: row, error: rErr } = await auth.admin
    .from("mobilize_group_resources")
    .select("*")
    .eq("id", resourceId)
    .eq("group_id", groupId)
    .maybeSingle();

  if (rErr || !row) return NextResponse.json({ error: "Resource not found." }, { status: 404 });

  const isLeader = me.member_role === "leader";
  const isAuthor = row.author_id === auth.userId;
  if (!isAuthor && !isLeader) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const body = (await req.json()) as {
    title?: string;
    body?: string | null;
    url?: string | null;
    file_name?: string | null;
  };

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  const resourceType = String(row.resource_type);

  if (typeof body.title === "string") {
    const title = body.title.trim();
    if (!title) return NextResponse.json({ error: "Title is required." }, { status: 400 });
    patch.title = title;
  }

  if ("body" in body) {
    const textBody = body.body != null ? String(body.body).trim() : "";
    if (resourceType === "text" && !textBody) {
      return NextResponse.json({ error: "Text content is required." }, { status: 400 });
    }
    patch.body = textBody || null;
  }

  if ("url" in body || "file_name" in body) {
    if (resourceType === "link" || resourceType === "video") {
      const url = normalizeMobilizeResourceUrl(String(body.url ?? ""));
      if (!url) return NextResponse.json({ error: "A valid http(s) URL is required." }, { status: 400 });
      patch.url = url;
    } else if (resourceType === "document") {
      const rawUrl = String(body.url ?? row.url ?? "").trim();
      if (!rawUrl.startsWith("/uploads/mobilize-resources/")) {
        return NextResponse.json({ error: "Invalid document URL." }, { status: 400 });
      }
      patch.url = rawUrl;
      const file_name = body.file_name != null ? String(body.file_name).trim() : String(row.file_name ?? "").trim();
      if (!file_name) return NextResponse.json({ error: "File name is required." }, { status: 400 });
      patch.file_name = file_name;
    }
  }

  if (Object.keys(patch).length === 1) {
    return NextResponse.json({ error: "No valid fields." }, { status: 400 });
  }

  const { data, error } = await auth.admin
    .from("mobilize_group_resources")
    .update(patch)
    .eq("id", resourceId)
    .eq("group_id", groupId)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ resource: data });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;
  const { id: groupId, resourceId } = await ctx.params;

  const { data: me } = await auth.admin
    .from("mobilize_group_members")
    .select("member_role, membership_status")
    .eq("group_id", groupId)
    .eq("user_id", auth.userId)
    .maybeSingle();

  if (!me || me.membership_status !== "approved") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { data: row } = await auth.admin
    .from("mobilize_group_resources")
    .select("author_id")
    .eq("id", resourceId)
    .eq("group_id", groupId)
    .maybeSingle();

  if (!row) return NextResponse.json({ error: "Resource not found." }, { status: 404 });

  const isLeader = me.member_role === "leader";
  const isAuthor = row.author_id === auth.userId;
  if (!isAuthor && !isLeader) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { error } = await auth.admin
    .from("mobilize_group_resources")
    .delete()
    .eq("id", resourceId)
    .eq("group_id", groupId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
