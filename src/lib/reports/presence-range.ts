/** Default rolling window for presence / reports widgets (UTC days). */
export const PRESENCE_DEFAULT_DAYS = 7;

export type PresenceRangePreset = "7d" | "30d" | "custom";

export type PresenceDateRange = {
  preset: PresenceRangePreset;
  fromStr: string;
  toStr: string;
  dayCount: number;
};

export function utcTodayParts(now = new Date()) {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const d = now.getUTCDate();
  return { y, m, d };
}

export function utcDateKey(y: number, m: number, d: number, offsetDays: number): string {
  const dt = new Date(Date.UTC(y, m, d));
  dt.setUTCDate(dt.getUTCDate() + offsetDays);
  return dt.toISOString().slice(0, 10);
}

function parseIsoDay(raw: string | null): string | null {
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  return raw;
}

/** Resolve UTC inclusive date range from query params (defaults to last 7 days). */
export function parsePresenceDateRange(searchParams: URLSearchParams): PresenceDateRange {
  const presetRaw = searchParams.get("preset");
  const preset: PresenceRangePreset =
    presetRaw === "30d" || presetRaw === "custom" ? presetRaw : "7d";

  const { y, m, d } = utcTodayParts();
  const toStr = parseIsoDay(searchParams.get("to")) ?? utcDateKey(y, m, d, 0);

  if (preset === "custom") {
    const fromStr =
      parseIsoDay(searchParams.get("from")) ??
      utcDateKey(y, m, d, -(PRESENCE_DEFAULT_DAYS - 1));
    const fromMs = Date.parse(`${fromStr}T00:00:00.000Z`);
    const toMs = Date.parse(`${toStr}T00:00:00.000Z`);
    const dayCount =
      fromMs <= toMs
        ? Math.max(1, Math.round((toMs - fromMs) / 86400000) + 1)
        : PRESENCE_DEFAULT_DAYS;
    return { preset, fromStr, toStr, dayCount };
  }

  const days = preset === "30d" ? 30 : PRESENCE_DEFAULT_DAYS;
  const fromStr = utcDateKey(y, m, d, -(days - 1));
  return { preset, fromStr, toStr, dayCount: days };
}

/** Build ordered UTC day keys from `fromStr` through `toStr` inclusive. */
export function utcDayKeysInclusive(fromStr: string, toStr: string): string[] {
  const keys: string[] = [];
  let cur = fromStr;
  while (cur <= toStr) {
    keys.push(cur);
    const dt = new Date(`${cur}T00:00:00.000Z`);
    dt.setUTCDate(dt.getUTCDate() + 1);
    cur = dt.toISOString().slice(0, 10);
    if (keys.length > 400) break;
  }
  return keys;
}

export function presenceRangeQueryString(range: {
  preset: PresenceRangePreset;
  customFrom?: string;
  customTo?: string;
}): string {
  const params = new URLSearchParams({ preset: range.preset });
  if (range.preset === "custom") {
    if (range.customFrom) params.set("from", range.customFrom);
    if (range.customTo) params.set("to", range.customTo);
  }
  return params.toString();
}
