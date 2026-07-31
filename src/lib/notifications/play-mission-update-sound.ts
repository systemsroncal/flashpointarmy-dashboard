import { playSoundRepeated } from "@/lib/notifications/play-sound-repeat";

/** Plays the mission bugle fanfare once. */
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx || audioCtx.state === "closed") {
    audioCtx = new Ctx();
  }
  return audioCtx;
}

function playBugleNote(
  ctx: AudioContext,
  frequency: number,
  startAt: number,
  duration: number,
  volume: number
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.type = "square";
  osc.frequency.setValueAtTime(frequency, startAt);

  filter.type = "bandpass";
  filter.frequency.setValueAtTime(frequency * 1.6, startAt);
  filter.Q.setValueAtTime(2.2, startAt);

  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(volume, startAt + 0.025);
  gain.gain.setValueAtTime(volume * 0.92, startAt + duration * 0.35);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startAt);
  osc.stop(startAt + duration + 0.04);
}

export function playMissionUpdateSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      void ctx.resume().catch(() => {});
    }

    const t0 = ctx.currentTime + 0.02;
    // Simple ascending bugle call (G4 → C5 → E5).
    playBugleNote(ctx, 392, t0, 0.16, 0.22);
    playBugleNote(ctx, 523.25, t0 + 0.17, 0.16, 0.24);
    playBugleNote(ctx, 659.25, t0 + 0.34, 0.38, 0.26);
  } catch {
    /* ignore */
  }
}

const MISSION_UPDATE_SOUND_REPEATS = 3;
const MISSION_UPDATE_SOUND_GAP_MS = 650;

/** Mission Updates alert: bugle fanfare repeated 3 times. */
export function playMissionUpdateSoundAlert(): void {
  playSoundRepeated(playMissionUpdateSound, MISSION_UPDATE_SOUND_REPEATS, MISSION_UPDATE_SOUND_GAP_MS);
}
