"use client";

import { resolveVideoForPlyr, type ResolvedPlyrVideo } from "@/lib/media/resolve-plyr-video";
import { Box, Button, Stack, Typography } from "@mui/material";
import { useCallback, useEffect, useRef, useState } from "react";

type PlyrLike = {
  on: (event: string, fn: (...args: unknown[]) => void) => void;
  currentTime?: number;
  duration?: number;
  play: () => void | Promise<void>;
  destroy: () => void;
};

/** Resume playback this many seconds before the saved position. */
const RESUME_REWIND_SECONDS = 10;
/** Auto-resume when saved progress is at least this far in. */
const MIN_SAVED_SECONDS_TO_AUTO_RESUME = 15;
/** Persist at most every N seconds during playback (also on pause/seek). */
const TIMEUPDATE_PERSIST_INTERVAL_SEC = 8;
/** Mark video complete when within this many seconds of the end (Vimeo sometimes skips `ended`). */
const NEAR_END_SECONDS = 45;

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
  "rewind",
  "fast-forward",
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

/**
 * Inline Plyr player for course sessions. Progress is persisted via `onPersistSeconds`;
 * on return, auto-seeks to saved position minus {@link RESUME_REWIND_SECONDS}.
 */
export function CourseVideoPlyr({
  videoUrl,
  initialSeconds,
  onPersistSeconds,
  storageKey,
  autoplayMuted = false,
  omitPlayLargeControl = false,
  onVideoFullyWatched,
  suppressResumePrompt = false,
}: {
  videoUrl: string;
  initialSeconds: number;
  onPersistSeconds: (seconds: number) => void;
  storageKey?: string | null;
  autoplayMuted?: boolean;
  omitPlayLargeControl?: boolean;
  onVideoFullyWatched?: () => void;
  /** When true (e.g. learner already finished), skip auto-resume on load. */
  suppressResumePrompt?: boolean;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<PlyrLike | null>(null);
  const pendingSeekRef = useRef<number | null>(null);
  const pendingPlayAfterSeekRef = useRef(false);
  const suppressResumeRef = useRef(suppressResumePrompt);
  suppressResumeRef.current = suppressResumePrompt;
  const lastSentRef = useRef(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const persistHandlerRef = useRef(onPersistSeconds);
  persistHandlerRef.current = onPersistSeconds;
  const onFullyWatchedRef = useRef(onVideoFullyWatched);
  onFullyWatchedRef.current = onVideoFullyWatched;

  const [savedSeconds, setSavedSeconds] = useState(0);
  const [autoResumed, setAutoResumed] = useState(false);
  const fullyWatchedFiredRef = useRef(false);

  useEffect(() => {
    const ls = storageKey ? readLs(storageKey) : 0;
    const saved = Math.max(0, initialSeconds, ls);
    setSavedSeconds(saved);
    fullyWatchedFiredRef.current = false;
    setAutoResumed(false);
    if (
      !autoplayMuted &&
      !suppressResumeRef.current &&
      saved >= MIN_SAVED_SECONDS_TO_AUTO_RESUME
    ) {
      pendingSeekRef.current = Math.max(0, saved - RESUME_REWIND_SECONDS);
    } else {
      pendingSeekRef.current = null;
    }
  }, [storageKey, autoplayMuted, videoUrl, suppressResumePrompt]);

  useEffect(() => {
    const ls = storageKey ? readLs(storageKey) : 0;
    setSavedSeconds(Math.max(0, initialSeconds, ls));
  }, [initialSeconds, storageKey]);

  const applyPendingSeek = useCallback((player: PlyrLike) => {
    const target = pendingSeekRef.current;
    if (target == null || target <= 0) return;

    let seekAttempts = 0;
    const maxSeekAttempts = 48;

    const tryResume = () => {
      if (pendingSeekRef.current == null) return;
      const seekTo = pendingSeekRef.current;
      if (seekTo <= 0) return;
      const cur = readCurrentTime(player);
      if (cur >= seekTo - 3) {
        pendingSeekRef.current = null;
        setAutoResumed(true);
        if (pendingPlayAfterSeekRef.current) {
          pendingPlayAfterSeekRef.current = false;
          void Promise.resolve(player.play()).catch(() => {
            /* autoplay blocked */
          });
        }
        return;
      }
      if (seekAttempts >= maxSeekAttempts) return;
      seekAttempts += 1;
      setPlayerTime(player, seekTo);
    };

    tryResume();
    const delays = [100, 250, 500, 900, 1500, 2500, 4000, 6000, 9000, 12000];
    for (const ms of delays) {
      window.setTimeout(tryResume, ms);
    }
  }, []);

  const handleStartOver = useCallback(() => {
    pendingSeekRef.current = null;
    setAutoResumed(false);
    const player = playerRef.current;
    if (player) {
      setPlayerTime(player, 0);
      lastSentRef.current = 0;
      persistHandlerRef.current(0);
      if (storageKey) writeLs(storageKey, 0);
    }
  }, [storageKey]);

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
          /** Avoid Vimeo pausing when another embed/tab steals focus (common reset complaint). */
          autopause: false,
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

      player.on("ready", () => {
        if (pendingSeekRef.current != null && pendingSeekRef.current > 0) {
          applyPendingSeek(player);
        }
        if (autoplayMuted) {
          void Promise.resolve((player as { play?: () => void | Promise<void> }).play?.()).catch(() => {
            /* autoplay blocked */
          });
        }
      });

      for (const evt of ["loadeddata", "canplay", "playing"] as const) {
        player.on(evt, () => {
          if (pendingSeekRef.current != null) applyPendingSeek(player);
        });
      }

      const maybeMarkNearEnd = () => {
        if (fullyWatchedFiredRef.current) return;
        const t = readCurrentTime(player);
        const dur = typeof player.duration === "number" && player.duration > 0 ? player.duration : 0;
        if (dur > 0 && t >= Math.max(0, dur - NEAR_END_SECONDS)) {
          fullyWatchedFiredRef.current = true;
          try {
            onFullyWatchedRef.current?.();
          } catch {
            /* ignore */
          }
        }
      };

      const snapshot = () => {
        const t = readCurrentTime(player);
        persist(t);
        maybeMarkNearEnd();
      };

      player.on("pause", snapshot);
      player.on("seeked", snapshot);

      let lastTimeupdatePersist = 0;
      player.on("timeupdate", () => {
        const t = readCurrentTime(player);
        if (t < 1) return;
        if (t - lastTimeupdatePersist >= TIMEUPDATE_PERSIST_INTERVAL_SEC) {
          lastTimeupdatePersist = t;
          persist(t);
        }
        maybeMarkNearEnd();
      });
      player.on("ended", () => {
        snapshot();
        if (!fullyWatchedFiredRef.current) {
          fullyWatchedFiredRef.current = true;
          try {
            onFullyWatchedRef.current?.();
          } catch {
            /* ignore */
          }
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
  }, [videoUrl, storageKey, autoplayMuted, omitPlayLargeControl, applyPendingSeek]);

  if (resolveVideoForPlyr(videoUrl).kind === "none") {
    return (
      <Box sx={{ p: 2, color: "text.secondary", typography: "body2" }}>Invalid or empty video URL.</Box>
    );
  }

  return (
    <Box sx={{ position: "relative", width: "100%" }}>
      <Box
        ref={mountRef}
        className="course-video-plyr-mount"
        sx={{
          width: "100%",
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
        }}
      />

      {autoResumed && savedSeconds >= MIN_SAVED_SECONDS_TO_AUTO_RESUME ? (
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
          sx={{ mt: 1 }}
        >
          <Typography variant="caption" color="text.secondary">
            Resumed near your last saved position. Use the timeline to rewind or skip ahead — your progress
            is saved automatically.
          </Typography>
          <Button size="small" color="inherit" onClick={handleStartOver} sx={{ flexShrink: 0 }}>
            Start from beginning
          </Button>
        </Stack>
      ) : (
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
          Use the progress bar to rewind or skip ahead. Your position is saved while you watch.
        </Typography>
      )}
    </Box>
  );
}
