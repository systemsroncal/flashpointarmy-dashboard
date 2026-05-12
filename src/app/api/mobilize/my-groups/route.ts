import { NextResponse } from "next/server";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";

export async function GET() {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;

  const { data: memberships, error: mErr } = await auth.admin
    .from("mobilize_group_members")
    .select("group_id, member_role, membership_status, created_at")
    .eq("user_id", auth.userId)
    .order("created_at", { ascending: false });

  if (mErr) {
    return NextResponse.json({ error: mErr.message }, { status: 500 });
  }

  const ids = (memberships ?? []).map((m: { group_id: string }) => m.group_id);
  if (!ids.length) {
    return NextResponse.json({ groups: [] });
  }

  const { data: groupRows, error: gErr } = await auth.admin
    .from("mobilize_groups")
    .select("*")
    .in("id", ids);

  if (gErr) {
    return NextResponse.json({ error: gErr.message }, { status: 500 });
  }

  const byId = new Map((groupRows ?? []).map((g: { id: string }) => [g.id, g]));
  const groups = (memberships ?? []).map((m: Record<string, unknown>) => {
    const g = byId.get(String(m.group_id));
    return g ? { ...g, membership: m } : null;
  }).filter(Boolean);

  return NextResponse.json({ groups });
}
