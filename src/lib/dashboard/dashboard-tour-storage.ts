const TOUR_SEEN_KEY = "fpa_dashboard_tour_seen_v2";
const AUTO_TOUR_DONE_KEY = "fpa_dashboard_tour_auto_done_v1";

function storageKey(userId: string): string {
  return `${TOUR_SEEN_KEY}:${userId}`;
}

function readRaw(userId: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string" && id.length > 0);
  } catch {
    return [];
  }
}

export function getSeenTourStepIds(userId: string): Set<string> {
  return new Set(readRaw(userId));
}

export function markTourStepSeen(userId: string, stepId: string): void {
  if (typeof window === "undefined" || !stepId) return;
  try {
    const seen = getSeenTourStepIds(userId);
    if (seen.has(stepId)) return;
    seen.add(stepId);
    localStorage.setItem(storageKey(userId), JSON.stringify([...seen]));
  } catch {
    /* ignore */
  }
}

export function markTourStepIdsSeen(userId: string, stepIds: string[]): void {
  if (typeof window === "undefined" || stepIds.length === 0) return;
  try {
    const seen = getSeenTourStepIds(userId);
    for (const id of stepIds) seen.add(id);
    localStorage.setItem(storageKey(userId), JSON.stringify([...seen]));
  } catch {
    /* ignore */
  }
}

/** True when every step id in the list has been marked seen. */
export function areAllTourStepsSeen(userId: string, stepIds: string[]): boolean {
  if (stepIds.length === 0) return true;
  const seen = getSeenTourStepIds(userId);
  return stepIds.every((id) => seen.has(id));
}

/** True after the user has seen (or skipped) the one-time automatic dashboard tour. */
export function hasAutoTourCompleted(userId: string): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(`${AUTO_TOUR_DONE_KEY}:${userId}`) === "1";
  } catch {
    return true;
  }
}

/** Mark the automatic tour as done so it only runs once per user. */
export function markAutoTourCompleted(userId: string): void {
  if (typeof window === "undefined" || !userId) return;
  try {
    localStorage.setItem(`${AUTO_TOUR_DONE_KEY}:${userId}`, "1");
  } catch {
    /* ignore */
  }
}

const POST_LOGIN_AUTO_TOUR_SESSION_KEY = "fpa_post_login_auto_tour_v1";

/** Set after a successful sign-in so the dashboard can run the one-time auto tour. */
export function markPostLoginAutoTourPending(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(POST_LOGIN_AUTO_TOUR_SESSION_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function isPostLoginAutoTourPending(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(POST_LOGIN_AUTO_TOUR_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function clearPostLoginAutoTourPending(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(POST_LOGIN_AUTO_TOUR_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

/** Remove the given step ids from the per-user "seen" set (used to restart a module's tour). */
export function clearSeenTourStepIds(userId: string, stepIds: string[]): void {
  if (typeof window === "undefined" || stepIds.length === 0) return;
  try {
    const seen = getSeenTourStepIds(userId);
    let changed = false;
    for (const id of stepIds) {
      if (seen.delete(id)) changed = true;
    }
    if (changed) {
      localStorage.setItem(storageKey(userId), JSON.stringify([...seen]));
    }
  } catch {
    /* ignore */
  }
}
