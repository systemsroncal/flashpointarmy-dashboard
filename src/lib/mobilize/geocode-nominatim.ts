/**
 * Abstract geocoding provider (Nominatim). Call only from server-side routes.
 * https://operations.osmfoundation.org/policies/nominatim/
 */

export type GeocodeHit = {
  display_name: string;
  lat: number;
  lon: number;
};

const UA = "FlashpointDashboard/1.0 (mobilize geocode; contact: support@example.invalid)";

export async function geocodeForward(query: string): Promise<GeocodeHit[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "json");
  url.searchParams.set("q", q);
  url.searchParams.set("limit", "8");
  const res = await fetch(url.toString(), {
    headers: { "User-Agent": UA, Accept: "application/json" },
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`Geocode failed: ${res.status}`);
  const raw = (await res.json()) as { display_name?: string; lat?: string; lon?: string }[];
  return (raw ?? [])
    .map((r) => ({
      display_name: String(r.display_name ?? ""),
      lat: Number(r.lat),
      lon: Number(r.lon),
    }))
    .filter((r) => r.display_name && Number.isFinite(r.lat) && Number.isFinite(r.lon));
}
