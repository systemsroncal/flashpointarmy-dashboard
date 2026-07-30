const STORAGE_KEY = "flashpoint_mission_update_sound_enabled";

/** Default: trumpet sound on for new Mission Updates (/dashboard/notifications). */
export function getMissionUpdateSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  const v = window.localStorage.getItem(STORAGE_KEY);
  if (v === null) return true;
  return v === "1";
}

export function setMissionUpdateSoundEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0");
}
