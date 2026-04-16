/** Shape of `public/backgrounds/cities_donors.json` */
export type CitiesDonorsJson = {
  Cities?: Array<{
    City?: string;
    State?: string;
    Donors?: number;
  }>;
};

/** Per state: reference leaders + members derived from city rows (not stored in DB). */
export type ReferenceStateSplit = {
  leaders: number;
  members: number;
};

/**
 * For each city row: 1 local leader if Donors ≥ 1, remaining Donors − 1 are members
 * (e.g. 3 → 1 leader + 2 members; 30 → 1 leader + 29 members).
 * Sums all cities into their state for map weighting.
 */
export function aggregateReferenceLeaderMemberByState(
  data: CitiesDonorsJson
): Map<string, ReferenceStateSplit> {
  const m = new Map<string, ReferenceStateSplit>();
  for (const row of data.Cities ?? []) {
    const st = String(row.State ?? "")
      .trim()
      .toUpperCase()
      .slice(0, 2);
    if (st.length !== 2) continue;
    const d = Math.max(0, Math.floor(Number(row.Donors) || 0));
    const cityLeaders = d >= 1 ? 1 : 0;
    const cityMembers = Math.max(0, d - 1);
    const cur = m.get(st) ?? { leaders: 0, members: 0 };
    cur.leaders += cityLeaders;
    cur.members += cityMembers;
    m.set(st, cur);
  }
  return m;
}

/** Sum all states (national totals from reference JSON). */
export function sumReferenceTotals(map: Map<string, ReferenceStateSplit>): ReferenceStateSplit {
  let leaders = 0;
  let members = 0;
  for (const v of map.values()) {
    leaders += v.leaders;
    members += v.members;
  }
  return { leaders, members };
}
