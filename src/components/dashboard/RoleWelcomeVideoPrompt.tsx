"use client";

import VideocamOutlinedIcon from "@mui/icons-material/VideocamOutlined";
import CloseIcon from "@mui/icons-material/Close";
import {
  Box,
  Checkbox,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import { useDashboardUser } from "@/contexts/DashboardUserContext";
import { CourseVideoPlyr } from "@/components/courses/CourseVideoPlyr";
import { useEffect, useMemo, useState } from "react";

const MEMBER_VIDEO: string =
  "https://www.dropbox.com/scl/fi/ukn9k3w8411udqzrspxq9/FP_CHAPTERS_CMD_CTR_WELCOME_VID_260427.MOV?rlkey=zysmm8ybsp5ka42o9getsb83k&e=1&st=39x1fovk&raw=1";
const LEADER_VIDEO: string =
  "https://www.dropbox.com/scl/fi/jjs8mip51zft7hs5l0j6a/FP_CHAPTERS_CMD_CTR_WELCOME_VID_260427.MP4?rlkey=wca9wzja1fqc08js8czdlqeya&e=1&st=h3t5cjj9&raw=1";
const HIDE_DAYS = 7;

function roleVideoUrl(roleNames: string[]): string | null {
  if (roleNames.includes("local_leader")) return LEADER_VIDEO;
  if (roleNames.includes("member")) return MEMBER_VIDEO;
  return null;
}

function hideCookieKey(role: "member" | "local_leader"): string {
  return `fpa_welcome_video_hide_until_${role}`;
}

function readHideUntil(key: string): number {
  if (typeof document === "undefined") return 0;
  const found = document.cookie
    .split(";")
    .map((v) => v.trim())
    .find((v) => v.startsWith(`${key}=`));
  if (!found) return 0;
  const raw = decodeURIComponent(found.slice(key.length + 1));
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

function writeHideUntil(key: string, untilMs: number) {
  if (typeof document === "undefined") return;
  document.cookie = `${key}=${encodeURIComponent(String(untilMs))}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}

function isAdminLike(roleNames: string[]): boolean {
  return roleNames.includes("admin") || roleNames.includes("super_admin");
}

export function RoleWelcomeVideoPrompt() {
  const user = useDashboardUser();
  const [open, setOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [hideForWeek, setHideForWeek] = useState(false);
  const [dialogUrl, setDialogUrl] = useState<string | null>(null);

  const adminLike = useMemo(() => isAdminLike(user.role_names), [user.role_names]);

  const role = useMemo<"member" | "local_leader" | null>(() => {
    if (user.role_names.includes("local_leader")) return "local_leader";
    if (user.role_names.includes("member")) return "member";
    return null;
  }, [user.role_names]);

  const videoUrl = useMemo(() => roleVideoUrl(user.role_names), [user.role_names]);

  useEffect(() => {
    if (adminLike || !role || !videoUrl) return;
    const key = hideCookieKey(role);
    const hiddenUntil = readHideUntil(key);
    if (hiddenUntil > Date.now()) return;
    setDialogUrl(videoUrl);
    setOpen(true);
    setManualOpen(false);
  }, [adminLike, role, videoUrl]);

  /** Elevated users open clips manually — two shortcuts (leader + member). */
  const adminToolbar =
    adminLike &&
    MEMBER_VIDEO &&
    LEADER_VIDEO &&
    MEMBER_VIDEO !== LEADER_VIDEO &&
    MEMBER_VIDEO.length > 0 &&
    LEADER_VIDEO.length > 0 ? (
      <>
        <Tooltip title="Welcome video · Local leader">
          <IconButton
            color="inherit"
            size="small"
            aria-label="Local leader welcome video"
            onClick={() => {
              setManualOpen(true);
              setHideForWeek(false);
              setDialogUrl(LEADER_VIDEO);
              setOpen(true);
            }}
          >
            <VideocamOutlinedIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Welcome video · Member">
          <IconButton
            color="inherit"
            size="small"
            aria-label="Member welcome video"
            onClick={() => {
              setManualOpen(true);
              setHideForWeek(false);
              setDialogUrl(MEMBER_VIDEO);
              setOpen(true);
            }}
          >
            <VideocamOutlinedIcon sx={{ opacity: 0.92 }} />
          </IconButton>
        </Tooltip>
      </>
    ) : adminLike ? (
      <>
        <Tooltip title="Leader / Member welcome videos">
          <IconButton
            color="inherit"
            size="small"
            aria-label="Local leader welcome video"
            onClick={() => {
              setManualOpen(true);
              setDialogUrl(LEADER_VIDEO);
              setOpen(true);
              setHideForWeek(false);
            }}
          >
            <VideocamOutlinedIcon />
          </IconButton>
        </Tooltip>
      </>
    ) : null;

  if (adminToolbar) {
    const activeUrl = dialogUrl ?? LEADER_VIDEO;
    return (
      <>
        {adminToolbar}

        <Dialog
          open={open && Boolean(activeUrl)}
          onClose={() => {
            setOpen(false);
            setManualOpen(false);
            setDialogUrl(null);
          }}
          maxWidth="md"
          fullWidth
          slotProps={{
            paper: {
              sx: {
                bgcolor: "transparent",
                boxShadow: "none",
                backgroundImage: "none",
              },
            },
          }}
        >
          <DialogTitle sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
            <IconButton
              onClick={() => {
                setOpen(false);
                setManualOpen(false);
                setDialogUrl(null);
              }}
              aria-label="Close"
              sx={{ color: "#fff" }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ pb: 2, pt: 0, px: { xs: 1, sm: 2 } }}>
            <Box sx={{ width: "100%", bgcolor: "transparent" }}>
              <CourseVideoPlyr
                key={activeUrl}
                videoUrl={activeUrl}
                initialSeconds={0}
                onPersistSeconds={() => {}}
                autoplayMuted={false}
              />
            </Box>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  if (!videoUrl || !role) return null;

  const handleClose = () => {
    if (!manualOpen && hideForWeek) {
      const until = Date.now() + HIDE_DAYS * 24 * 60 * 60 * 1000;
      writeHideUntil(hideCookieKey(role), until);
    }
    setOpen(false);
    setManualOpen(false);
    setHideForWeek(false);
  };

  return (
    <>
      <IconButton
        color="inherit"
        size="small"
        aria-label="Open welcome video"
        onClick={() => {
          setManualOpen(true);
          setOpen(true);
          setHideForWeek(false);
        }}
      >
        <VideocamOutlinedIcon />
      </IconButton>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              bgcolor: "transparent",
              boxShadow: "none",
              backgroundImage: "none",
            },
          },
        }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
          <IconButton onClick={handleClose} aria-label="Close" sx={{ color: "#fff" }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pb: manualOpen ? 2 : 0, pt: 0, px: { xs: 1, sm: 2 } }}>
          <Box sx={{ width: "100%", bgcolor: "transparent" }}>
            <CourseVideoPlyr
              videoUrl={videoUrl}
              initialSeconds={0}
              onPersistSeconds={() => {}}
              autoplayMuted={false}
            />
          </Box>
        </DialogContent>
      </Dialog>

      {!manualOpen && open ? (
        <Box
          sx={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: 10,
            display: "flex",
            justifyContent: "center",
            zIndex: 1500,
          }}
        >
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={hideForWeek}
                onChange={(e) => setHideForWeek(e.target.checked)}
              />
            }
            sx={{
              m: 0,
              px: 1,
              borderRadius: 1,
              bgcolor: "rgba(0,0,0,0.5)",
              color: "#fff",
            }}
            label={<Typography variant="caption">Don&apos;t show again</Typography>}
          />
        </Box>
      ) : null}
    </>
  );
}
