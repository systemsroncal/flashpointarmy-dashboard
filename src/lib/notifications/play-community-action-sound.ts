import { playSoundRepeated } from "@/lib/notifications/play-sound-repeat";
import { playNotificationSound } from "@/lib/notifications/play-notification-sound";

const COMMUNITY_ACTION_SOUND_REPEATS = 4;
const COMMUNITY_ACTION_SOUND_GAP_MS = 500;

/** Community in Action alert: notification chime repeated 4 times. */
export function playCommunityActionSoundAlert(): void {
  playSoundRepeated(playNotificationSound, COMMUNITY_ACTION_SOUND_REPEATS, COMMUNITY_ACTION_SOUND_GAP_MS);
}
