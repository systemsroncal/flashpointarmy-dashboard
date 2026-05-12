import { NextResponse } from "next/server";
import { fetchMembership, isApprovedLeader, isApprovedMember } from "@/lib/mobilize/group-access";
import { getMobilizeAuth } from "@/lib/mobilize/guard";
import { createAdminClient } from "@/utils/supabase/admin";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const auth = await getMobilizeAuth();
  if (!auth.ok) return auth.response;
  const { id } = await ctx.params;
  const admin = createAdminClient();
  const { data, error } = await admin.from("mobilize_events").select("*").eq("id", id).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const groupId = String((data as { group_id: string }).group_id);
  const isPublic = Boolean((data as { is_public: boolean }).is_public);
  const member = await isApprovedMember(admin, groupId, auth.userId);
  if (!isPublic && !member) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  // Public Mobilize events are visible to any user who can read the module.

  const { data: rsvp } = await admin
    .from("mobilize_event_rsvp")
    .select("*")
    .eq("event_id", id)
    .eq("user_id", auth.userId)
    .maybeSingle();

  return NextResponse.json({ event: data, rsvp });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await getMobilizeAuth();
  if (!auth.ok) return auth.response;
  if (!auth.flags.canUpdate) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const admin = createAdminClient();
  const { data: existing, error: e0 } = await admin.from("mobilize_events").select("*").eq("id", id).maybeSingle();
  if (e0) return NextResponse.json({ error: e0.message }, { status: 500 });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const groupId = String((existing as { group_id: string }).group_id);
  const createdBy = String((existing as { created_by: string }).created_by);
  const membership = await fetchMembership(admin, groupId, auth.userId);
  const leader = Boolean(membership?.status === "approved" && membership.member_role === "leader");
  const canEdit = leader || createdBy === auth.userId || auth.flags.canDelete;
  if (!canEdit) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.title === "string") patch.title = body.title.trim();
  if ("description" in body) patch.description = body.description == null ? null : String(body.description);
  if (typeof body.starts_at === "string") patch.starts_at = body.starts_at;
  if (typeof body.address_line === "string") patch.address_line = body.address_line.trim() || null;
  if (typeof body.event_type === "string") patch.event_type = body.event_type.trim();
  if (typeof body.is_public === "boolean") patch.is_public = body.is_public;
  if ("latitude" in body && "longitude" in body) {
    const lat = body.latitude == null ? null : Number(body.latitude);
    const lng = body.longitude == null ? null : Number(body.longitude);
    if (
      (lat != null || lng != null) &&
      (!Number.isFinite(lat as number) || !Number.isFinite(lng as number))
    ) {
      return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
    }
    patch.latitude = lat;
    patch.longitude = lng;
  }

  const { data, error } = await admin.from("mobilize_events").update(patch).eq("id", id).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ event: data });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await getMobilizeAuth();
  if (!auth.ok) return auth.response;
  if (!auth.flags.canDelete && !auth.flags.canUpdate) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const admin = createAdminClient();
  const { data: existing } = await admin.from("mobilize_events").select("group_id, created_by").eq("id", id).maybeSingle();
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const groupId = String((existing as { group_id: string }).group_id);
  const createdBy = String((existing as { created_by: string }).created_by);
  const leader = await isApprovedLeader(admin, groupId, auth.userId);
  const isCreator = createdBy === auth.userId;
  if (!isCreator && !leader && !auth.flags.canDelete) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await admin.from("mobilize_events").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
