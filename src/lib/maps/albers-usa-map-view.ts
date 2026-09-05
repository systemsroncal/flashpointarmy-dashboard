/** Approximate regions that `geoAlbersUsa` can project (lower 48 + AK/HI insets). */
function inLower48(lon: number, lat: number): boolean {
  return lon >= -125.5 && lon <= -66.0 && lat >= 24.2 && lat <= 49.5;
}

function inAlaska(lon: number, lat: number): boolean {
  return lon >= -170 && lon <= -130 && lat >= 54 && lat <= 71.5;
}

function inHawaii(lon: number, lat: number): boolean {
  return lon >= -161 && lon <= -154.4 && lat >= 18.7 && lat <= 22.5;
}

/** True when a lon/lat can be used as `ZoomableGroup` center with `geoAlbersUsa`. */
export function isAlbersUsaSafeCenter(center: [number, number]): boolean {
  const [lon, lat] = center;
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) return false;
  return inLower48(lon, lat) || inAlaska(lon, lat) || inHawaii(lon, lat);
}

/**
 * Linear lon/lat interpolation between the contiguous US and Hawaii/Alaska
 * crosses the Pacific, where `geoAlbersUsa` returns null and react-simple-maps
 * throws (blank "Under Maintenance" error page).
 */
export function albersUsaGeographicLerpIsSafe(
  start: [number, number],
  end: [number, number],
  samples = 24
): boolean {
  if (!isAlbersUsaSafeCenter(start) || !isAlbersUsaSafeCenter(end)) return false;
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const point: [number, number] = [
      start[0] + (end[0] - start[0]) * t,
      start[1] + (end[1] - start[1]) * t,
    ];
    if (!isAlbersUsaSafeCenter(point)) return false;
  }
  return true;
}
