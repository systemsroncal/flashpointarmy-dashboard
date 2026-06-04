"use client";

import { resolveVideoForPlyr, type ResolvedPlyrVideo } from "@/lib/media/resolve-plyr-video";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";
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
/**
 * Mark video complete when playback naturally reaches within this many seconds
 * of the end (not when the user scrubs the progress bar).
 */
const NEAR_END_SECONDS = 2;
/** Relative completion threshold — only while playing, never after a seek jump. */
const FULLY_WATCHED_FRACTION = 0.995;
/** Ignore near-end checks for this long after the user seeks (scrub). */
const SEEK_COMPLETION_COOLDOWN_MS = 2500;

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
  onProgress,
  suppressResumePrompt = false,
}: {
  videoUrl: string;
  initialSeconds: number;
  onPersistSeconds: (seconds: number) => void;
  storageKey?: string | null;
  autoplayMuted?: boolean;
  omitPlayLargeControl?: boolean;
  onVideoFullyWatched?: () => void;
  /**
   * Lightweight progress reporter: fires on play, pause, seek, and periodic
   * ticks with the latest known current time and duration. Used by the parent
   * session player to render a manual "I have finished watching" override once
   * the learner has watched a meaningful portion of the video.
   */
  onProgress?: (currentSeconds: number, durationSeconds: number) => void;
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
  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;

  const [savedSeconds, setSavedSeconds] = useState(0);
  const [autoResumed, setAutoResumed] = useState(false);
  const [resumePromptOpen, setResumePromptOpen] = useState(false);
  const fullyWatchedFiredRef = useRef(false);
  const resumePromptDismissedRef = useRef(false);
  const resumePromptVideoKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const videoKey = `${storageKey ?? ""}|${videoUrl}`;
    if (resumePromptVideoKeyRef.current !== videoKey) {
      resumePromptVideoKeyRef.current = videoKey;
      resumePromptDismissedRef.current = false;
    }

    const ls = storageKey ? readLs(storageKey) : 0;
    const saved = Math.max(0, initialSeconds, ls);
    setSavedSeconds(saved);
    fullyWatchedFiredRef.current = false;
    setAutoResumed(false);
    pendingSeekRef.current = null;
    if (
      !autoplayMuted &&
      !suppressResumeRef.current &&
      !resumePromptDismissedRef.current &&
      saved >= MIN_SAVED_SECONDS_TO_AUTO_RESUME
    ) {
      setResumePromptOpen(true);
    } else {
      setResumePromptOpen(false);
    }
  }, [storageKey, autoplayMuted, videoUrl, suppressResumePrompt, initialSeconds]);

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

  const handleContinueWatching = useCallback(() => {
    resumePromptDismissedRef.current = true;
    setResumePromptOpen(false);
    const target = Math.max(0, savedSeconds - RESUME_REWIND_SECONDS);
    pendingSeekRef.current = target;
    setAutoResumed(true);
    const player = playerRef.current;
    if (player && target > 0) {
      applyPendingSeek(player);
    }
  }, [savedSeconds, applyPendingSeek]);

  const handleStartOver = useCallback(() => {
    setResumePromptOpen(false);
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

      const reportProgress = (t: number, dur: number) => {
        try {
          onProgressRef.current?.(t, dur);
        } catch {
          /* ignore */
        }
      };

      const readDuration = (): number => {
        const d = typeof player.duration === "number" ? player.duration : 0;
        return Number.isFinite(d) && d > 0 ? d : 0;
      };

      const isFullyWatchedZone = (t: number, dur: number, fraction: number): boolean => {
        if (dur <= 0) return false;
        return t >= Math.max(0, dur - NEAR_END_SECONDS) || t / dur >= fraction;
      };

      let isPlaying = false;
      let seekCooldownUntil = 0;
      let lastTimeupdateSec = 0;

      const maybeMarkNearEnd = () => {
        if (fullyWatchedFiredRef.current) return;
        if (!isPlaying) return;
        if (Date.now() < seekCooldownUntil) return;
        const t = readCurrentTime(player);
        const dur = readDuration();
        if (dur > 0 && isFullyWatchedZone(t, dur, FULLY_WATCHED_FRACTION)) {
          fullyWatchedFiredRef.current = true;
          try {
            onFullyWatchedRef.current?.();
          } catch {
            /* ignore */
          }
        }
      };

      player.on("play", () => {
        isPlaying = true;
      });

      const snapshot = (checkNearEnd: boolean) => {
        const t = readCurrentTime(player);
        const dur = readDuration();
        persist(t);
        reportProgress(t, dur);
        if (checkNearEnd) maybeMarkNearEnd();
      };

      player.on("pause", () => {
        isPlaying = false;
        snapshot(false);
      });

      player.on("ready", () => {
        if (pendingSeekRef.current != null && pendingSeekRef.current > 0) {
          applyPendingSeek(player);
        }
        reportProgress(readCurrentTime(player), readDuration());
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

      player.on("seeked", () => {
        seekCooldownUntil = Date.now() + SEEK_COMPLETION_COOLDOWN_MS;
        lastTimeupdateSec = readCurrentTime(player);
        snapshot(false);
      });

      let lastTimeupdatePersist = 0;
      let lastProgressReport = 0;
      player.on("timeupdate", () => {
        const t = readCurrentTime(player);
        if (t < 1) return;
        const jumped = Math.abs(t - lastTimeupdateSec) > 4;
        lastTimeupdateSec = t;
        if (jumped) {
          seekCooldownUntil = Date.now() + SEEK_COMPLETION_COOLDOWN_MS;
        }
        if (t - lastTimeupdatePersist >= TIMEUPDATE_PERSIST_INTERVAL_SEC) {
          lastTimeupdatePersist = t;
          persist(t);
        }
        if (t - lastProgressReport >= 1) {
          lastProgressReport = t;
          reportProgress(t, readDuration());
        }
        maybeMarkNearEnd();
      });
      player.on("ended", () => {
        snapshot(false);
        if (!fullyWatchedFiredRef.current) {
          fullyWatchedFiredRef.current = true;
          try {
            onFullyWatchedRef.current?.();
          } catch {
            /* ignore */
          }
        }
      });

      tickRef.current = setInterval(() => snapshot(false), 3000);

      const onPageHide = () => snapshot(false);
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
          alignItems="center"
          justifyContent="center"
          sx={{ mt: 1 }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ textAlign: "center" }}>
            Resumed near your last saved position. Use the timeline to rewind or skip ahead — your progress
            is saved automatically.
          </Typography>
          <Button size="small" color="inherit" onClick={handleStartOver} sx={{ flexShrink: 0 }}>
            Start from beginning
          </Button>
        </Stack>
      ) : (
        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
          sx={{ mt: 1, textAlign: "center" }}
        >
          Use the progress bar to rewind or skip ahead. Your position is saved while you watch.
        </Typography>
      )}

      <Dialog
        open={resumePromptOpen}
        onClose={() => {
          resumePromptDismissedRef.current = true;
          setResumePromptOpen(false);
        }}
        maxWidth="xs"
        fullWidth
        aria-labelledby="course-video-resume-title"
      >
        <DialogTitle id="course-video-resume-title" sx={{ color: "primary.main", fontWeight: 700 }}>
          Continue watching?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            You were partway through this video. Would you like to pick up where you left off, or start
            from the beginning?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, flexDirection: "column", gap: 1, alignItems: "stretch" }}>
          <Button variant="contained" color="primary" onClick={handleContinueWatching}>
            Continue where I left off
          </Button>
          <Button color="inherit" onClick={handleStartOver}>
            Start from beginning
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
