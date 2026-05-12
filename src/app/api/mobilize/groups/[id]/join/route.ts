import { NextResponse } from "next/server";
import { fetchMembership, loadGroup } from "@/lib/mobilize/group-access";
import { getMobilizeAuth } from "@/lib/mobilize/guard";
import { createAdminClient } from "@/utils/supabase/admin";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  const auth = await getMobilizeAuth();
  if (!auth.ok) return auth.response;
  if (!auth.flags.canCreate) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const admin = createAdminClient();
  const group = await loadGroup(admin, id);
  if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (String(group.visibility) !== "public") {
    return NextResponse.json({ error: "Join requests are only for public groups" }, { status: 400 });
  }

  const existing = await fetchMembership(admin, id, auth.userId);
  if (existing?.status === "approved") {
    return NextResponse.json({ membership: existing, message: "Already a member" });
  }
  if (existing?.status === "pending") {
    return NextResponse.json({ membership: existing, message: "Request pending" });
  }
  if (existing?.status === "rejected") {
    const { data, error } = await admin
      .from("mobilize_group_members")
      .update({
        status: "pending",
        decided_at: null,
        decided_by: null,
        member_role: "member",
      })
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ membership: data });
  }

  const { data, error } = await admin
    .from("mobilize_group_members")
    .insert({
      group_id: id,
      user_id: auth.userId,
      member_role: "member",
      status: "pending",
    })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ membership: data });
}
