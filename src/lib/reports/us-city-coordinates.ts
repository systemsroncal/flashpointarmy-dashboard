/** [longitude, latitude] for map projections (geoAlbersUsa). */

const STATE_CENTROIDS: Record<string, [number, number]> = {
  AL: [-86.7916, 32.8067],
  AK: [-152.4044, 61.3707],
  AZ: [-111.4312, 33.7298],
  AR: [-92.3731, 34.9697],
  CA: [-119.6816, 36.1162],
  CO: [-105.3111, 39.0598],
  CT: [-72.7554, 41.5978],
  DE: [-75.5277, 39.3185],
  DC: [-77.026, 38.9072],
  FL: [-81.6868, 27.7663],
  GA: [-83.6431, 33.0406],
  HI: [-157.4983, 21.0943],
  ID: [-114.4788, 44.2405],
  IL: [-89.3985, 40.3495],
  IN: [-86.2816, 39.8494],
  IA: [-93.214, 42.0115],
  KS: [-98.4842, 38.5266],
  KY: [-84.6701, 37.6681],
  LA: [-91.8749, 31.1695],
  ME: [-69.3977, 44.6939],
  MD: [-76.8021, 39.0639],
  MA: [-71.5301, 42.2302],
  MI: [-84.5467, 43.3266],
  MN: [-93.9196, 45.6945],
  MS: [-89.6787, 32.7416],
  MO: [-92.2896, 38.4561],
  MT: [-110.4544, 46.9219],
  NE: [-99.9018, 41.1254],
  NV: [-117.0554, 38.3135],
  NH: [-71.5639, 43.4525],
  NJ: [-74.521, 40.2989],
  NM: [-106.2485, 34.8405],
  NY: [-74.9481, 42.1657],
  NC: [-79.0193, 35.6301],
  ND: [-99.784, 47.5289],
  OH: [-82.7649, 40.3888],
  OK: [-97.5349, 35.5653],
  OR: [-122.0709, 44.572],
  PA: [-77.2098, 40.5908],
  RI: [-71.5118, 41.6809],
  SC: [-80.945, 33.8569],
  SD: [-99.4388, 44.2998],
  TN: [-86.6923, 35.7478],
  TX: [-99.9018, 31.0545],
  UT: [-111.8926, 40.15],
  VT: [-72.7107, 44.0459],
  VA: [-78.169, 37.7693],
  WA: [-121.49, 47.4009],
  WV: [-80.9545, 38.4912],
  WI: [-89.6165, 44.2685],
  WY: [-107.3025, 42.756],
};

/** State capitals + common metros (key: `city|ST` lowercased). */
const CITY_COORDS = new Map<string, [number, number]>([
  ["montgomery|al", [-86.3, 32.37]],
  ["birmingham|al", [-86.81, 33.52]],
  ["anchorage|ak", [-149.9, 61.22]],
  ["phoenix|az", [-112.07, 33.45]],
  ["tucson|az", [-110.97, 32.22]],
  ["little rock|ar", [-92.29, 34.75]],
  ["los angeles|ca", [-118.24, 34.05]],
  ["san diego|ca", [-117.16, 32.72]],
  ["san francisco|ca", [-122.42, 37.77]],
  ["sacramento|ca", [-121.49, 38.58]],
  ["san jose|ca", [-121.89, 37.34]],
  ["denver|co", [-104.99, 39.74]],
  ["colorado springs|co", [-104.82, 38.83]],
  ["hartford|ct", [-72.68, 41.76]],
  ["wilmington|de", [-75.53, 39.74]],
  ["washington|dc", [-77.04, 38.91]],
  ["miami|fl", [-80.19, 25.76]],
  ["orlando|fl", [-81.38, 28.54]],
  ["tampa|fl", [-82.46, 27.95]],
  ["jacksonville|fl", [-81.66, 30.33]],
  ["atlanta|ga", [-84.39, 33.75]],
  ["honolulu|hi", [-157.86, 21.31]],
  ["boise|id", [-116.21, 43.62]],
  ["chicago|il", [-87.63, 41.88]],
  ["indianapolis|in", [-86.16, 39.77]],
  ["des moines|ia", [-93.61, 41.59]],
  ["wichita|ks", [-97.33, 37.69]],
  ["louisville|ky", [-85.76, 38.25]],
  ["lexington|ky", [-84.5, 38.05]],
  ["new orleans|la", [-90.07, 29.95]],
  ["baton rouge|la", [-91.14, 30.46]],
  ["portland|me", [-70.26, 43.66]],
  ["baltimore|md", [-76.61, 39.29]],
  ["boston|ma", [-71.06, 42.36]],
  ["detroit|mi", [-83.05, 42.33]],
  ["grand rapids|mi", [-85.67, 42.96]],
  ["minneapolis|mn", [-93.27, 44.98]],
  ["st paul|mn", [-93.09, 44.95]],
  ["saint paul|mn", [-93.09, 44.95]],
  ["jackson|ms", [-90.18, 32.3]],
  ["kansas city|mo", [-94.58, 39.1]],
  ["st louis|mo", [-90.2, 38.63]],
  ["saint louis|mo", [-90.2, 38.63]],
  ["billings|mt", [-108.5, 45.78]],
  ["omaha|ne", [-95.99, 41.26]],
  ["las vegas|nv", [-115.14, 36.17]],
  ["reno|nv", [-119.81, 39.53]],
  ["manchester|nh", [-71.54, 42.99]],
  ["newark|nj", [-74.17, 40.74]],
  ["jersey city|nj", [-74.04, 40.72]],
  ["albuquerque|nm", [-106.65, 35.08]],
  ["new york|ny", [-74.01, 40.71]],
  ["new york city|ny", [-74.01, 40.71]],
  ["nyc|ny", [-74.01, 40.71]],
  ["buffalo|ny", [-78.88, 42.89]],
  ["charlotte|nc", [-80.84, 35.23]],
  ["raleigh|nc", [-78.64, 35.78]],
  ["fargo|nd", [-96.79, 46.88]],
  ["columbus|oh", [-82.99, 39.96]],
  ["cleveland|oh", [-81.69, 41.5]],
  ["cincinnati|oh", [-84.51, 39.1]],
  ["oklahoma city|ok", [-97.52, 35.47]],
  ["tulsa|ok", [-95.99, 36.15]],
  ["portland|or", [-122.68, 45.52]],
  ["philadelphia|pa", [-75.17, 39.95]],
  ["pittsburgh|pa", [-79.99, 40.44]],
  ["providence|ri", [-71.41, 41.82]],
  ["charleston|sc", [-79.93, 32.78]],
  ["columbia|sc", [-81.03, 34.0]],
  ["sioux falls|sd", [-96.73, 43.55]],
  ["nashville|tn", [-86.78, 36.16]],
  ["memphis|tn", [-90.05, 35.15]],
  ["houston|tx", [-95.37, 29.76]],
  ["dallas|tx", [-96.8, 32.78]],
  ["austin|tx", [-97.74, 30.27]],
  ["san antonio|tx", [-98.49, 29.42]],
  ["fort worth|tx", [-97.33, 32.75]],
  ["el paso|tx", [-106.49, 31.76]],
  ["salt lake city|ut", [-111.89, 40.76]],
  ["burlington|vt", [-73.21, 44.48]],
  ["richmond|va", [-77.44, 37.54]],
  ["virginia beach|va", [-75.98, 36.85]],
  ["seattle|wa", [-122.33, 47.61]],
  ["spokane|wa", [-117.42, 47.66]],
  ["charleston|wv", [-81.63, 38.35]],
  ["milwaukee|wi", [-87.91, 43.04]],
  ["madison|wi", [-89.4, 43.07]],
  ["cheyenne|wy", [-104.82, 41.14]],
]);

function cityLookupKey(city: string, stateCode: string): string {
  return `${city
    .trim()
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/\s+/g, " ")}|${stateCode.toUpperCase().slice(0, 2)}`;
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Spread unknown cities within a state so blobs do not stack on the centroid. */
function jitterAroundCentroid(city: string, stateCode: string, centroid: [number, number]): [number, number] {
  const h = hashString(`${city}|${stateCode}`);
  const angle = ((h % 360) * Math.PI) / 180;
  const radius = 0.35 + (h % 80) / 80;
  return [centroid[0] + Math.cos(angle) * radius, centroid[1] + Math.sin(angle) * radius * 0.55];
}

/** Geographic center of a US state for map zoom (geoAlbersUsa coordinates). */
export function getStateCentroid(stateCode: string): [number, number] | null {
  const st = stateCode.trim().toUpperCase().slice(0, 2);
  return STATE_CENTROIDS[st] ?? null;
}

export function resolveCityCoordinates(
  city: string,
  stateCode: string
): { lng: number; lat: number } | null {
  const st = stateCode.toUpperCase().slice(0, 2);
  if (!st || st === "UN" || st === "UK") return null;

  const c = city.trim();
  if (!c || c.toLowerCase() === "unknown city") {
    const centroid = STATE_CENTROIDS[st];
    return centroid ? { lng: centroid[0], lat: centroid[1] } : null;
  }

  const hit = CITY_COORDS.get(cityLookupKey(c, st));
  if (hit) return { lng: hit[0], lat: hit[1] };

  const centroid = STATE_CENTROIDS[st];
  if (!centroid) return null;
  const [lng, lat] = jitterAroundCentroid(c, st, centroid);
  return { lng, lat };
}
