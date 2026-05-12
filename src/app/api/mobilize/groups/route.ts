import { NextResponse } from "next/server";
import { getMobilizeAuth } from "@/lib/mobilize/guard";
import { createAdminClient } from "@/utils/supabase/admin";

export async function GET(req: Request) {
  const auth = await getMobilizeAuth();
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const typesRaw = url.searchParams.get("types") ?? "";
  const types = typesRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const q = (url.searchParams.get("q") ?? "").trim();

  const admin = createAdminClient();
  let query = admin
    .from("mobilize_groups")
    .select(
      "id, name, group_type, description, address_line, latitude, longitude, visibility, created_by, created_at, only_leaders_can_create_events"
    )
    .eq("visibility", "public")
    .not("latitude", "is", null)
    .not("longitude", "is", null)
    .order("created_at", { ascending: false })
    .limit(500);

  if (types.length > 0) {
    query = query.in("group_type", types);
  }
  if (q) {
    query = query.ilike("name", `%${q}%`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ groups: data ?? [] });
}

export async function POST(req: Request) {
  const auth = await getMobilizeAuth();
  if (!auth.ok) return auth.response;
  if (!auth.flags.canCreate) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  const group_type = String(body.group_type ?? "").trim();
  const description = body.description == null ? null : String(body.description);
  const address_line = String(body.address_line ?? "").trim();
  const visibility = body.visibility === "private" ? "private" : "public";
  const only_leaders_can_create_events = Boolean(body.only_leaders_can_create_events);
  const latitude = body.latitude == null ? null : Number(body.latitude);
  const longitude = body.longitude == null ? null : Number(body.longitude);

  if (name.length < 2 || !group_type) {
    return NextResponse.json({ error: "name and group_type are required" }, { status: 400 });
  }
  if (
    (latitude != null || longitude != null) &&
    (!Number.isFinite(latitude as number) || !Number.isFinite(longitude as number))
  ) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: group, error: gErr } = await admin
    .from("mobilize_groups")
    .insert({
      name,
      group_type,
      description,
      address_line: address_line || null,
      latitude,
      longitude,
      visibility,
      created_by: auth.userId,
      only_leaders_can_create_events,
      geocoded_at: latitude != null ? new Date().toISOString() : null,
    })
    .select("*")
    .single();

  if (gErr || !group) {
    return NextResponse.json({ error: gErr?.message ?? "Insert failed" }, { status: 500 });
  }

  const { error: mErr } = await admin.from("mobilize_group_members").insert({
    group_id: group.id,
    user_id: auth.userId,
    member_role: "leader",
    status: "approved",
  });
  if (mErr) {
    await admin.from("mobilize_groups").delete().eq("id", group.id);
    return NextResponse.json({ error: mErr.message }, { status: 500 });
  }

  return NextResponse.json({ group });
}
