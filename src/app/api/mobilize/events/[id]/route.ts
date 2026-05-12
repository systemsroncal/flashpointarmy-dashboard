import { NextResponse } from "next/server";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;
  const { id } = await ctx.params;

  const { data: event, error } = await auth.admin.from("mobilize_events").select("*").eq("id", id).maybeSingle();
  if (error || !event) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  if (!event.is_public) {
    const { data: m } = await auth.admin
      .from("mobilize_group_members")
      .select("membership_status")
      .eq("group_id", event.group_id)
      .eq("user_id", auth.userId)
      .maybeSingle();
    if (m?.membership_status !== "approved" && event.created_by !== auth.userId) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }
  }

  const { data: rsvp } = await auth.admin
    .from("mobilize_event_rsvp")
    .select("*")
    .eq("event_id", id)
    .eq("user_id", auth.userId)
    .maybeSingle();

  return NextResponse.json({ event, myRsvp: rsvp ?? null });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;
  const { id } = await ctx.params;

  const { data: event } = await auth.admin
    .from("mobilize_events")
    .select("group_id, created_by")
    .eq("id", id)
    .maybeSingle();
  if (!event) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const { data: m } = await auth.admin
    .from("mobilize_group_members")
    .select("member_role, membership_status")
    .eq("group_id", event.group_id)
    .eq("user_id", auth.userId)
    .maybeSingle();

  const approved = m?.membership_status === "approved";
  const isLeaderUser = approved && m.member_role === "leader";
  const isCreator = approved && event.created_by === auth.userId;
  if (!approved || (!isLeaderUser && !isCreator)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const body = (await req.json()) as Record<string, unknown>;
  const patch: Record<string, unknown> = {};
  for (const k of [
    "title",
    "description",
    "date_time",
    "address",
    "latitude",
    "longitude",
    "event_type",
    "is_public",
  ] as const) {
    if (k in body) patch[k] = body[k];
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No valid fields." }, { status: 400 });
  }

  const { data, error } = await auth.admin.from("mobilize_events").update(patch).eq("id", id).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ event: data });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;
  const { id } = await ctx.params;

  const { data: event } = await auth.admin
    .from("mobilize_events")
    .select("group_id, created_by")
    .eq("id", id)
    .maybeSingle();
  if (!event) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const { data: m } = await auth.admin
    .from("mobilize_group_members")
    .select("member_role, membership_status")
    .eq("group_id", event.group_id)
    .eq("user_id", auth.userId)
    .maybeSingle();

  const approved = m?.membership_status === "approved";
  const isLeaderUser = approved && m.member_role === "leader";
  const isCreator = approved && event.created_by === auth.userId;
  if (!approved || (!isLeaderUser && !isCreator)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { error } = await auth.admin.from("mobilize_events").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
