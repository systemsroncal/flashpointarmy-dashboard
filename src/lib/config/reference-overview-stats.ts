/**
 * Opt-in: set `NEXT_PUBLIC_REFERENCE_OVERVIEW_STATS=true` to add leaders/members
 * from `public/backgrounds/cities_donors.json` to national overview stat cards.
 * When unset or not `"true"`, those cards use only Supabase counts.
 * (Map fill/popup still load the JSON separately.)
 */
export function includeReferenceInOverviewStatTotals(): boolean {
  return process.env.NEXT_PUBLIC_REFERENCE_OVERVIEW_STATS === "true";
}
