import { NextResponse } from "next/server";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";

export async function GET() {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;

  const { data: leaderRows, error: lErr } = await auth.admin
    .from("mobilize_group_members")
    .select("group_id")
    .eq("user_id", auth.userId)
    .eq("member_role", "leader")
    .eq("membership_status", "approved");

  if (lErr) {
    return NextResponse.json({ error: lErr.message }, { status: 500 });
  }

  const leaderGroupIds = (leaderRows ?? []).map((r: { group_id: string }) => r.group_id);
  let pendingJoins: { id: string; group_id: string; user_id: string; created_at: string }[] = [];
  if (leaderGroupIds.length) {
    const { data: pending, error: pErr } = await auth.admin
      .from("mobilize_group_members")
      .select("id, group_id, user_id, created_at")
      .in("group_id", leaderGroupIds)
      .eq("membership_status", "pending");
    if (!pErr && pending) pendingJoins = pending;
  }

  const { data: myGroups, error: gErr } = await auth.admin
    .from("mobilize_group_members")
    .select("group_id")
    .eq("user_id", auth.userId)
    .eq("membership_status", "approved");

  if (gErr) {
    return NextResponse.json({ error: gErr.message }, { status: 500 });
  }

  const myGroupIds = (myGroups ?? []).map((r: { group_id: string }) => r.group_id);
  let recentEvents: { id: string; group_id: string; title: string; date_time: string; created_at: string }[] = [];
  if (myGroupIds.length) {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: ev, error: eErr } = await auth.admin
      .from("mobilize_events")
      .select("id, group_id, title, date_time, created_at")
      .in("group_id", myGroupIds)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(30);
    if (!eErr && ev) recentEvents = ev as typeof recentEvents;
  }

  return NextResponse.json({
    pendingJoinRequests: pendingJoins,
    recentGroupEvents: recentEvents,
  });
}
