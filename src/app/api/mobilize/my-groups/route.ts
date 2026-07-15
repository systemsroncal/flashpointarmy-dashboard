import { NextResponse } from "next/server";
import { enrichMobilizeGroupsBrowse } from "@/lib/mobilize/enrich-groups-browse";
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
    .in("id", ids)
    .not("parent_group_id", "is", null);

  if (gErr) {
    return NextResponse.json({ error: gErr.message }, { status: 500 });
  }

  const byId = new Map((groupRows ?? []).map((g: { id: string }) => [g.id, g]));

  const extras = await enrichMobilizeGroupsBrowse(
    auth.admin,
    (groupRows ?? []).map((g: { id: string }) => ({ id: g.id })),
    auth.userId
  );

  const groups = (memberships ?? [])
    .map((m: Record<string, unknown>) => {
      const g = byId.get(String(m.group_id)) as Record<string, unknown> & { id: string } | undefined;
      if (!g) return null;
      const e = extras.get(g.id);
      return {
        ...g,
        membership: m,
        member_count: e?.member_count ?? 0,
        leader_names: e?.leader_names ?? [],
        leaders: e?.leaders ?? [],
        upcoming_activity_count: e?.upcoming_activity_count ?? 0,
        my_membership_status: e?.my_membership_status ?? null,
      };
    })
    .filter(Boolean);

  return NextResponse.json({ groups });
}
