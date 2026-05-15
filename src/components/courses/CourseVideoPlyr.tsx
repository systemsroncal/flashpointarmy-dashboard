"use client";

import { resolveVideoForPlyr, type ResolvedPlyrVideo } from "@/lib/media/resolve-plyr-video";
import { Box } from "@mui/material";
import { useEffect, useRef } from "react";

type PlyrLike = {
  on: (event: string, fn: (...args: unknown[]) => void) => void;
  currentTime?: number;
  duration?: number;
  play: () => void | Promise<void>;
  destroy: () => void;
};

function setPlayerTime(player: PlyrLike, seconds: number): boolean {
  if (seconds <= 0) return true;
  try {
    (player as { currentTime: number }).currentTime = seconds;
    return true;
  } catch {
    return false;
  }
}

const plyrControlsBase = [
  "play-large",
  "play",
  "progress",
  "current-time",
  "mute",
  "volume",
  "fullscreen",
] as const;

function controlsForPlyr(omitPlayLarge: boolean) {
  if (!omitPlayLarge) return [...plyrControlsBase];
  return plyrControlsBase.filter((c) => c !== "play-large");
}

function createPlyrRoot(resolved: ResolvedPlyrVideo): HTMLElement | null {
  switch (resolved.kind) {
    case "none":
      return null;
    case "youtube": {
      const d = document.createElement("div");
      d.setAttribute("data-plyr-provider", "youtube");
      d.setAttribute("data-plyr-embed-id", resolved.videoId);
      return d;
    }
    case "vimeo": {
      const d = document.createElement("div");
      d.setAttribute("data-plyr-provider", "vimeo");
      d.setAttribute("data-plyr-embed-id", resolved.videoId);
      return d;
    }
    case "html5": {
      const video = document.createElement("video");
      video.setAttribute("playsinline", "");
      video.setAttribute("crossorigin", "anonymous");
      const source = document.createElement("source");
      source.src = resolved.src;
      const lower = resolved.src.toLowerCase();
      if (lower.includes(".webm")) source.type = "video/webm";
      else if (lower.includes(".ogg")) source.type = "video/ogg";
      else source.type = "video/mp4";
      video.appendChild(source);
      return video;
    }
    case "iframe": {
      const wrap = document.createElement("div");
      wrap.className = "plyr__video-embed";
      const iframe = document.createElement("iframe");
      iframe.src = resolved.src;
      iframe.setAttribute("allowfullscreen", "");
      iframe.setAttribute(
        "allow",
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
      );
      iframe.style.border = "0";
      iframe.title = "Video";
      wrap.appendChild(iframe);
      return wrap;
    }
  }
}

function readCurrentTime(player: PlyrLike): number {
  const t = typeof player.currentTime === "number" ? player.currentTime : 0;
  return Number.isFinite(t) ? Math.max(0, t) : 0;
}

/**
 * Inline Plyr player with resume support: parent supplies `initialSeconds` from persisted progress
 * and receives debounced `onPersistSeconds` while the user watches.
 */
export function CourseVideoPlyr({
  videoUrl,
  initialSeconds,
  onPersistSeconds,
  storageKey,
  autoplayMuted = false,
  omitPlayLargeControl = false,
  /** When true, the seek/progress control is hidden (e.g. until the user finishes the video once). */
  hideProgressBar = false,
  /** Fires once when playback reaches the end (after persisting the final position). */
  onVideoFullyWatched,
}: {
  videoUrl: string;
  initialSeconds: number;
  onPersistSeconds: (seconds: number) => void;
  /** Optional localStorage key to merge resume position between visits (in addition to DB). */
  storageKey?: string | null;
  /** Start muted and try autoplay (Training intro); browsers may still require a tap. */
  autoplayMuted?: boolean;
  /** Hide Plyr's big center play so it matches a single-tap flow with the bar controls. */
  omitPlayLargeControl?: boolean;
  hideProgressBar?: boolean;
  onVideoFullyWatched?: () => void;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<PlyrLike | null>(null);
  const resumeSecondsRef = useRef(Math.max(0, initialSeconds));
  const lastSentRef = useRef(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const persistHandlerRef = useRef(onPersistSeconds);
  persistHandlerRef.current = onPersistSeconds;
  const onFullyWatchedRef = useRef(onVideoFullyWatched);
  onFullyWatchedRef.current = onVideoFullyWatched;

  useEffect(() => {
    const ls = storageKey ? readLs(storageKey) : 0;
    resumeSecondsRef.current = Math.max(resumeSecondsRef.current, initialSeconds, ls);
    const player = playerRef.current;
    if (!player || resumeSecondsRef.current <= 0) return;
    setPlayerTime(player, resumeSecondsRef.current);
  }, [initialSeconds, storageKey]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let cancelled = false;
    const resolved = resolveVideoForPlyr(videoUrl);
    if (resolved.kind === "none") return;

    let pageHideCleanup: (() => void) | null = null;

    const destroy = () => {
      pageHideCleanup?.();
      pageHideCleanup = null;
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
      const p = playerRef.current;
      if (p) {
        try {
          const sec = readCurrentTime(p);
          if (sec >= 1) {
            persistHandlerRef.current(sec);
            if (storageKey) writeLs(storageKey, sec);
          }
        } catch {
          /* ignore */
        }
      }
      playerRef.current?.destroy();
      playerRef.current = null;
      mount.innerHTML = "";
    };

    const ls = storageKey ? readLs(storageKey) : 0;
    resumeSecondsRef.current = Math.max(resumeSecondsRef.current, initialSeconds, ls);
    const startFrom = resumeSecondsRef.current;

    const root = createPlyrRoot(resolved);
    if (!root) return;
    mount.appendChild(root);

    void import("plyr").then((plyrModule: unknown) => {
      if (cancelled || !mount.isConnected) return;

      const PlyrCtor = (plyrModule as { default: new (el: HTMLElement, opts?: object) => PlyrLike }).default;
      const player = new PlyrCtor(root, {
        controls: controlsForPlyr(omitPlayLargeControl),
        muted: autoplayMuted,
        autoplay: autoplayMuted,
        clickToPlay: true,
        hideControls: false,
        resetOnEnd: false,
        youtube: {
          rel: 0,
          modestbranding: 1,
          iv_load_policy: 3,
          playsinline: 1,
          noCookie: true,
        },
        vimeo: {
          dnt: true,
          byline: false,
          portrait: false,
          title: false,
          ...(autoplayMuted ? { autopause: false } : {}),
        },
      });
      playerRef.current = player;

      const persist = (sec: number) => {
        if (sec < 1) return;
        const floored = Math.floor(sec);
        if (floored === lastSentRef.current) return;
        lastSentRef.current = floored;
        persistHandlerRef.current(floored);
        if (storageKey) writeLs(storageKey, floored);
      };

      /** YouTube/Vimeo often ignore seek on `ready`; retry until position sticks or attempts exhaust. */
      const resumeTargetRef = { sec: startFrom };
      let seekAttempts = 0;
      const maxSeekAttempts = 24;

      const tryResume = () => {
        const target = resumeTargetRef.sec;
        if (target <= 0) return;
        const cur = readCurrentTime(player);
        if (cur >= target - 2) return;
        if (seekAttempts >= maxSeekAttempts) return;
        seekAttempts += 1;
        setPlayerTime(player, target);
      };

      const scheduleResumeRetries = () => {
        if (resumeTargetRef.sec <= 0) return;
        tryResume();
        const delays = [150, 400, 900, 1800, 3000, 5000];
        for (const ms of delays) {
          window.setTimeout(() => {
            if (cancelled) return;
            tryResume();
          }, ms);
        }
      };

      player.on("ready", () => {
        scheduleResumeRetries();
        if (autoplayMuted) {
          void Promise.resolve((player as { play?: () => void | Promise<void> }).play?.()).catch(() => {
            /* autoplay blocked: user uses control bar */
          });
        }
      });

      for (const evt of ["loadeddata", "canplay", "playing"] as const) {
        player.on(evt, tryResume);
      }

      const snapshot = () => persist(readCurrentTime(player));
      player.on("pause", snapshot);
      let lastTimeupdatePersist = 0;
      player.on("timeupdate", () => {
        const t = readCurrentTime(player);
        if (t < 1 || t - lastTimeupdatePersist < 12) return;
        lastTimeupdatePersist = t;
        persist(t);
      });
      player.on("ended", () => {
        snapshot();
        try {
          onFullyWatchedRef.current?.();
        } catch {
          /* ignore */
        }
      });

      tickRef.current = setInterval(snapshot, 3000);

      const onPageHide = () => snapshot();
      const onVis = () => {
        if (document.visibilityState === "hidden") onPageHide();
      };
      document.addEventListener("visibilitychange", onVis);
      window.addEventListener("pagehide", onPageHide);
      pageHideCleanup = () => {
        document.removeEventListener("visibilitychange", onVis);
        window.removeEventListener("pagehide", onPageHide);
      };
    });

    return () => {
      cancelled = true;
      destroy();
    };
  }, [videoUrl, storageKey, autoplayMuted, omitPlayLargeControl]);

  if (resolveVideoForPlyr(videoUrl).kind === "none") {
    return (
      <Box sx={{ p: 2, color: "text.secondary", typography: "body2" }}>Invalid or empty video URL.</Box>
    );
  }

  return (
    <Box
      ref={mountRef}
      className="course-video-plyr-mount"
      sx={{
        width: "100%",
        /* 16:9 within 72vh height: without maxWidth, aspect-ratio + maxHeight clipped the video */
        maxWidth: "min(100%, calc(72vh * 16 / 9))",
        mx: "auto",
        position: "relative",
        overflow: "hidden",
        borderRadius: 1,
        bgcolor: "#000",
        aspectRatio: "16 / 9",
        isolation: "isolate",
        "& .plyr": {
          borderRadius: 1,
          width: "100%",
          height: "100%",
        },
        ...(hideProgressBar
          ? {
              "& .plyr__progress": { display: "none !important" },
              "& .plyr__progress__container": { display: "none !important" },
              "& input[data-plyr='seek']": { display: "none !important" },
            }
          : {}),
      }}
    />
  );
}

function readLs(key: string): number {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return 0;
    const n = Number(raw);
    return Number.isFinite(n) ? Math.max(0, n) : 0;
  } catch {
    return 0;
  }
}

function writeLs(key: string, sec: number) {
  try {
    localStorage.setItem(key, String(Math.floor(sec)));
  } catch {
    /* ignore */
  }
}
