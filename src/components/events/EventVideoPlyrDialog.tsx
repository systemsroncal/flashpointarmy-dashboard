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

type PlyrLike = {
  on: (event: string, fn: () => void) => void;
  play: () => void | Promise<void>;
  destroy: () => void;
};

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

const plyrControls = [
  "play-large",
  "play",
  "progress",
  "current-time",
  "mute",
  "volume",
  "fullscreen",
] as const;

/** MUI Dialog mounts children in a portal after paint; Plyr/YouTube need a real layout box. */
const DIALOG_LAYOUT_MS = 240;

export function EventVideoPlyrDialog({ videoUrl }: { videoUrl: string | null | undefined }) {
  const trimmed = videoUrl?.trim() ?? "";
  const resolved = trimmed ? resolveVideoForPlyr(trimmed) : ({ kind: "none" } as const);
  if (resolved.kind === "none") return null;

  return <EventVideoPlyrDialogInner key={trimmed} videoUrl={trimmed} />;
}

function EventVideoPlyrDialogInner({ videoUrl }: { videoUrl: string }) {
  const [open, setOpen] = useState(true);
  const mountRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<PlyrLike | null>(null);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    let rafId = 0;

    const destroy = () => {
      playerRef.current?.destroy();
      playerRef.current = null;
      const m = mountRef.current;
      if (m) m.innerHTML = "";
    };

    const init = () => {
      const mount = mountRef.current;
      if (!mount || !mount.isConnected || cancelled) return;

      const resolved = resolveVideoForPlyr(videoUrl);
      if (resolved.kind === "none") return;

      destroy();
      const root = createPlyrRoot(resolved);
      if (!root) return;
      mount.appendChild(root);

      void import("plyr").then((plyrModule: unknown) => {
        if (cancelled || !mount.isConnected || !mount.contains(root)) return;

        const PlyrCtor = (plyrModule as { default: new (el: HTMLElement, opts?: object) => PlyrLike })
          .default;
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
        player.on("ready", () => {
          void Promise.resolve(player.play()).catch(() => {});
        });
      });
    };

    const timeoutId = window.setTimeout(() => {
      if (cancelled) return;
      rafId = window.requestAnimationFrame(() => {
        if (cancelled) return;
        init();
      });
    }, DIALOG_LAYOUT_MS);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      if (rafId) cancelAnimationFrame(rafId);
      destroy();
    };
  }, [open, videoUrl]);

  return (
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      maxWidth="md"
      fullWidth
      disableEnforceFocus
      disableAutoFocus
      aria-labelledby="event-video-dialog-title"
      slotProps={{
        paper: {
          sx: {
            overflow: "visible",
            maxWidth: "min(960px, 100vw - 32px)",
            // Avoid transform on Paper breaking iframe layout/sizing for embedded players
            transform: "none",
          },
        },
      }}
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
      <DialogContent sx={{ pt: 0, overflow: "visible" }}>
        <div
          ref={mountRef}
          className="event-video-plyr-mount"
          style={{
            width: "100%",
            minHeight: 320,
            aspectRatio: "16 / 9",
            maxHeight: "70vh",
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
