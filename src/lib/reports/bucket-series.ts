export type DateBucket = "day" | "month" | "year";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function bucketKeyForDate(d: Date, bucket: DateBucket): string {
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  if (bucket === "year") return String(y);
  if (bucket === "month") return `${y}-${pad2(m)}`;
  return `${y}-${pad2(m)}-${pad2(day)}`;
}

export function parseRange(fromParam: string | null, toParam: string | null): { from: Date; to: Date } {
  const to = toParam ? new Date(toParam) : new Date();
  const from = fromParam
    ? new Date(fromParam)
    : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    const now = new Date();
    return { from: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), to: now };
  }
  if (from > to) return { from: to, to: from };
  return { from, to };
}

/** Every bucket label from `from` through `to` (UTC), inclusive. */
export function enumerateBucketLabels(from: Date, to: Date, bucket: DateBucket): string[] {
  const labels: string[] = [];
  if (bucket === "day") {
    const cur = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());
    const end = Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate());
    for (let t = cur; t <= end; t += 24 * 60 * 60 * 1000) {
      labels.push(bucketKeyForDate(new Date(t), "day"));
    }
    return labels;
  }
  if (bucket === "month") {
    let y = from.getUTCFullYear();
    let m = from.getUTCMonth();
    const endY = to.getUTCFullYear();
    const endM = to.getUTCMonth();
    while (y < endY || (y === endY && m <= endM)) {
      labels.push(`${y}-${pad2(m + 1)}`);
      m += 1;
      if (m > 11) {
        m = 0;
        y += 1;
      }
    }
    return labels;
  }
  let y = from.getUTCFullYear();
  const endY = to.getUTCFullYear();
  while (y <= endY) {
    labels.push(String(y));
    y += 1;
  }
  return labels;
}

export function buildSeriesForTimestamps(
  isoStrings: (string | null | undefined)[],
  from: Date,
  to: Date,
  bucket: DateBucket
): { categories: string[]; data: number[] } {
  const categories = enumerateBucketLabels(from, to, bucket);
  const counts = new Map<string, number>();
  for (const c of categories) counts.set(c, 0);

  for (const raw of isoStrings) {
    if (!raw) continue;
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) continue;
    if (d < from || d > to) continue;
    const key = bucketKeyForDate(d, bucket);
    if (!counts.has(key)) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const data = categories.map((c) => counts.get(c) ?? 0);
  return { categories, data };
}

export function suggestBucket(from: Date, to: Date): DateBucket {
  const ms = to.getTime() - from.getTime();
  const days = ms / (24 * 60 * 60 * 1000);
  if (days <= 45) return "day";
  if (days <= 800) return "month";
  return "year";
}
