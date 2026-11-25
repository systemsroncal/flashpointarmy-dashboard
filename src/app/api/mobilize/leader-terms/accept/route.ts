import { NextResponse } from "next/server";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";

export async function POST(req: Request) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;

  let groupIds: string[] | undefined;
  try {
    const body = (await req.json()) as { group_ids?: string[] };
    if (Array.isArray(body.group_ids) && body.group_ids.length) {
      groupIds = body.group_ids.filter((id) => typeof id === "string" && id.trim()).map((id) => id.trim());
    }
  } catch {
    groupIds = undefined;
  }

  const now = new Date().toISOString();
  let query = auth.admin
    .from("mobilize_group_members")
    .update({ leader_terms_accepted_at: now })
    .eq("user_id", auth.userId)
    .eq("member_role", "leader")
    .eq("membership_status", "approved")
    .is("leader_terms_accepted_at", null);

  if (groupIds?.length) {
    query = query.in("group_id", groupIds);
  }

  const { data, error } = await query.select("group_id");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, accepted_count: data?.length ?? 0 });
}