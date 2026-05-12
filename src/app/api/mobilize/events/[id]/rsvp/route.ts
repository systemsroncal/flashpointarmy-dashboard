import { NextResponse } from "next/server";
import { isApprovedMember } from "@/lib/mobilize/group-access";
import { getMobilizeAuth } from "@/lib/mobilize/guard";
import { createAdminClient } from "@/utils/supabase/admin";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const auth = await getMobilizeAuth();
  if (!auth.ok) return auth.response;
  if (!auth.flags.canCreate) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const admin = createAdminClient();
  const { data: ev, error: e0 } = await admin.from("mobilize_events").select("group_id").eq("id", id).maybeSingle();
  if (e0) return NextResponse.json({ error: e0.message }, { status: 500 });
  if (!ev) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const groupId = String((ev as { group_id: string }).group_id);
  const ok = await isApprovedMember(admin, groupId, auth.userId);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: { status?: string };
  try {
    body = (await req.json()) as { status?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const status = body.status === "declined" || body.status === "maybe" || body.status === "going" ? body.status : null;
  if (!status) {
    return NextResponse.json({ error: "status must be going, maybe, or declined" }, { status: 400 });
  }

  const { error: delErr } = await admin
    .from("mobilize_event_rsvp")
    .delete()
    .eq("event_id", id)
    .eq("user_id", auth.userId);
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

  const { data, error } = await admin
    .from("mobilize_event_rsvp")
    .insert({
      event_id: id,
      user_id: auth.userId,
      status,
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rsvp: data });
}
