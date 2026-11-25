import { NextResponse } from "next/server";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";
import { MOBILIZE_GROUP_LEADER_TERMS_VERSION } from "@/lib/mobilize/group-leader-terms";

export async function GET() {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;

  const { data: rows, error } = await auth.admin
    .from("mobilize_group_members")
    .select("group_id")
    .eq("user_id", auth.userId)
    .eq("member_role", "leader")
    .eq("membership_status", "approved")
    .is("leader_terms_accepted_at", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const groupIds = [...new Set((rows ?? []).map((r) => r.group_id as string))];
  const nameById = new Map<string, string>();
  if (groupIds.length) {
    const { data: groups } = await auth.admin
      .from("mobilize_groups")
      .select("id, name")
      .in("id", groupIds);
    for (const g of groups ?? []) {
      nameById.set(g.id as string, String(g.name ?? "Group"));
    }
  }

  const pending = groupIds.map((group_id) => ({
    group_id,
    group_name: nameById.get(group_id) ?? "Group",
  }));

  return NextResponse.json({
    pending,
    terms_version: MOBILIZE_GROUP_LEADER_TERMS_VERSION,
  });
}