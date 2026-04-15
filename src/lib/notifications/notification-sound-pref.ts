const STORAGE_KEY = "flashpoint_notification_sound_enabled";

/** Default: sound on for new notifications. */
export function getNotificationSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  const v = window.localStorage.getItem(STORAGE_KEY);
  if (v === null) return true;
  return v === "1";
}

export function setNotificationSoundEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0");
}
