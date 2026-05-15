/**
 * Whether `?trainingDebug=1` on a course session may take effect.
 * Restricted to local dev and dev-style deploy hosts so production cannot unlock the bar via query string.
 */
export function isTrainingDebugParamAllowedHost(hostHeader: string | null | undefined): boolean {
  if (!hostHeader) return false;
  const first = hostHeader.split(",")[0]?.trim();
  if (!first) return false;
  const host = first.split(":")[0]?.toLowerCase() ?? "";
  if (host === "localhost" || host === "127.0.0.1") return true;
  if (host.startsWith("dev.")) return true;
  return false;
}
