import { NextResponse } from "next/server";
import { getMobilizeAuth } from "@/lib/mobilize/guard";
import { createAdminClient } from "@/utils/supabase/admin";

export async function GET() {
  const auth = await getMobilizeAuth();
  if (!auth.ok) return auth.response;

  const admin = createAdminClient();

  const { data: led } = await admin
    .from("mobilize_group_members")
    .select("group_id")
    .eq("user_id", auth.userId)
    .eq("member_role", "leader")
    .eq("status", "approved");

  const ledGroupIds = [...new Set((led ?? []).map((r) => String((r as { group_id: string }).group_id)))];

  let pendingJoins: unknown[] = [];
  if (ledGroupIds.length) {
    const { data: pend } = await admin
      .from("mobilize_group_members")
      .select("id, group_id, user_id, created_at, mobilize_groups(name)")
      .eq("status", "pending")
      .in("group_id", ledGroupIds)
      .order("created_at", { ascending: false })
      .limit(50);
    pendingJoins = pend ?? [];
  }

  const { data: memberships } = await admin
    .from("mobilize_group_members")
    .select("group_id")
    .eq("user_id", auth.userId)
    .eq("status", "approved");
  const myGroupIds = [...new Set((memberships ?? []).map((m) => String((m as { group_id: string }).group_id)))];

  const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
  let newGroupEvents: unknown[] = [];
  if (myGroupIds.length) {
    const { data: evs } = await admin
      .from("mobilize_events")
      .select("id, group_id, title, starts_at, created_at, created_by, mobilize_groups(name)")
      .in("group_id", myGroupIds)
      .gte("created_at", since)
      .neq("created_by", auth.userId)
      .order("created_at", { ascending: false })
      .limit(30);
    newGroupEvents = evs ?? [];
  }

  return NextResponse.json({
    pendingJoinRequests: pendingJoins,
    recentGroupEvents: newGroupEvents,
  });
}
