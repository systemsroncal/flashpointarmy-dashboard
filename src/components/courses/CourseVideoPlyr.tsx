"use client";

import { resolveVideoForPlyr, type ResolvedPlyrVideo } from "@/lib/media/resolve-plyr-video";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
/** Only prompt when the learner saved at least this far into the video. */
const MIN_SAVED_SECONDS_TO_PROMPT = 15;

function setPlayerTime(player: PlyrLike, seconds: number): boolean {
  if (seconds <= 0) return true;
  try {
    (player as { currentTime: number }).currentTime = seconds;
    return true;
  } catch {
    return false;
  }
}

function formatVideoTimestamp(totalSeconds: number): string {
  const sec = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
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
 * Inline Plyr player with optional resume prompt (English). Progress is persisted via
 * `onPersistSeconds`; resume seeks to saved position minus {@link RESUME_REWIND_SECONDS}.
 */
export function CourseVideoPlyr({
  videoUrl,
  initialSeconds,
  onPersistSeconds,
  storageKey,
  autoplayMuted = false,
  omitPlayLargeControl = false,
  hideProgressBar = false,
  onVideoFullyWatched,
}: {
  videoUrl: string;
  initialSeconds: number;
  onPersistSeconds: (seconds: number) => void;
  storageKey?: string | null;
  autoplayMuted?: boolean;
  omitPlayLargeControl?: boolean;
  hideProgressBar?: boolean;
  onVideoFullyWatched?: () => void;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<PlyrLike | null>(null);
  const pendingSeekRef = useRef<number | null>(null);
  const lastSentRef = useRef(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const persistHandlerRef = useRef(onPersistSeconds);
  persistHandlerRef.current = onPersistSeconds;
  const onFullyWatchedRef = useRef(onVideoFullyWatched);
  onFullyWatchedRef.current = onVideoFullyWatched;

  const [savedSeconds, setSavedSeconds] = useState(0);
  const [resumeDialogOpen, setResumeDialogOpen] = useState(false);
  const resumeChoiceMadeRef = useRef(false);

  useEffect(() => {
    const ls = storageKey ? readLs(storageKey) : 0;
    const saved = Math.max(0, initialSeconds, ls);
    setSavedSeconds(saved);
    pendingSeekRef.current = null;
    resumeChoiceMadeRef.current = false;
    if (!autoplayMuted && saved >= MIN_SAVED_SECONDS_TO_PROMPT) {
      setResumeDialogOpen(true);
    } else {
      setResumeDialogOpen(false);
    }
  }, [storageKey, autoplayMuted, videoUrl]);

  useEffect(() => {
    if (resumeChoiceMadeRef.current) return;
    const ls = storageKey ? readLs(storageKey) : 0;
    const saved = Math.max(0, initialSeconds, ls);
    setSavedSeconds(saved);
    if (!autoplayMuted && saved >= MIN_SAVED_SECONDS_TO_PROMPT) {
      setResumeDialogOpen(true);
    }
  }, [initialSeconds, storageKey, autoplayMuted]);

  const applyPendingSeek = useCallback((player: PlyrLike) => {
    const target = pendingSeekRef.current;
    if (target == null || target <= 0) return;

    let seekAttempts = 0;
    const maxSeekAttempts = 24;

    const tryResume = () => {
      if (pendingSeekRef.current == null) return;
      const seekTo = pendingSeekRef.current;
      if (seekTo <= 0) return;
      const cur = readCurrentTime(player);
      if (cur >= seekTo - 2) {
        pendingSeekRef.current = null;
        return;
      }
      if (seekAttempts >= maxSeekAttempts) return;
      seekAttempts += 1;
      setPlayerTime(player, seekTo);
    };

    tryResume();
    const delays = [150, 400, 900, 1800, 3000, 5000];
    for (const ms of delays) {
      window.setTimeout(tryResume, ms);
    }
  }, []);

  const handleResume = useCallback(() => {
    resumeChoiceMadeRef.current = true;
    const seekTo = Math.max(0, savedSeconds - RESUME_REWIND_SECONDS);
    pendingSeekRef.current = seekTo;
    setResumeDialogOpen(false);
    const player = playerRef.current;
    if (player) applyPendingSeek(player);
  }, [savedSeconds, applyPendingSeek]);

  const handleStartOver = useCallback(() => {
    resumeChoiceMadeRef.current = true;
    pendingSeekRef.current = null;
    setResumeDialogOpen(false);
    const player = playerRef.current;
    if (player) setPlayerTime(player, 0);
  }, []);

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
  }, [videoUrl, storageKey, autoplayMuted, omitPlayLargeControl, applyPendingSeek]);

  if (resolveVideoForPlyr(videoUrl).kind === "none") {
    return (
      <Box sx={{ p: 2, color: "text.secondary", typography: "body2" }}>Invalid or empty video URL.</Box>
    );
  }

  const resumeFromSeconds = Math.max(0, savedSeconds - RESUME_REWIND_SECONDS);
  const showResumePrompt = resumeDialogOpen && savedSeconds >= MIN_SAVED_SECONDS_TO_PROMPT;

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
          ...(hideProgressBar
            ? {
                "& .plyr__progress": { display: "none !important" },
                "& .plyr__progress__container": { display: "none !important" },
                "& input[data-plyr='seek']": { display: "none !important" },
              }
            : {}),
        }}
      />

      <Dialog
        open={showResumePrompt}
        onClose={(_, reason) => {
          if (reason === "backdropClick" || reason === "escapeKeyDown") return;
        }}
        maxWidth="xs"
        fullWidth
        aria-labelledby="resume-video-title"
      >
        <DialogTitle id="resume-video-title" sx={{ color: "primary.main", fontWeight: 700 }}>
          Resume this video?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            You left off at <strong>{formatVideoTimestamp(savedSeconds)}</strong>.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Would you like to resume from <strong>{formatVideoTimestamp(resumeFromSeconds)}</strong> (
            {RESUME_REWIND_SECONDS} seconds earlier)?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleStartOver} color="inherit">
            Start from the beginning
          </Button>
          <Button onClick={handleResume} variant="contained" autoFocus>
            Resume
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
