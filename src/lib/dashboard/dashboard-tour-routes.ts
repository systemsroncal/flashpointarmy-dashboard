import { MODULE_SLUGS } from "@/config/modules";
import {
  filterEntriesWithDom,
  type TourNavItem,
  type TourStepEntry,
} from "@/lib/dashboard/dashboard-tour-steps";

const MOBILIZE_PREFIX = "/dashboard/mobilize";

/** Map current pathname to a tour module key (nav-* step id suffix). */
export function pathnameToTourModuleKey(
  pathname: string,
  navItems: TourNavItem[]
): string | null {
  if (!pathname.startsWith("/dashboard")) return null;
  if (pathname.startsWith(MOBILIZE_PREFIX)) return null;

  if (pathname === "/dashboard" || pathname === "/dashboard/") {
    return MODULE_SLUGS.nationalOverview;
  }

  const sorted = [...navItems].sort((a, b) => b.href.length - a.href.length);
  for (const item of sorted) {
    if (item.module === MODULE_SLUGS.movilization) continue;
    if (item.href === "/dashboard") continue;
    if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
      return item.module;
    }
  }

  if (pathname.startsWith("/dashboard/course")) {
    return MODULE_SLUGS.training;
  }

  return null;
}

const PROFILE_AND_CHROME_STEP_IDS = [
  "sidebar-profile",
  "sidebar-sign-out",
  "header-notifications",
  "header-tour-help",
] as const;

/** Step ids to offer when the user opens this module route. */
export function stepIdsForModuleVisit(moduleKey: string): string[] {
  const ids = [`nav-${moduleKey}`];
  if (moduleKey === MODULE_SLUGS.nationalOverview) {
    return ["welcome", "sidebar-toggle", ...ids, ...PROFILE_AND_CHROME_STEP_IDS];
  }
  return ids;
}

/** Unseen steps to show when the user opens a module route. */
export function pickEntriesForModuleVisit(
  moduleKey: string,
  allEntries: TourStepEntry[],
  seen: Set<string>
): TourStepEntry[] {
  const wanted = new Set(stepIdsForModuleVisit(moduleKey));
  return filterEntriesWithDom(allEntries.filter((e) => wanted.has(e.id) && !seen.has(e.id)));
}

/** All steps for a module route, ignoring the "seen" state (used when restarting from zero). */
export function pickAllEntriesForModuleVisit(
  moduleKey: string,
  allEntries: TourStepEntry[]
): TourStepEntry[] {
  const wanted = new Set(stepIdsForModuleVisit(moduleKey));
  const order = stepIdsForModuleVisit(moduleKey);
  const byId = new Map(allEntries.map((e) => [e.id, e] as const));
  const ordered = order
    .map((id) => byId.get(id))
    .filter((e): e is TourStepEntry => Boolean(e && wanted.has(e.id)));
  return filterEntriesWithDom(ordered);
}
