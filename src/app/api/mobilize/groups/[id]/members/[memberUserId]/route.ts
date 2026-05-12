import { NextResponse } from "next/server";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";

type Ctx = { params: Promise<{ id: string; memberUserId: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;
  const { id, memberUserId } = await ctx.params;

  const { data: me } = await auth.admin
    .from("mobilize_group_members")
    .select("member_role, membership_status")
    .eq("group_id", id)
    .eq("user_id", auth.userId)
    .eq("membership_status", "approved")
    .maybeSingle();

  if (!me || me.member_role !== "leader") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const body = (await req.json()) as { membership_status?: string };
  const nextStatus = body.membership_status;
  if (nextStatus !== "approved" && nextStatus !== "rejected") {
    return NextResponse.json({ error: "membership_status must be approved or rejected." }, { status: 400 });
  }

  const { data, error } = await auth.admin
    .from("mobilize_group_members")
    .update({ membership_status: nextStatus })
    .eq("group_id", id)
    .eq("user_id", memberUserId)
    .select("*")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Member row not found." }, { status: 404 });
  return NextResponse.json({ membership: data });
}
