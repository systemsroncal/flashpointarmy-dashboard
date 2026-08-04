/** Cross-UI sync when profile avatar/cover change (drawer ↔ mobilize profile ↔ shell). */

export const PROFILE_MEDIA_UPDATED_EVENT = "fp:profile-media-updated";

export type ProfileMediaUpdatedDetail = {
  avatar_url?: string | null;
  cover_url?: string | null;
};

export function emitProfileMediaUpdated(detail: ProfileMediaUpdatedDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<ProfileMediaUpdatedDetail>(PROFILE_MEDIA_UPDATED_EVENT, { detail })
  );
}

export function subscribeProfileMediaUpdated(
  handler: (detail: ProfileMediaUpdatedDetail) => void
): () => void {
  if (typeof window === "undefined") return () => undefined;
  const listener = (e: Event) => {
    const ce = e as CustomEvent<ProfileMediaUpdatedDetail>;
    handler(ce.detail ?? {});
  };
  window.addEventListener(PROFILE_MEDIA_UPDATED_EVENT, listener);
  return () => window.removeEventListener(PROFILE_MEDIA_UPDATED_EVENT, listener);
}
