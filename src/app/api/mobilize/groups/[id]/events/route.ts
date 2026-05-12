import { NextResponse } from "next/server";
import { fetchMembership, isApprovedMember, loadGroup } from "@/lib/mobilize/group-access";
import { getMobilizeAuth } from "@/lib/mobilize/guard";
import { createAdminClient } from "@/utils/supabase/admin";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const auth = await getMobilizeAuth();
  if (!auth.ok) return auth.response;
  const { id } = await ctx.params;
  const admin = createAdminClient();
  const ok = await isApprovedMember(admin, id, auth.userId);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await admin
    .from("mobilize_events")
    .select("*")
    .eq("group_id", id)
    .order("starts_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ events: data ?? [] });
}

export async function POST(req: Request, ctx: Ctx) {
  const auth = await getMobilizeAuth();
  if (!auth.ok) return auth.response;
  if (!auth.flags.canCreate) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const admin = createAdminClient();
  const group = await loadGroup(admin, id);
  if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const membership = await fetchMembership(admin, id, auth.userId);
  const approved = membership?.status === "approved";
  if (!approved) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const onlyLeaders = Boolean(group.only_leaders_can_create_events);
  const isLeader = membership?.member_role === "leader";
  if (onlyLeaders && !isLeader) {
    return NextResponse.json({ error: "Only leaders can create events for this group" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const title = String(body.title ?? "").trim();
  const description = body.description == null ? null : String(body.description);
  const starts_at = String(body.starts_at ?? "");
  const address_line = String(body.address_line ?? "").trim() || null;
  const event_type = String(body.event_type ?? "").trim() || "meeting";
  const is_public = Boolean(body.is_public);
  const latitude = body.latitude == null ? null : Number(body.latitude);
  const longitude = body.longitude == null ? null : Number(body.longitude);

  if (title.length < 2 || !starts_at) {
    return NextResponse.json({ error: "title and starts_at are required" }, { status: 400 });
  }
  if (
    (latitude != null || longitude != null) &&
    (!Number.isFinite(latitude as number) || !Number.isFinite(longitude as number))
  ) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  const { data, error } = await admin
    .from("mobilize_events")
    .insert({
      group_id: id,
      title,
      description,
      starts_at,
      address_line,
      latitude,
      longitude,
      event_type,
      is_public,
      created_by: auth.userId,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ event: data });
}
