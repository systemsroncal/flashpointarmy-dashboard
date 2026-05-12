import { NextResponse } from "next/server";
import { enrichMobilizeGroupsBrowse } from "@/lib/mobilize/enrich-groups-browse";
import { boundingBoxForRadiusKm, haversineKm } from "@/lib/mobilize/haversine";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";

type GroupRow = {
  id: string;
  name: string;
  group_type: string;
  description: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  visibility: string;
  cover_image_url?: string | null;
  wall_post_policy?: string;
  created_at: string;
  created_by?: string;
};

export async function GET(req: Request) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;
  const url = new URL(req.url);
  const lat = Number(url.searchParams.get("lat"));
  const lng = Number(url.searchParams.get("lng"));
  const radiusKm = Math.min(500, Math.max(1, Number(url.searchParams.get("radiusKm") || 10)));
  const types = (url.searchParams.get("types") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const q = (url.searchParams.get("q") || "").trim().toLowerCase();

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "lat and lng query params are required." }, { status: 400 });
  }

  const box = boundingBoxForRadiusKm(lat, lng, radiusKm);
  let query = auth.admin
    .from("mobilize_groups")
    .select(
      "id, name, group_type, description, address, latitude, longitude, visibility, cover_image_url, wall_post_policy, created_at, created_by"
    )
    .eq("visibility", "public")
    .not("latitude", "is", null)
    .not("longitude", "is", null)
    .gte("latitude", box.minLat)
    .lte("latitude", box.maxLat)
    .gte("longitude", box.minLng)
    .lte("longitude", box.maxLng);

  if (types.length) {
    query = query.in("group_type", types);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let rows = (data ?? []) as GroupRow[];
  if (q) {
    rows = rows.filter((r) => r.name.toLowerCase().includes(q));
  }

  const withDistance = rows
    .map((r) => ({
      ...r,
      distance_km: haversineKm(lat, lng, r.latitude as number, r.longitude as number),
    }))
    .filter((r) => r.distance_km <= radiusKm);

  const byId = new Map<string, GroupRow & { distance_km: number }>();
  for (const r of withDistance) byId.set(r.id, r);

  const { data: owned, error: ownErr } = await auth.admin
    .from("mobilize_groups")
    .select(
      "id, name, group_type, description, address, latitude, longitude, visibility, cover_image_url, wall_post_policy, created_at, created_by"
    )
    .eq("created_by", auth.userId)
    .not("latitude", "is", null)
    .not("longitude", "is", null);

  if (!ownErr && owned?.length) {
    for (const r of owned as GroupRow[]) {
      if (byId.has(r.id)) continue;
      if (types.length && !types.includes(r.group_type)) continue;
      if (q && !r.name.toLowerCase().includes(q)) continue;
      const distance_km = haversineKm(lat, lng, r.latitude as number, r.longitude as number);
      byId.set(r.id, { ...r, distance_km });
    }
  }

  const merged = [...byId.values()].sort((a, b) => a.distance_km - b.distance_km);

  const extras = await enrichMobilizeGroupsBrowse(
    auth.admin,
    merged.map((g) => ({ id: g.id })),
    auth.userId
  );
  const groups = merged.map((g) => {
    const e = extras.get(g.id);
    return {
      ...g,
      member_count: e?.member_count ?? 0,
      leader_names: e?.leader_names ?? [],
      my_membership_status: e?.my_membership_status ?? null,
    };
  });

  return NextResponse.json({ groups });
}
