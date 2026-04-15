/** Plays `/sounds/notification.wav` (short procedural tone, no third-party sample). */
let audio: HTMLAudioElement | null = null;

export function playNotificationSound(): void {
  if (typeof window === "undefined") return;
  try {
    if (!audio) {
      audio = new Audio("/sounds/notification.wav");
      audio.volume = 0.35;
    }
    audio.currentTime = 0;
    void audio.play().catch(() => {});
  } catch {
    /* ignore */
  }
}
