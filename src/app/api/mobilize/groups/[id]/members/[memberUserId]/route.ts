import { NextResponse } from "next/server";
import { fetchMembership, isApprovedLeader } from "@/lib/mobilize/group-access";
import { getMobilizeAuth } from "@/lib/mobilize/guard";
import { createAdminClient } from "@/utils/supabase/admin";

type Ctx = { params: Promise<{ id: string; memberUserId: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await getMobilizeAuth();
  if (!auth.ok) return auth.response;
  if (!auth.flags.canUpdate) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id, memberUserId } = await ctx.params;
  const admin = createAdminClient();
  const leader = await isApprovedLeader(admin, id, auth.userId);
  if (!leader) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { status?: string };
  try {
    body = (await req.json()) as { status?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (body.status !== "approved" && body.status !== "rejected") {
    return NextResponse.json({ error: "status must be approved or rejected" }, { status: 400 });
  }

  const target = await fetchMembership(admin, id, memberUserId);
  if (!target || target.status !== "pending") {
    return NextResponse.json({ error: "No pending membership" }, { status: 404 });
  }

  const { data, error } = await admin
    .from("mobilize_group_members")
    .update({
      status: body.status,
      decided_at: new Date().toISOString(),
      decided_by: auth.userId,
    })
    .eq("id", target.id)
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ membership: data });
}
