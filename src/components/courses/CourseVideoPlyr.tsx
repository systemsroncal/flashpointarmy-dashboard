"use client";

import { resolveVideoForPlyr, type ResolvedPlyrVideo } from "@/lib/media/resolve-plyr-video";
import { Box } from "@mui/material";
import { useEffect, useRef } from "react";

type PlyrLike = {
  on: (event: string, fn: () => void) => void;
  currentTime?: number;
  play: () => void | Promise<void>;
  destroy: () => void;
};

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
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<PlyrLike | null>(null);
  const lastSentRef = useRef(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const persistHandlerRef = useRef(onPersistSeconds);
  persistHandlerRef.current = onPersistSeconds;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let cancelled = false;
    const resolved = resolveVideoForPlyr(videoUrl);
    if (resolved.kind === "none") return;

    const destroy = () => {
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
    const startFrom = Math.max(0, initialSeconds, ls);

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
        if (startFrom > 0) {
          try {
            (player as { currentTime?: number }).currentTime = startFrom;
          } catch {
            /* Plyr / provider may ignore until playable */
          }
        }
        if (autoplayMuted) {
          void Promise.resolve((player as { play?: () => void | Promise<void> }).play?.()).catch(() => {
            /* autoplay blocked: user uses control bar */
          });
        }
      });

      const snapshot = () => persist(readCurrentTime(player));
      player.on("pause", snapshot);
      player.on("ended", snapshot);

      tickRef.current = setInterval(snapshot, 5000);
    });

    return () => {
      cancelled = true;
      destroy();
    };
  }, [videoUrl, initialSeconds, storageKey, autoplayMuted, omitPlayLargeControl]);

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
        /* 16:9 que cabe en 72vh de alto: si no limitamos el ancho, aspect-ratio + maxHeight recortaban el vídeo */
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
