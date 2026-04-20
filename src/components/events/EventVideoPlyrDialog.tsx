"use client";

import CloseIcon from "@mui/icons-material/Close";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from "@mui/material";
import { resolveVideoForPlyr, type ResolvedPlyrVideo } from "@/lib/media/resolve-plyr-video";
import { useEffect, useRef, useState } from "react";
import type Plyr from "plyr";

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
      iframe.setAttribute("allow", "autoplay; fullscreen; picture-in-picture; encrypted-media");
      iframe.style.border = "0";
      iframe.title = "Video";
      wrap.appendChild(iframe);
      return wrap;
    }
  }
}

const plyrControls = [
  "play-large",
  "play",
  "progress",
  "current-time",
  "mute",
  "volume",
  "fullscreen",
] as const;

export function EventVideoPlyrDialog({ videoUrl }: { videoUrl: string | null | undefined }) {
  const trimmed = videoUrl?.trim() ?? "";
  const resolved = trimmed ? resolveVideoForPlyr(trimmed) : ({ kind: "none" } as const);
  if (resolved.kind === "none") return null;

  return <EventVideoPlyrDialogInner key={trimmed} videoUrl={trimmed} />;
}

function EventVideoPlyrDialogInner({ videoUrl }: { videoUrl: string }) {
  const [open, setOpen] = useState(true);
  const mountRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Plyr | null>(null);

  useEffect(() => {
    if (!open) return;
    const mount = mountRef.current;
    if (!mount) return;

    const resolved = resolveVideoForPlyr(videoUrl);
    if (resolved.kind === "none") return;

    mount.innerHTML = "";
    const root = createPlyrRoot(resolved);
    if (!root) return;
    mount.appendChild(root);

    let cancelled = false;

    void import("plyr").then(({ default: PlyrCtor }) => {
      if (cancelled || !mount.contains(root)) return;

      const player = new PlyrCtor(root, {
        controls: [...plyrControls],
        muted: true,
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
        },
      });

      playerRef.current = player;

      const tryPlay = () => {
        void Promise.resolve(player.play()).catch(() => {});
      };

      player.on("ready", tryPlay);
    });

    return () => {
      cancelled = true;
      playerRef.current?.destroy();
      playerRef.current = null;
      mount.innerHTML = "";
    };
  }, [open, videoUrl]);

  return (
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      maxWidth="md"
      fullWidth
      aria-labelledby="event-video-dialog-title"
    >
      <DialogTitle
        id="event-video-dialog-title"
        sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pr: 1 }}
      >
        <Typography component="span" variant="subtitle1" sx={{ fontWeight: 700 }}>
          Event video
        </Typography>
        <IconButton edge="end" onClick={() => setOpen(false)} aria-label="Close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 0 }}>
        <div
          ref={mountRef}
          className="event-video-plyr-mount"
          style={{ width: "100%", aspectRatio: "16 / 9", maxHeight: "70vh" }}
        />
      </DialogContent>
    </Dialog>
  );
}
