/** Schedule the same sound callback multiple times with a fixed gap. */
export function playSoundRepeated(
  playOnce: () => void,
  times: number,
  intervalMs: number
): void {
  if (typeof window === "undefined" || times < 1) return;
  for (let i = 0; i < times; i++) {
    window.setTimeout(() => playOnce(), i * intervalMs);
  }
}
