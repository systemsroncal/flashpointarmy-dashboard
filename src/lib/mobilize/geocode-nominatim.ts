/**
 * Server-side forward geocoding. Photon (Komoot) first — tolerates datacenter IPs
 * better than the public Nominatim instance, which often returns 403 from VPS/cloud.
 * Nominatim is used as fallback when Photon returns no hits.
 * https://photon.komoot.io/ · https://operations.osmfoundation.org/policies/nominatim/
 */

export type GeocodeHit = {
  display_name: string;
  lat: number;
  lon: number;
};

function nominatimUserAgent(): string {
  const contact = process.env.NOMINATIM_CONTACT_EMAIL?.trim();
  if (contact) {
    return `FlashpointDashboard/1.0 (mobilize geocode; contact: ${contact})`;
  }
  return "FlashpointDashboard/1.0 (mobilize geocode; set NOMINATIM_CONTACT_EMAIL for OSM policy)";
}

type PhotonFeature = {
  geometry?: { type?: string; coordinates?: [number, number] };
  properties?: Record<string, unknown>;
};

function formatPhotonLine(props: Record<string, unknown>): string {
  const housenumber = typeof props.housenumber === "string" ? props.housenumber : "";
  const street = typeof props.street === "string" ? props.street : "";
  const line1 = [housenumber, street].filter(Boolean).join(" ").trim();
  const postcode = typeof props.postcode === "string" ? props.postcode : "";
  const city = typeof props.city === "string" ? props.city : "";
  const town = typeof props.town === "string" ? props.town : "";
  const state = typeof props.state === "string" ? props.state : "";
  const country = typeof props.country === "string" ? props.country : "";
  const locality = city || town;
  const line2 = [postcode, locality, state, country].filter(Boolean).join(", ").trim();
  const name = typeof props.name === "string" ? props.name.trim() : "";
  if (line1 && line2) return `${line1}, ${line2}`;
  if (line1) return name ? `${line1} — ${name}` : line1;
  if (line2) return name ? `${name}, ${line2}` : line2;
  return name || "Location";
}

async function geocodePhoton(query: string): Promise<GeocodeHit[]> {
  const url = new URL("https://photon.komoot.io/api/");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "8");
  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "User-Agent": nominatimUserAgent(),
    },
    next: { revalidate: 0 },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { features?: PhotonFeature[] };
  const features = data.features ?? [];
  const out: GeocodeHit[] = [];
  for (const f of features) {
    const coords = f.geometry?.coordinates;
    if (!coords || coords.length < 2) continue;
    const [lon, lat] = coords;
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const props = f.properties ?? {};
    const display_name = formatPhotonLine(props);
    if (display_name) out.push({ display_name, lat, lon });
  }
  return out;
}

async function geocodeNominatim(query: string): Promise<GeocodeHit[]> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "json");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "8");
  const email = process.env.NOMINATIM_CONTACT_EMAIL?.trim();
  if (email) url.searchParams.set("email", email);
  const res = await fetch(url.toString(), {
    headers: { "User-Agent": nominatimUserAgent(), Accept: "application/json" },
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

export async function geocodeForward(query: string): Promise<GeocodeHit[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  try {
    const photon = await geocodePhoton(q);
    if (photon.length) return photon;
  } catch {
    /* Photon unavailable; try Nominatim. */
  }
  return geocodeNominatim(q);
}
