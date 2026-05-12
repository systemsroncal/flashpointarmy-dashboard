import { NextResponse } from "next/server";
import { fetchMembership, isApprovedLeader, loadGroup } from "@/lib/mobilize/group-access";
import { getMobilizeAuth } from "@/lib/mobilize/guard";
import { createAdminClient } from "@/utils/supabase/admin";

type Ctx = { params: Promise<{ id: string }> };

function canViewGroup(
  group: Record<string, unknown>,
  membership: Awaited<ReturnType<typeof fetchMembership>>
) {
  if (group.visibility === "public") return true;
  if (group.created_by && group.created_by === membership?.user_id) return true;
  if (membership?.status === "approved") return true;
  return false;
}

export async function GET(_req: Request, ctx: Ctx) {
  const auth = await getMobilizeAuth();
  if (!auth.ok) return auth.response;
  const { id } = await ctx.params;
  const admin = createAdminClient();
  const group = await loadGroup(admin, id);
  if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const membership = await fetchMembership(admin, id, auth.userId);
  if (!canViewGroup(group, membership)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ group, membership });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await getMobilizeAuth();
  if (!auth.ok) return auth.response;
  if (!auth.flags.canUpdate) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const admin = createAdminClient();
  const group = await loadGroup(admin, id);
  if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const leader = await isApprovedLeader(admin, id, auth.userId);
  const isCreator = String(group.created_by) === auth.userId;
  if (!leader && !isCreator) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.name === "string") patch.name = body.name.trim();
  if (typeof body.group_type === "string") patch.group_type = body.group_type.trim();
  if ("description" in body) patch.description = body.description == null ? null : String(body.description);
  if (typeof body.address_line === "string") patch.address_line = body.address_line.trim() || null;
  if (body.visibility === "public" || body.visibility === "private") patch.visibility = body.visibility;
  if (typeof body.only_leaders_can_create_events === "boolean") {
    patch.only_leaders_can_create_events = body.only_leaders_can_create_events;
  }
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
    patch.geocoded_at = lat != null ? new Date().toISOString() : null;
  }

  const { data, error } = await admin.from("mobilize_groups").update(patch).eq("id", id).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ group: data });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await getMobilizeAuth();
  if (!auth.ok) return auth.response;
  const { id } = await ctx.params;
  const admin = createAdminClient();
  const group = await loadGroup(admin, id);
  if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isCreator = String(group.created_by) === auth.userId;
  if (!isCreator && !auth.flags.canDelete) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await admin.from("mobilize_groups").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
