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
  profile_image_url?: string | null;
  wall_post_policy?: string;
  created_at: string;
  created_by?: string;
  parent_group_id?: string | null;
  parent_chapter_name?: string | null;
  distance_km?: number;
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
  const scope = (url.searchParams.get("scope") || "chapters").toLowerCase();

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "lat and lng query params are required." }, { status: 400 });
  }

  const box = boundingBoxForRadiusKm(lat, lng, radiusKm);
  let query = auth.admin
    .from("mobilize_groups")
    .select(
      "id, name, group_type, description, address, latitude, longitude, visibility, cover_image_url, profile_image_url, wall_post_policy, created_at, created_by, parent_group_id"
    )
    .eq("visibility", "public");

  if (scope === "subgroups") {
    query = query.not("parent_group_id", "is", null);
  } else {
    query = query.is("parent_group_id", null).not("latitude", "is", null).not("longitude", "is", null);
  }

  if (scope !== "subgroups") {
    query = query
      .gte("latitude", box.minLat)
      .lte("latitude", box.maxLat)
      .gte("longitude", box.minLng)
      .lte("longitude", box.maxLng);
  }

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

  if (scope === "subgroups" && rows.length) {
    const parentIds = [
      ...new Set(
        rows
          .map((r) => r.parent_group_id)
          .filter((id): id is string => typeof id === "string" && id.length > 0)
      ),
    ];
    const parentById = new Map<
      string,
      { name: string; latitude: number | null; longitude: number | null; address: string | null }
    >();
    if (parentIds.length) {
      const { data: parents } = await auth.admin
        .from("mobilize_groups")
        .select("id, name, latitude, longitude, address")
        .in("id", parentIds);
      for (const p of parents ?? []) {
        parentById.set(p.id, {
          name: p.name,
          latitude: p.latitude,
          longitude: p.longitude,
          address: p.address,
        });
      }
    }
    rows = rows.map((r) => {
      const parent = r.parent_group_id ? parentById.get(r.parent_group_id) : undefined;
      return {
        ...r,
        latitude: r.latitude ?? parent?.latitude ?? null,
        longitude: r.longitude ?? parent?.longitude ?? null,
        address: r.address ?? parent?.address ?? null,
        parent_chapter_name: parent?.name ?? null,
      };
    });
    rows = rows.filter((r) => r.latitude != null && r.longitude != null);
  }

  const withDistance = rows
    .map((r) => ({
      ...r,
      distance_km: haversineKm(lat, lng, r.latitude as number, r.longitude as number),
    }))
    .filter((r) => r.distance_km <= radiusKm);

  let merged = withDistance.sort((a, b) => a.distance_km - b.distance_km);

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
      leaders: e?.leaders ?? [],
      upcoming_activity_count: e?.upcoming_activity_count ?? 0,
      my_membership_status: e?.my_membership_status ?? null,
      subgroups: e?.subgroups ?? [],
      subgroup_count: e?.subgroup_count ?? 0,
    };
  });

  return NextResponse.json({ groups });
}
