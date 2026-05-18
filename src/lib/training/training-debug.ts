/**
 * `?trainingDebug=1` on a course session (QA: always show video seek bar).
 * Available to **any** user with training access — not limited to admin / super_admin.
 * Gated by host / env so production cannot enable it via URL alone.
 */

export function hostAllowsTrainingDebugQuery(hostname: string): boolean {
  const h = (hostname.split(":")[0] ?? hostname).toLowerCase();
  if (h === "localhost" || h === "127.0.0.1") return true;
  if (h.startsWith("dev.")) return true;
  return false;
}

export function isTrainingDebugParamAllowedHost(hostHeader: string | null | undefined): boolean {
  if (!hostHeader) return false;
  const first = hostHeader.split(",")[0]?.trim();
  if (!first) return false;
  return hostAllowsTrainingDebugQuery(first);
}

export function parseTrainingDebugQueryParam(
  raw: string | string[] | null | undefined
): boolean {
  if (raw === "1" || raw === "true") return true;
  if (Array.isArray(raw)) return raw.some((v) => v === "1" || v === "true");
  return false;
}

/** Server-side: enable when query param is set and environment allows. */
export function isTrainingDebugActive(
  queryRequested: boolean,
  opts?: { hostHeader?: string | null }
): boolean {
  if (!queryRequested) return false;
  if (process.env.TRAINING_DEBUG_QUERY === "1") return true;
  if (process.env.NODE_ENV === "development") return true;
  return isTrainingDebugParamAllowedHost(opts?.hostHeader);
}

/** Client-side: same rules using `window.location.hostname`. */
export function isTrainingDebugActiveClient(queryRequested: boolean): boolean {
  if (!queryRequested) return false;
  if (process.env.NEXT_PUBLIC_TRAINING_DEBUG_QUERY === "1") return true;
  if (process.env.NODE_ENV === "development") return true;
  if (typeof window === "undefined") return false;
  return hostAllowsTrainingDebugQuery(window.location.hostname);
}
