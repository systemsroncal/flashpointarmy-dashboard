"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import Link from "next/link";
import { useDashboardUser } from "@/contexts/DashboardUserContext";

const VIDEO_URL = "https://www.youtube.com/watch?v=VFWP0skZljg";
const COOKIE_NAME = "fp_welcome_video_seen";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

type PlyrLike = {
  on: (event: string, fn: () => void) => void;
  play: () => void | Promise<void>;
  destroy: () => void;
};

function createYouTubeRoot(videoId: string): HTMLElement {
  const d = document.createElement("div");
  d.setAttribute("data-plyr-provider", "youtube");
  d.setAttribute("data-plyr-embed-id", videoId);
  return d;
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

function getCookie(name: string): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split(";").some((c) => c.trim().startsWith(`${name}=`));
}

function setCookie(name: string, maxAge: number) {
  document.cookie = `${name}=1; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function extractYoutubeId(url: string): string | null {
  try {
    const u = new URL(url);
    return u.searchParams.get("v");
  } catch {
    return null;
  }
}

const DIALOG_LAYOUT_MS = 240;

export function WelcomeVideoPopup() {
  const me = useDashboardUser();
  const [open, setOpen] = useState(false);
  const [videoFinished, setVideoFinished] = useState(false);
  const mountRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<PlyrLike | null>(null);

  const profileHref = `/dashboard/mobilize/profile/${me.id}`;

  // Check cookie on mount and show popup only once
  useEffect(() => {
    if (!getCookie(COOKIE_NAME)) {
      setOpen(true);
    }
  }, []);

  // Listen for external trigger (e.g. video cam icon in header)
  useEffect(() => {
    const handler = () => {
      setVideoFinished(false);
      setOpen(true);
    };
    window.addEventListener("fp-reopen-video-popup", handler);
    return () => window.removeEventListener("fp-reopen-video-popup", handler);
  }, []);

  const handleVideoEnd = useCallback(() => {
    setVideoFinished(true);
  }, []);

  // Initialize Plyr when dialog opens
  useEffect(() => {
    if (!open || videoFinished) return;

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

      const videoId = extractYoutubeId(VIDEO_URL);
      if (!videoId) return;

      destroy();
      const root = createYouTubeRoot(videoId);
      mount.appendChild(root);

      void import("plyr").then((plyrModule: unknown) => {
        if (cancelled || !mount.isConnected || !mount.contains(root)) return;

        const PlyrCtor = (
          plyrModule as { default: new (el: HTMLElement, opts?: object) => PlyrLike }
        ).default;
        const player = new PlyrCtor(root, {
          controls: [...plyrControls],
          muted: false,
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
        });

        playerRef.current = player;
        player.on("ready", () => {
          void Promise.resolve(player.play()).catch(() => {});
        });
        player.on("ended", () => {
          handleVideoEnd();
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
  }, [open, videoFinished, handleVideoEnd]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, []);

  function handleClose() {
    setCookie(COOKIE_NAME, COOKIE_MAX_AGE);
    setOpen(false);
    playerRef.current?.destroy();
    playerRef.current = null;
  }

  function handleDismissAfterVideo() {
    setCookie(COOKIE_NAME, COOKIE_MAX_AGE);
    setOpen(false);
  }

  if (!open) return null;

  return (
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      maxWidth="md"
      fullWidth
      disableEnforceFocus
      disableAutoFocus
      slotProps={{
        paper: {
          sx: {
            overflow: "visible",
            maxWidth: "min(936px, 100vw - 32px)",
            transform: "none",
            bgcolor: videoFinished ? "#fff" : "transparent",
            color: "#000",
            boxShadow: videoFinished ? undefined : "none",
          },
        },
      }}
    >
      {!videoFinished ? (
        <>
          <DialogContent sx={{ p: 0, overflow: "visible" }}>
            <div
              ref={mountRef}
              className="welcome-video-plyr-mount"
              style={{
                width: "100%",
                minHeight: 320,
                aspectRatio: "16 / 9",
                maxHeight: "70vh",
              }}
            />
          </DialogContent>
        </>
      ) : (
        <>
          <DialogTitle
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              pr: 1,
              pb: 0,
            }}
          >
            <Typography component="span" variant="h6" sx={{ fontWeight: 800 }}>
              🚨 One More Important Step Before You Continue
            </Typography>
            <IconButton edge="end" onClick={handleDismissAfterVideo} aria-label="Close">
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.7 }}>
              <strong>FlashPoint Army is built on real people, not anonymous profiles.</strong>
              <br />
              Before joining conversations and connecting with others, please take 2 minutes to
              complete your profile.
            </Typography>

            <Stack spacing={1} sx={{ mb: 2.5 }}>
              {[
                "Upload a profile photo",
                "Add your phone number",
                "Write a short bio so others know who you are",
                "Join groups that match your interests",
                "Start sharing encouragement, Biblical truth, constitutional principles, and ways to strengthen your community.",
              ].map((item) => (
                <Stack key={item} direction="row" spacing={1.25} alignItems="flex-start">
                  <Typography sx={{ fontSize: "1.1rem", lineHeight: 1.6, flexShrink: 0 }}>✅</Typography>
                  <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                    {item}
                  </Typography>
                </Stack>
              ))}
            </Stack>

            <Typography variant="body2" sx={{ mb: 1, fontStyle: "italic", color: "rgba(0,0,0,0.65)" }}>
              We don&apos;t want a community of faceless accounts. We want to know who you are,
              where you&apos;re from, and how God is calling you to serve.
            </Typography>
            <Typography variant="body2" sx={{ mb: 1, fontStyle: "italic", color: "rgba(0,0,0,0.65)" }}>
              Your voice matters. Your testimony matters. Your leadership matters.
            </Typography>
            <Typography variant="body2" sx={{ mb: 1, fontStyle: "italic", color: "rgba(0,0,0,0.65)" }}>
              Together, we&apos;re building more than a platform—we&apos;re building a movement of
              believers who pray together, learn together, and take action together.
            </Typography>
            <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600 }}>
              Welcome to FlashPoint Army Chapters.
            </Typography>
            <Typography variant="body2" sx={{ mb: 3, fontWeight: 600 }}>
              — Gene and Teri Bailey
            </Typography>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Button
                component={Link}
                href={profileHref}
                variant="contained"
                onClick={handleDismissAfterVideo}
                endIcon={<OpenInNewIcon />}
                sx={{
                  textTransform: "none",
                  fontWeight: 700,
                  borderRadius: 99,
                  px: 3,
                  py: 1,
                  bgcolor: "#000",
                  color: "#fff",
                  border: "1px solid #000",
                  "&:hover": { bgcolor: "#222" },
                }}
              >
                Update Profile
              </Button>
              <Button
                variant="outlined"
                onClick={handleDismissAfterVideo}
                sx={{
                  textTransform: "none",
                  fontWeight: 700,
                  borderRadius: 99,
                  px: 3,
                  py: 1,
                  color: "#000",
                  borderColor: "rgba(0,0,0,0.2)",
                  "&:hover": { borderColor: "rgba(0,0,0,0.4)" },
                }}
              >
                Continue
              </Button>
            </Stack>
          </DialogContent>
        </>
      )}
    </Dialog>
  );
}
