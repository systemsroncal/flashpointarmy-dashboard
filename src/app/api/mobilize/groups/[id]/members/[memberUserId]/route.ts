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

  const body = (await req.json()) as {
    membership_status?: string;
    member_role?: string;
  };

  if (body.member_role === "leader" || body.member_role === "member") {
    const { data: target, error: tErr } = await auth.admin
      .from("mobilize_group_members")
      .select("member_role, membership_status")
      .eq("group_id", id)
      .eq("user_id", memberUserId)
      .maybeSingle();

    if (tErr || !target) {
      return NextResponse.json({ error: "Member row not found." }, { status: 404 });
    }

    if (target.membership_status !== "approved") {
      return NextResponse.json({ error: "Can only change role for approved members." }, { status: 400 });
    }

    if (body.member_role === "member" && target.member_role === "leader") {
      const { data: all } = await auth.admin
        .from("mobilize_group_members")
        .select("user_id, member_role")
        .eq("group_id", id)
        .eq("membership_status", "approved");

      const leaderCount =
        all?.filter((r: { member_role: string }) => r.member_role === "leader").length ?? 0;
      if (leaderCount <= 1) {
        return NextResponse.json(
          { error: "Cannot remove the last leader. Promote another leader first." },
          { status: 400 }
        );
      }
    }

    const { data, error } = await auth.admin
      .from("mobilize_group_members")
      .update({ member_role: body.member_role })
      .eq("group_id", id)
      .eq("user_id", memberUserId)
      .select("*")
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Member row not found." }, { status: 404 });
    return NextResponse.json({ membership: data });
  }

  const nextStatus = body.membership_status;
  if (nextStatus !== "approved" && nextStatus !== "rejected") {
    return NextResponse.json(
      { error: "membership_status must be approved or rejected, or send member_role." },
      { status: 400 }
    );
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
