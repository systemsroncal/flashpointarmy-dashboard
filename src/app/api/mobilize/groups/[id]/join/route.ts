import { NextResponse } from "next/server";
import {
  enrollmentAcceptsNewMembers,
  enrollmentAutoApproves,
} from "@/lib/mobilize/chapter-subgroup";
import { applyMobilizeAutoCloseInactive } from "@/lib/mobilize/apply-auto-close";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;
  const { id } = await ctx.params;

  await applyMobilizeAutoCloseInactive(auth.admin, [id]);

  const { data: group, error: gErr } = await auth.admin
    .from("mobilize_groups")
    .select("id, visibility, parent_group_id, enrollment_mode")
    .eq("id", id)
    .maybeSingle();

  if (gErr || !group) {
    return NextResponse.json({ error: "Group not found." }, { status: 404 });
  }

  if (group.parent_group_id == null) {
    return NextResponse.json(
      { error: "You join Groups under a Chapter, not the Chapter itself." },
      { status: 400 }
    );
  }

  const enrollmentMode = String(group.enrollment_mode ?? "request_to_join");
  if (!enrollmentAcceptsNewMembers(enrollmentMode)) {
    return NextResponse.json(
      { error: "This group is not currently accepting new members." },
      { status: 400 }
    );
  }

  const membership_status = enrollmentAutoApproves(enrollmentMode) ? "approved" : "pending";

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
    if (existing.membership_status === "pending" && membership_status === "pending") {
      return NextResponse.json({ error: "Request already pending." }, { status: 400 });
    }
    const { data, error } = await auth.admin
      .from("mobilize_group_members")
      .update({ membership_status, member_role: "member" })
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await auth.admin
      .from("mobilize_groups")
      .update({ last_activity_at: new Date().toISOString() })
      .eq("id", id);
    return NextResponse.json({ membership: data });
  }

  const { data, error } = await auth.admin
    .from("mobilize_group_members")
    .insert({
      group_id: id,
      user_id: auth.userId,
      member_role: "member",
      membership_status,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await auth.admin
    .from("mobilize_groups")
    .update({ last_activity_at: new Date().toISOString() })
    .eq("id", id);

  return NextResponse.json({ membership: data });
}
