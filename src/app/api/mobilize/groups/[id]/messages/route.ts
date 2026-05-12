import { NextResponse } from "next/server";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";

type Ctx = { params: Promise<{ id: string }> };

async function isApprovedMember(
  admin: import("@supabase/supabase-js").SupabaseClient,
  groupId: string,
  userId: string
) {
  const { data } = await admin
    .from("mobilize_group_members")
    .select("membership_status, member_role")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .maybeSingle();
  return data?.membership_status === "approved"
    ? (data as { membership_status: string; member_role: string })
    : null;
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
    .select("id, group_id, author_id, content, comments_policy, created_at")
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

  const membership = await isApprovedMember(auth.admin, id, auth.userId);
  if (!membership) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { data: grp } = await auth.admin
    .from("mobilize_groups")
    .select("wall_post_policy")
    .eq("id", id)
    .maybeSingle();

  const wall =
    (grp as { wall_post_policy?: string } | null)?.wall_post_policy === "leaders_only"
      ? "leaders_only"
      : "all_approved";
  const isLeader = membership.member_role === "leader";
  if (wall === "leaders_only" && !isLeader) {
    return NextResponse.json({ error: "Only group leaders can post on this wall." }, { status: 403 });
  }

  const body = (await req.json()) as { content?: string; comments_policy?: string };
  const content = String(body.content ?? "").trim();
  if (!content) {
    return NextResponse.json({ error: "content is required." }, { status: 400 });
  }

  let comments_policy: "everyone" | "leaders_only" = "everyone";
  if (isLeader) {
    comments_policy = body.comments_policy === "leaders_only" ? "leaders_only" : "everyone";
  }

  const { data, error } = await auth.admin
    .from("mobilize_group_messages")
    .insert({ group_id: id, author_id: auth.userId, content, comments_policy })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: data });
}
