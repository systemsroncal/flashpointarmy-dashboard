/** Open the dashboard profile drawer (optionally in edit mode). */

export const PROFILE_DRAWER_OPEN_EVENT = "fp:profile-drawer-open";

export type ProfileDrawerOpenDetail = {
  edit?: boolean;
};

export function requestOpenProfileDrawer(detail?: ProfileDrawerOpenDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<ProfileDrawerOpenDetail>(PROFILE_DRAWER_OPEN_EVENT, { detail: detail ?? {} })
  );
}

export function subscribeProfileDrawerOpen(handler: (detail: ProfileDrawerOpenDetail) => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const listener = (e: Event) => {
    const ce = e as CustomEvent<ProfileDrawerOpenDetail>;
    handler(ce.detail ?? {});
  };
  window.addEventListener(PROFILE_DRAWER_OPEN_EVENT, listener);
  return () => window.removeEventListener(PROFILE_DRAWER_OPEN_EVENT, listener);
}

export const PROFILE_SETTINGS_UPDATED_EVENT = "fp:profile-settings-updated";

export function emitProfileSettingsUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(PROFILE_SETTINGS_UPDATED_EVENT));
}

export function subscribeProfileSettingsUpdated(handler: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(PROFILE_SETTINGS_UPDATED_EVENT, handler);
  return () => window.removeEventListener(PROFILE_SETTINGS_UPDATED_EVENT, handler);
}