import { NextResponse } from "next/server";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";
import { createAdminClient } from "@/utils/supabase/admin";

type Ctx = { params: Promise<{ id: string }> };

async function isApprovedMember(
  admin: ReturnType<typeof createAdminClient>,
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

export async function GET(req: Request, ctx: Ctx) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;
  const { id } = await ctx.params;
  const url = new URL(req.url);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") || 30)));
  const before = url.searchParams.get("before");

  if (!(await isApprovedMember(auth.admin, id, auth.userId))) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  let q = auth.admin
    .from("mobilize_group_messages")
    .select("id, group_id, author_id, content, created_at")
    .eq("group_id", id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (before) {
    q = q.lt("created_at", before);
  }

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ messages: data ?? [] });
}

export async function POST(req: Request, ctx: Ctx) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;
  const { id } = await ctx.params;

  if (!(await isApprovedMember(auth.admin, id, auth.userId))) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const body = (await req.json()) as { content?: string };
  const content = String(body.content ?? "").trim();
  if (!content) {
    return NextResponse.json({ error: "content is required." }, { status: 400 });
  }

  const { data, error } = await auth.admin
    .from("mobilize_group_messages")
    .insert({ group_id: id, author_id: auth.userId, content })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: data });
}
