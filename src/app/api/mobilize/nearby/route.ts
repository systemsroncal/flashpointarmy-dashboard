import { NextResponse } from "next/server";
import {
  approximateLatDegForKm,
  approximateLngDegForKm,
  haversineKm,
} from "@/lib/mobilize/distance";
import { getMobilizeAuth } from "@/lib/mobilize/guard";
import { createAdminClient } from "@/utils/supabase/admin";

const EARTH_R_KM = 6371;

export async function GET(req: Request) {
  const auth = await getMobilizeAuth();
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const lat = Number(url.searchParams.get("lat"));
  const lng = Number(url.searchParams.get("lng"));
  const radiusKm = Math.min(500, Math.max(1, Number(url.searchParams.get("radiusKm") ?? "10")));
  const typesRaw = url.searchParams.get("types") ?? "";
  const types = typesRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "lat and lng are required" }, { status: 400 });
  }

  const admin = createAdminClient();
  let query = admin
    .from("mobilize_groups")
    .select("id, name, group_type, description, address_line, latitude, longitude, visibility, created_at")
    .eq("visibility", "public")
    .not("latitude", "is", null)
    .not("longitude", "is", null);

  if (types.length > 0) {
    query = query.in("group_type", types);
  }

  const dLat = approximateLatDegForKm(radiusKm);
  const dLng = approximateLngDegForKm(radiusKm, lat);
  query = query
    .gte("latitude", lat - dLat)
    .lte("latitude", lat + dLat)
    .gte("longitude", lng - dLng)
    .lte("longitude", lng + dLng);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as Array<{
    id: string;
    name: string;
    group_type: string;
    description: string | null;
    address_line: string | null;
    latitude: number;
    longitude: number;
    visibility: string;
    created_at: string;
  }>;

  const filtered = rows
    .map((row) => ({
      ...row,
      distance_km: haversineKm(lat, lng, row.latitude, row.longitude),
    }))
    .filter((row) => row.distance_km <= radiusKm)
    .filter((row) => (q ? row.name.toLowerCase().includes(q) : true))
    .sort((a, b) => a.distance_km - b.distance_km);

  return NextResponse.json({
    groups: filtered,
    meta: { radiusKm, earthRadiusKm: EARTH_R_KM },
  });
}
