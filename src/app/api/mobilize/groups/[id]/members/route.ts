import { NextResponse } from "next/server";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;
  const { id } = await ctx.params;

  const { data: me } = await auth.admin
    .from("mobilize_group_members")
    .select("member_role, membership_status")
    .eq("group_id", id)
    .eq("user_id", auth.userId)
    .eq("membership_status", "approved")
    .maybeSingle();

  if (!me || me.member_role !== "leader") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { data: users, error } = await auth.admin
    .from("mobilize_group_members")
    .select("id, user_id, member_role, membership_status, created_at")
    .eq("group_id", id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ members: users ?? [] });
}
