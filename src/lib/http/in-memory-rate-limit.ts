const hitsByKey = new Map<string, number[]>();

/**
 * Sliding-window limiter for expensive same-origin APIs (per user or IP).
 * In-memory only — each Node process has its own window.
 */
export function consumeRateLimit(
  key: string,
  max: number,
  windowMs: number
): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const prev = (hitsByKey.get(key) ?? []).filter((t) => now - t < windowMs);
  if (prev.length >= max) {
    const retryAfterSec = Math.max(1, Math.ceil((windowMs - (now - prev[0])) / 1000));
    hitsByKey.set(key, prev);
    return { ok: false, retryAfterSec };
  }
  prev.push(now);
  hitsByKey.set(key, prev);
  return { ok: true };
}
