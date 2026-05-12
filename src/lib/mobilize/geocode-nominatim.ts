export type GeocodeHit = {
  displayName: string;
  lat: number;
  lng: number;
};

const NOMINATIM = "https://nominatim.openstreetmap.org/search";

/**
 * Forward geocode via Nominatim (abstractable provider). Call only from server-side routes
 * and respect usage policy (cache, rate limits, identify app in User-Agent).
 */
export async function geocodeWithNominatim(query: string): Promise<GeocodeHit[]> {
  const q = query.trim();
  if (q.length < 3) return [];

  const url = new URL(NOMINATIM);
  url.searchParams.set("format", "json");
  url.searchParams.set("q", q);
  url.searchParams.set("limit", "5");

  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      // Nominatim requires a valid UA identifying the application
      "User-Agent": "FlashpointDashboard/Mobilize (internal geocode; replace with your contact URL)",
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`Geocode provider error: ${res.status}`);
  }

  const data = (await res.json()) as Array<{
    display_name?: string;
    lat?: string;
    lon?: string;
  }>;

  return data
    .map((row) => {
      const lat = Number(row.lat);
      const lng = Number(row.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      return {
        displayName: String(row.display_name ?? "").trim() || q,
        lat,
        lng,
      };
    })
    .filter(Boolean) as GeocodeHit[];
}
