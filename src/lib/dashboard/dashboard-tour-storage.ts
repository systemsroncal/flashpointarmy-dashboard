const TOUR_SEEN_KEY = "fpa_dashboard_tour_seen_v2";

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
