import { NextResponse } from "next/server";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";

type Ctx = { params: Promise<{ id: string; memberUserId: string }> };

async function canManageGroupMembers(
  admin: import("@supabase/supabase-js").SupabaseClient,
  groupId: string,
  userId: string
) {
  const { data: group } = await admin
    .from("mobilize_groups")
    .select("created_by")
    .eq("id", groupId)
    .maybeSingle();
  if (!group) return { allowed: false as const, group: null };

  if (group.created_by === userId) {
    return { allowed: true as const, group };
  }

  const { data: me } = await admin
    .from("mobilize_group_members")
    .select("member_role, membership_status")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .eq("membership_status", "approved")
    .maybeSingle();

  if (me?.member_role === "leader") {
    return { allowed: true as const, group };
  }

  return { allowed: false as const, group };
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;
  const { id, memberUserId } = await ctx.params;

  if (memberUserId === auth.userId) {
    return NextResponse.json({ error: "You cannot remove yourself." }, { status: 400 });
  }

  const access = await canManageGroupMembers(auth.admin, id, auth.userId);
  if (!access.allowed || !access.group) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  if (memberUserId === access.group.created_by) {
    return NextResponse.json({ error: "Cannot remove the primary group owner." }, { status: 400 });
  }

  const { data: target, error: tErr } = await auth.admin
    .from("mobilize_group_members")
    .select("member_role, membership_status")
    .eq("group_id", id)
    .eq("user_id", memberUserId)
    .maybeSingle();

  if (tErr || !target) {
    return NextResponse.json({ error: "Member not found." }, { status: 404 });
  }

  if (target.member_role === "leader" && target.membership_status === "approved") {
    const { data: all } = await auth.admin
      .from("mobilize_group_members")
      .select("user_id, member_role")
      .eq("group_id", id)
      .eq("membership_status", "approved");

    const leaderCount =
      all?.filter((r: { member_role: string }) => r.member_role === "leader").length ?? 0;
    if (leaderCount <= 1) {
      return NextResponse.json(
        { error: "Cannot remove the last group leader. Promote another leader first." },
        { status: 400 }
      );
    }
  }

  const { error } = await auth.admin
    .from("mobilize_group_members")
    .delete()
    .eq("group_id", id)
    .eq("user_id", memberUserId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;
  const { id, memberUserId } = await ctx.params;

  const access = await canManageGroupMembers(auth.admin, id, auth.userId);
  if (!access.allowed) {
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
