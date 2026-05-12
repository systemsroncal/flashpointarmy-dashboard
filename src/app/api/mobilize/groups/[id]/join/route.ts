import { NextResponse } from "next/server";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;
  const { id } = await ctx.params;

  const { data: group, error: gErr } = await auth.admin
    .from("mobilize_groups")
    .select("id, visibility")
    .eq("id", id)
    .maybeSingle();

  if (gErr || !group) {
    return NextResponse.json({ error: "Group not found." }, { status: 404 });
  }
  if (group.visibility !== "public") {
    return NextResponse.json({ error: "Join requests are only for public groups." }, { status: 400 });
  }

  const { data: existing } = await auth.admin
    .from("mobilize_group_members")
    .select("id, membership_status")
    .eq("group_id", id)
    .eq("user_id", auth.userId)
    .maybeSingle();

  if (existing) {
    if (existing.membership_status === "approved") {
      return NextResponse.json({ error: "Already a member." }, { status: 400 });
    }
    if (existing.membership_status === "pending") {
      return NextResponse.json({ error: "Request already pending." }, { status: 400 });
    }
    const { data, error } = await auth.admin
      .from("mobilize_group_members")
      .update({ membership_status: "pending", member_role: "member" })
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ membership: data });
  }

  const { data, error } = await auth.admin
    .from("mobilize_group_members")
    .insert({
      group_id: id,
      user_id: auth.userId,
      member_role: "member",
      membership_status: "pending",
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ membership: data });
}
