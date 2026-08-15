import { NextResponse } from "next/server";
import { insertGroupJoinActivity } from "@/lib/community/group-activity-feed";
import {
  canChangeMobilizeGroupMemberRole,
  canManageMobilizeGroupMembers,
} from "@/lib/mobilize/mobilize-content-access";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";

type Ctx = { params: Promise<{ id: string; memberUserId: string }> };

async function loadGroupMemberAccess(
  admin: import("@supabase/supabase-js").SupabaseClient,
  groupId: string,
  userId: string,
  roleNames: string[]
) {
  const { data: group } = await admin
    .from("mobilize_groups")
    .select("created_by, parent_group_id")
    .eq("id", groupId)
    .maybeSingle();
  if (!group) {
    return { allowed: false as const, canChangeRole: false as const, group: null };
  }

  const { data: me } = await admin
    .from("mobilize_group_members")
    .select("member_role, membership_status")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .eq("membership_status", "approved")
    .maybeSingle();

  let isChapterOwner = false;
  if (group.parent_group_id) {
    const { data: chapter } = await admin
      .from("mobilize_groups")
      .select("created_by")
      .eq("id", group.parent_group_id)
      .maybeSingle();
    isChapterOwner = chapter?.created_by === userId;
  }

  const isGroupOwner = group.created_by === userId;
  const allowed = canManageMobilizeGroupMembers({
    roleNames,
    isLeader: me?.member_role === "leader",
    isGroupOwner,
    isChapterOwner,
  });

  return {
    allowed,
    canChangeRole: canChangeMobilizeGroupMemberRole({ roleNames, isGroupOwner }),
    group,
  };
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;
  const { id, memberUserId } = await ctx.params;

  if (memberUserId === auth.userId) {
    return NextResponse.json({ error: "You cannot remove yourself." }, { status: 400 });
  }

  const access = await loadGroupMemberAccess(auth.admin, id, auth.userId, auth.roleNames);
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

  const access = await loadGroupMemberAccess(auth.admin, id, auth.userId, auth.roleNames);
  if (!access.allowed) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const body = (await req.json()) as {
    membership_status?: string;
    member_role?: string;
  };

  if (body.member_role === "leader" || body.member_role === "member") {
    if (!access.canChangeRole) {
      return NextResponse.json(
        { error: "Only admins and the group owner can change group roles." },
        { status: 403 }
      );
    }

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

  const { data: before } = await auth.admin
    .from("mobilize_group_members")
    .select("membership_status")
    .eq("group_id", id)
    .eq("user_id", memberUserId)
    .maybeSingle();

  const { data, error } = await auth.admin
    .from("mobilize_group_members")
    .update({ membership_status: nextStatus })
    .eq("group_id", id)
    .eq("user_id", memberUserId)
    .select("*")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Member row not found." }, { status: 404 });

  if (nextStatus === "approved" && before?.membership_status !== "approved") {
    await insertGroupJoinActivity({
      supabase: auth.admin,
      userId: memberUserId,
      groupId: id,
    });
  }

  return NextResponse.json({ membership: data });
}
