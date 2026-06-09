import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";

type Ctx = { params: Promise<{ id: string }> };

async function canManageEvents(
  admin: ReturnType<typeof createAdminClient>,
  groupId: string,
  userId: string
): Promise<boolean> {
  const { data: g } = await admin
    .from("mobilize_groups")
    .select("event_create_policy")
    .eq("id", groupId)
    .maybeSingle();
  const { data: m } = await admin
    .from("mobilize_group_members")
    .select("member_role, membership_status")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!m || m.membership_status !== "approved") return false;
  if (g?.event_create_policy === "leader_only") return m.member_role === "leader";
  return true;
}

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

  if (!(await isApprovedMember(auth.admin, id, auth.userId))) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const nowIso = new Date().toISOString();
  const { data, error } = await auth.admin
    .from("mobilize_events")
    .select("*")
    .eq("group_id", id)
    .gte("date_time", nowIso)
    .order("date_time", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const events = data ?? [];
  const eventIds = events.map((e: { id: string }) => e.id);
  if (!eventIds.length) {
    return NextResponse.json({ events: [] });
  }

  const { data: rsvpRows } = await auth.admin
    .from("mobilize_event_rsvp")
    .select("event_id, rsvp_status")
    .eq("user_id", auth.userId)
    .in("event_id", eventIds);

  const rsvpByEvent = new Map(
    (rsvpRows ?? []).map((r: { event_id: string; rsvp_status: string }) => [r.event_id, r.rsvp_status])
  );

  return NextResponse.json({
    events: events.map((e: { id: string }) => ({
      ...e,
      my_rsvp: rsvpByEvent.get(e.id) ?? null,
    })),
  });
}

export async function POST(req: Request, ctx: Ctx) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;
  const { id } = await ctx.params;

  if (!(await canManageEvents(auth.admin, id, auth.userId))) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const body = (await req.json()) as {
    title?: string;
    description?: string | null;
    date_time?: string;
    address?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    event_type?: string;
    is_public?: boolean;
  };

  const title = String(body.title ?? "").trim();
  const date_time = String(body.date_time ?? "").trim();
  const event_type = String(body.event_type ?? "").trim();
  if (!title || !date_time || !event_type) {
    return NextResponse.json({ error: "title, date_time, and event_type are required." }, { status: 400 });
  }

  const row = {
    group_id: id,
    title,
    description: body.description ?? null,
    date_time,
    address: body.address ?? null,
    latitude: body.latitude ?? null,
    longitude: body.longitude ?? null,
    event_type,
    is_public: Boolean(body.is_public),
    created_by: auth.userId,
  };

  const { data, error } = await auth.admin.from("mobilize_events").insert(row).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ event: data });
}
