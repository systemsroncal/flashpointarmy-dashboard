import { NextResponse } from "next/server";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";

type Ctx = { params: Promise<{ userId: string }> };

/**
 * Count of groups a user belongs to: approved member/leader rows in
 * mobilize_group_members plus any groups they created (owner). Computed with the
 * service-role admin so it is authoritative regardless of RLS edge cases.
 */
export async function GET(_req: Request, ctx: Ctx) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;
  const { userId } = await ctx.params;

  const [{ data: memberRows, error: mErr }, { data: ownedRows, error: oErr }] = await Promise.all([
    auth.admin
      .from("mobilize_group_members")
      .select("group_id")
      .eq("user_id", userId)
      .eq("membership_status", "approved"),
    auth.admin.from("mobilize_groups").select("id").eq("created_by", userId),
  ]);

  if (mErr) return NextResponse.json({ error: mErr.message }, { status: 500 });
  if (oErr) return NextResponse.json({ error: oErr.message }, { status: 500 });

  const ids = new Set<string>();
  for (const r of memberRows ?? []) {
    if (r.group_id) ids.add(String(r.group_id));
  }
  for (const r of ownedRows ?? []) {
    if (r.id) ids.add(String(r.id));
  }

  return NextResponse.json({ count: ids.size });
}
