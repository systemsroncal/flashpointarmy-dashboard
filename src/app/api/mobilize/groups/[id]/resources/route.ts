import { NextResponse } from "next/server";
import { getMobilizeResourcesPostAccess } from "@/lib/mobilize/mobilize-resources-access";
import { normalizeMobilizeResourceUrl } from "@/lib/mobilize/resource-url";
import { isMobilizeSuperAdmin } from "@/lib/mobilize/mobilize-content-access";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";

type Ctx = { params: Promise<{ id: string }> };

const RESOURCE_TYPES = new Set(["link", "document", "video", "text"]);

async function isApprovedMember(
  admin: import("@supabase/supabase-js").SupabaseClient,
  groupId: string,
  userId: string
) {
  const { data } = await admin
    .from("mobilize_group_members")
    .select("membership_status")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .maybeSingle();
  return data?.membership_status === "approved";
}

export async function GET(_req: Request, ctx: Ctx) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;
  const { id } = await ctx.params;

  if (!isMobilizeSuperAdmin(auth.roleNames) && !(await isApprovedMember(auth.admin, id, auth.userId))) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { data, error } = await auth.admin
    .from("mobilize_group_resources")
    .select("id, group_id, author_id, resource_type, title, body, url, file_name, created_at, updated_at")
    .eq("group_id", id)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ resources: data ?? [] });
}

export async function POST(req: Request, ctx: Ctx) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;
  const { id } = await ctx.params;

  const access = await getMobilizeResourcesPostAccess(auth.admin, id, auth.userId);
  if (!access) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  if (!access.canPost) {
    return NextResponse.json({ error: "Only group leaders can add resources." }, { status: 403 });
  }

  const body = (await req.json()) as {
    resource_type?: string;
    title?: string;
    body?: string | null;
    url?: string | null;
    file_name?: string | null;
  };

  const resource_type = String(body.resource_type ?? "").trim();
  if (!RESOURCE_TYPES.has(resource_type)) {
    return NextResponse.json({ error: "Invalid resource type." }, { status: 400 });
  }

  const title = String(body.title ?? "").trim();
  if (!title) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }

  const textBody = body.body != null ? String(body.body).trim() : "";
  const file_name = body.file_name != null ? String(body.file_name).trim() || null : null;
  let url: string | null = null;

  if (resource_type === "text") {
    if (!textBody) {
      return NextResponse.json({ error: "Text content is required." }, { status: 400 });
    }
  } else if (resource_type === "link" || resource_type === "video") {
    url = normalizeMobilizeResourceUrl(String(body.url ?? ""));
    if (!url) {
      return NextResponse.json({ error: "A valid http(s) URL is required." }, { status: 400 });
    }
  } else if (resource_type === "document") {
    const rawUrl = String(body.url ?? "").trim();
    if (!rawUrl.startsWith("/uploads/mobilize-resources/")) {
      return NextResponse.json({ error: "Upload a document first." }, { status: 400 });
    }
    url = rawUrl;
    if (!file_name) {
      return NextResponse.json({ error: "File name is required for documents." }, { status: 400 });
    }
  }

  const { data, error } = await auth.admin
    .from("mobilize_group_resources")
    .insert({
      group_id: id,
      author_id: auth.userId,
      resource_type,
      title,
      body: textBody || null,
      url,
      file_name,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ resource: data });
}
