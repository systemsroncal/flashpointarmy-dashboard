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
  "header-sign-out",
  "header-account-settings",
  "header-notifications",
  "header-tour-help",
] as const;

const PROFILE_AND_CHROME_SET = new Set<string>(PROFILE_AND_CHROME_STEP_IDS);

/**
 * Predicate matching which step ids belong to a given module visit.
 *
 * - On a module page (e.g. `/dashboard/chapters`) we only highlight the
 *   matching `nav-${moduleKey}` step.
 * - On the home dashboard (`nationalOverview`) we show the FULL tour:
 *   welcome, sidebar toggle, every `nav-*` entry the user can see (including
 *   the `nav-settings-group` row and every settings child), plus the profile
 *   and header chrome steps. This is why entries between `nav-nationalOverview`
 *   and `sidebar-profile` were being skipped — the previous version only
 *   listed `nav-${moduleKey}` instead of all `nav-*` ids.
 */
function isStepIdForModuleVisit(moduleKey: string, id: string): boolean {
  if (moduleKey === MODULE_SLUGS.nationalOverview) {
    if (id === "welcome" || id === "sidebar-toggle") return true;
    if (id.startsWith("nav-")) return true;
    if (PROFILE_AND_CHROME_SET.has(id)) return true;
    return false;
  }
  return id === `nav-${moduleKey}`;
}

/** Step ids the home tour considers (used for the help-button restart bookkeeping). */
export function stepIdsForModuleVisit(moduleKey: string): string[] {
  if (moduleKey !== MODULE_SLUGS.nationalOverview) return [`nav-${moduleKey}`];
  /** Order matches `buildMainDashboardTourEntries`. */
  return [
    "welcome",
    "sidebar-toggle",
    /** Generic marker — `pickAllEntriesForModuleVisit` / `pickEntriesForModuleVisit` use
     * the predicate to include every visible `nav-*` entry. */
    ...PROFILE_AND_CHROME_STEP_IDS,
  ];
}

/** Unseen steps to show when the user opens a module route. */
export function pickEntriesForModuleVisit(
  moduleKey: string,
  allEntries: TourStepEntry[],
  seen: Set<string>
): TourStepEntry[] {
  return filterEntriesWithDom(
    allEntries.filter((e) => isStepIdForModuleVisit(moduleKey, e.id) && !seen.has(e.id))
  );
}

/** All steps for a module route, ignoring the "seen" state (used when restarting from zero). */
export function pickAllEntriesForModuleVisit(
  moduleKey: string,
  allEntries: TourStepEntry[]
): TourStepEntry[] {
  return filterEntriesWithDom(
    allEntries.filter((e) => isStepIdForModuleVisit(moduleKey, e.id))
  );
}
