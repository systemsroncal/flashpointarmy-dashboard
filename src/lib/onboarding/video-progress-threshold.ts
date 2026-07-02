/** Minimum saved watch progress before "Mark as completed" is offered (matches course sessions). */
export const MARK_COMPLETE_MIN_SAVED_FRACTION = 0.6;

export function isVideoEligibleForMarkComplete(
  savedSeconds: number,
  durationSeconds: number | null | undefined,
  watchedToEndBefore = false
): boolean {
  if (watchedToEndBefore) return true;
  const dur = durationSeconds;
  if (!dur || dur <= 0) return false;
  return savedSeconds / dur >= MARK_COMPLETE_MIN_SAVED_FRACTION;
}
