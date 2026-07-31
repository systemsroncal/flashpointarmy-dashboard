/** UTC calendar helpers for registration before/after comparison. */

export type RegistrationComparisonRange = {
  from: string;
  to: string;
  fromIso: string;
  toIso: string;
  label: string;
};

export type RegistrationComparisonPreset = "week" | "custom";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function utcYmd(d: Date): string {
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

export function formatUsDateRange(fromYmd: string, toYmd: string): string {
  const fmt = (ymd: string) => {
    const [y, m, d] = ymd.split("-");
    return `${m}/${d}/${y}`;
  };
  return `${fmt(fromYmd)}–${fmt(toYmd)}`;
}

function startOfUtcMonday(d: Date): Date {
  const day = d.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - diff));
}

function endOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
}

function startOfUtcDayFromYmd(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
}

function endOfUtcDayFromYmd(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));
}

export function ymdToRange(fromYmd: string, toYmd: string): RegistrationComparisonRange {
  const from = fromYmd <= toYmd ? fromYmd : toYmd;
  const to = fromYmd <= toYmd ? toYmd : fromYmd;
  return {
    from,
    to,
    fromIso: startOfUtcDayFromYmd(from).toISOString(),
    toIso: endOfUtcDayFromYmd(to).toISOString(),
    label: formatUsDateRange(from, to),
  };
}

/** Last full Mon–Sun UTC week vs current Mon–today UTC week. */
export function defaultWeekComparisonRanges(now = new Date()): {
  before: RegistrationComparisonRange;
  after: RegistrationComparisonRange;
} {
  const thisMonday = startOfUtcMonday(now);
  const lastMonday = new Date(thisMonday);
  lastMonday.setUTCDate(lastMonday.getUTCDate() - 7);
  const lastSunday = new Date(lastMonday);
  lastSunday.setUTCDate(lastSunday.getUTCDate() + 6);

  const beforeFrom = utcYmd(lastMonday);
  const beforeTo = utcYmd(lastSunday);
  const afterFrom = utcYmd(thisMonday);
  const afterTo = utcYmd(now);

  return {
    before: {
      from: beforeFrom,
      to: beforeTo,
      fromIso: startOfUtcDayFromYmd(beforeFrom).toISOString(),
      toIso: endOfUtcDayFromYmd(beforeTo).toISOString(),
      label: formatUsDateRange(beforeFrom, beforeTo),
    },
    after: {
      from: afterFrom,
      to: afterTo,
      fromIso: startOfUtcDayFromYmd(afterFrom).toISOString(),
      toIso: endOfUtcDay(now).toISOString(),
      label: formatUsDateRange(afterFrom, afterTo),
    },
  };
}

export function utcDayMs(ymd: string): number {
  return startOfUtcDayFromYmd(ymd).getTime();
}

/** True when any UTC calendar day appears in both ranges. */
export function registrationRangesOverlap(
  beforeFrom: string,
  beforeTo: string,
  afterFrom: string,
  afterTo: string
): boolean {
  const bStart = utcDayMs(beforeFrom <= beforeTo ? beforeFrom : beforeTo);
  const bEnd = utcDayMs(beforeFrom <= beforeTo ? beforeTo : beforeFrom);
  const aStart = utcDayMs(afterFrom <= afterTo ? afterFrom : afterTo);
  const aEnd = utcDayMs(afterFrom <= afterTo ? afterTo : afterFrom);
  return bStart <= aEnd && aStart <= bEnd;
}

export function validateRegistrationComparisonInput(args: {
  beforeFrom: string;
  beforeTo: string;
  afterFrom: string;
  afterTo: string;
}): string | null {
  const { beforeFrom, beforeTo, afterFrom, afterTo } = args;
  if (!beforeFrom || !beforeTo || !afterFrom || !afterTo) {
    return "All Before and After dates are required.";
  }
  if (beforeFrom > beforeTo) return "Before: start date must be on or before end date.";
  if (afterFrom > afterTo) return "After: start date must be on or before end date.";
  if (registrationRangesOverlap(beforeFrom, beforeTo, afterFrom, afterTo)) {
    return "Before and After ranges cannot share the same calendar day (UTC).";
  }
  return null;
}

export function daysInclusive(fromYmd: string, toYmd: string): number {
  const start = utcDayMs(fromYmd);
  const end = utcDayMs(toYmd);
  return Math.max(1, Math.round((end - start) / 86400000) + 1);
}
