const TOUR_MAIN_KEY = "fpa_dashboard_tour_v1";
const TOUR_MOBILIZE_KEY = "fpa_mobilize_tour_v1";

function key(base: string, userId: string): string {
  return `${base}:${userId}`;
}

export function isMainDashboardTourCompleted(userId: string): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(key(TOUR_MAIN_KEY, userId)) === "1";
  } catch {
    return false;
  }
}

export function markMainDashboardTourCompleted(userId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key(TOUR_MAIN_KEY, userId), "1");
  } catch {
    /* ignore */
  }
}

export function isMobilizeTourCompleted(userId: string): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(key(TOUR_MOBILIZE_KEY, userId)) === "1";
  } catch {
    return false;
  }
}

export function markMobilizeTourCompleted(userId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key(TOUR_MOBILIZE_KEY, userId), "1");
  } catch {
    /* ignore */
  }
}
