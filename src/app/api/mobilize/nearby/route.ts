import { NextResponse } from "next/server";
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
  created_at: string;
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
      "id, name, group_type, description, address, latitude, longitude, visibility, created_at"
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
    .filter((r) => r.distance_km <= radiusKm)
    .sort((a, b) => a.distance_km - b.distance_km);

  return NextResponse.json({ groups: withDistance });
}
