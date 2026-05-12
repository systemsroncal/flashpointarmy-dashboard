import { NextResponse } from "next/server";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";

export async function GET(req: Request) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;
  const url = new URL(req.url);
  const visibility = (url.searchParams.get("visibility") || "public").toLowerCase();
  const q = (url.searchParams.get("q") || "").trim();
  const types = (url.searchParams.get("types") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  let query = auth.admin
    .from("mobilize_groups")
    .select(
      "id, name, group_type, description, address, latitude, longitude, visibility, event_create_policy, created_by, created_at"
    )
    .order("created_at", { ascending: false });

  if (visibility === "public" || visibility === "private") {
    query = query.eq("visibility", visibility);
  }

  if (q) {
    query = query.ilike("name", `%${q}%`);
  }
  if (types.length) {
    query = query.in("group_type", types);
  }

  const { data, error } = await query.limit(200);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ groups: data ?? [] });
}

export async function POST(req: Request) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;

  const body = (await req.json()) as {
    name?: string;
    group_type?: string;
    description?: string | null;
    address?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    visibility?: string;
    event_create_policy?: string;
  };

  const name = String(body.name ?? "").trim();
  const group_type = String(body.group_type ?? "").trim();
  if (!name || !group_type) {
    return NextResponse.json({ error: "name and group_type are required." }, { status: 400 });
  }

  const visibility =
    body.visibility === "private" ? "private" : "public";
  const event_create_policy =
    body.event_create_policy === "leader_only" ? "leader_only" : "any_member";

  const row = {
    name,
    group_type,
    description: body.description ?? null,
    address: body.address ?? null,
    latitude: body.latitude ?? null,
    longitude: body.longitude ?? null,
    visibility,
    event_create_policy,
    created_by: auth.userId,
  };

  const { data, error } = await auth.admin.from("mobilize_groups").insert(row).select("*").single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ group: data });
}
