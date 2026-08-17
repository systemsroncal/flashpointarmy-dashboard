import type { SupabaseClient } from "@supabase/supabase-js";
import { insertGroupJoinActivity } from "@/lib/community/group-activity-feed";
import {
  enrollmentAcceptsNewMembers,
  groupJoinAutoApproves,
} from "@/lib/mobilize/chapter-subgroup";
import { applyMobilizeAutoCloseInactive } from "@/lib/mobilize/apply-auto-close";

export type JoinGroupMembershipResult =
  | {
      ok: true;
      membership: Record<string, unknown>;
      alreadyMember: boolean;
      alreadyPending: boolean;
    }
  | { ok: false; error: string; status: number };

/**
 * Join (or request to join) a Mobilize subgroup as `member`.
 * Shared by authenticated join API and public register-with-otp auto-join.
 */
export async function joinMobilizeGroupAsMember(
  admin: SupabaseClient,
  opts: { groupId: string; userId: string }
): Promise<JoinGroupMembershipResult> {
  const { groupId, userId } = opts;

  await applyMobilizeAutoCloseInactive(admin, [groupId]);

  const { data: group, error: gErr } = await admin
    .from("mobilize_groups")
    .select("id, visibility, parent_group_id, enrollment_mode, publish_status")
    .eq("id", groupId)
    .maybeSingle();

  if (gErr || !group) {
    return { ok: false, error: "Group not found.", status: 404 };
  }

  if (group.parent_group_id == null) {
    return {
      ok: false,
      error: "You join Groups under a Chapter, not the Chapter itself.",
      status: 400,
    };
  }

  const enrollmentMode = String(group.enrollment_mode ?? "request_to_join");
  if (!enrollmentAcceptsNewMembers(enrollmentMode)) {
    return {
      ok: false,
      error: "This group is not currently accepting new members.",
      status: 400,
    };
  }

  const membership_status = groupJoinAutoApproves(group) ? "approved" : "pending";

  const { data: existing } = await admin
    .from("mobilize_group_members")
    .select("id, membership_status")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    if (existing.membership_status === "approved") {
      return {
        ok: true,
        membership: existing as Record<string, unknown>,
        alreadyMember: true,
        alreadyPending: false,
      };
    }
    if (existing.membership_status === "pending" && membership_status === "pending") {
      return {
        ok: true,
        membership: existing as Record<string, unknown>,
        alreadyMember: false,
        alreadyPending: true,
      };
    }
    if (group.publish_status === "draft") {
      return { ok: false, error: "This group is not available.", status: 404 };
    }
    const { data, error } = await admin
      .from("mobilize_group_members")
      .update({ membership_status, member_role: "member" })
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error) return { ok: false, error: error.message, status: 500 };
    await admin
      .from("mobilize_groups")
      .update({ last_activity_at: new Date().toISOString() })
      .eq("id", groupId);
    if (membership_status === "approved") {
      await insertGroupJoinActivity({
        supabase: admin,
        userId,
        groupId,
      });
    }
    return {
      ok: true,
      membership: (data ?? {}) as Record<string, unknown>,
      alreadyMember: false,
      alreadyPending: membership_status === "pending",
    };
  }

  if (group.publish_status === "draft") {
    return { ok: false, error: "This group is not available.", status: 404 };
  }

  const { data, error } = await admin
    .from("mobilize_group_members")
    .insert({
      group_id: groupId,
      user_id: userId,
      member_role: "member",
      membership_status,
    })
    .select("*")
    .single();

  if (error) {
    return { ok: false, error: error.message, status: 500 };
  }

  await admin
    .from("mobilize_groups")
    .update({ last_activity_at: new Date().toISOString() })
    .eq("id", groupId);

  if (membership_status === "approved") {
    await insertGroupJoinActivity({
      supabase: admin,
      userId,
      groupId,
    });
  }

  return {
    ok: true,
    membership: (data ?? {}) as Record<string, unknown>,
    alreadyMember: false,
    alreadyPending: membership_status === "pending",
  };
}

/** When a group becomes listed/public (or open signup), pending requests become members. */
export async function approvePendingMembersForOpenGroup(
  admin: SupabaseClient,
  group: { id: string; visibility?: string | null; enrollment_mode?: string | null }
): Promise<void> {
  if (!groupJoinAutoApproves(group)) return;
  await admin
    .from("mobilize_group_members")
    .update({ membership_status: "approved" })
    .eq("group_id", group.id)
    .eq("membership_status", "pending");
}
