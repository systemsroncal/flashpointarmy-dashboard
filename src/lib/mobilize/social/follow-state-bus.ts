/**
 * In-page follow state shared across post headers and profile headers.
 *
 * A feed can render the same author many times, and a profile shows its own
 * posts below the header. Following from any of them has to update all of the
 * others immediately, without refetching the feed.
 */

const followState = new Map<string, boolean>();
const listeners = new Set<(authorId: string, following: boolean) => void>();

export function publishFollowState(authorId: string, following: boolean) {
  followState.set(authorId, following);
  for (const listener of listeners) listener(authorId, following);
}

/** `undefined` when nothing in this page has changed the author's follow state. */
export function readFollowState(authorId: string): boolean | undefined {
  return followState.get(authorId);
}

export function subscribeFollowState(
  listener: (authorId: string, following: boolean) => void
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
