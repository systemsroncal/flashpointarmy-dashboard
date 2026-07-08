/** Invite / share CTA is visible to all authenticated dashboard users. */
export function isChapterMapInviteCtaEnabledForUser(_roleNames?: string[]): boolean {
  return true;
}

/** @deprecated Always enabled — kept for callers that only checked environment. */
export function isChapterMapInviteCtaEnabledByEnvironment(): boolean {
  return true;
}

/** @deprecated Prefer {@link isChapterMapInviteCtaEnabledForUser} */
export function isChapterMapInviteCtaEnabled(): boolean {
  return true;
}
