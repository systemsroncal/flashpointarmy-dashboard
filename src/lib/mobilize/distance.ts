/**
 * Haversine distance between two WGS84 coordinates (degrees).
 * Returns kilometers. Suitable for radii under a few hundred km.
 */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Bounding box pad in degrees for a rough prefilter before Haversine (latitude first). */
export function approximateLatDegForKm(km: number): number {
  return km / 111;
}

export function approximateLngDegForKm(km: number, atLatDeg: number): number {
  const cos = Math.cos((atLatDeg * Math.PI) / 180);
  const denom = 111 * Math.max(0.2, cos);
  return km / denom;
}
