import { NextResponse } from "next/server";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";
import { createAdminClient } from "@/utils/supabase/admin";

type Ctx = { params: Promise<{ id: string }> };

async function isApprovedMember(
  admin: ReturnType<typeof createAdminClient>,
  groupId: string,
  userId: string
) {
  const { data } = await admin
    .from("mobilize_group_members")
    .select("membership_status")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .maybeSingle();
  return data?.membership_status === "approved";
}

export async function GET(_req: Request, ctx: Ctx) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;
  const { id } = await ctx.params;

  const { data: mine, error } = await auth.admin
    .from("mobilize_event_rsvp")
    .select("user_id, rsvp_status, updated_at")
    .eq("event_id", id)
    .eq("user_id", auth.userId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rsvp: mine });
}

export async function POST(req: Request, ctx: Ctx) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;
  const { id } = await ctx.params;

  const { data: event } = await auth.admin.from("mobilize_events").select("group_id").eq("id", id).maybeSingle();
  if (!event) return NextResponse.json({ error: "Not found." }, { status: 404 });

  if (!(await isApprovedMember(auth.admin, event.group_id, auth.userId))) {
    return NextResponse.json({ error: "Only group members may RSVP." }, { status: 403 });
  }

  const body = (await req.json()) as { rsvp_status?: string };
  const rsvp_status = body.rsvp_status;
  if (rsvp_status !== "yes" && rsvp_status !== "maybe" && rsvp_status !== "no") {
    return NextResponse.json({ error: "rsvp_status must be yes, maybe, or no." }, { status: 400 });
  }

  const { data, error } = await auth.admin
    .from("mobilize_event_rsvp")
    .upsert(
      { event_id: id, user_id: auth.userId, rsvp_status, updated_at: new Date().toISOString() },
      { onConflict: "event_id,user_id" }
    )
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rsvp: data });
}
