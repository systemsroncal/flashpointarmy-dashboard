"use client";

import VideocamOutlinedIcon from "@mui/icons-material/VideocamOutlined";
import CloseIcon from "@mui/icons-material/Close";
import { Box, Dialog, DialogContent, DialogTitle, IconButton, Tooltip, Typography } from "@mui/material";
import { useDashboardUser } from "@/contexts/DashboardUserContext";
import { CourseVideoPlyr } from "@/components/courses/CourseVideoPlyr";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const MEMBER_VIDEO: string = "https://youtu.be/XBjT8Vc2kis";
const LEADER_VIDEO: string = "https://youtu.be/HMWn-Ikrim0";

const MS_24H = 24 * 60 * 60 * 1000;
const AUTO_SHOW_COOKIE = "fpa_welcome_video_last_auto_ms";

function roleVideoUrl(roleNames: string[]): string | null {
  if (roleNames.includes("local_leader")) return LEADER_VIDEO;
  if (roleNames.includes("member")) return MEMBER_VIDEO;
  return null;
}

function readLastAutoShowMs(): number {
  if (typeof document === "undefined") return 0;
  const found = document.cookie
    .split(";")
    .map((v) => v.trim())
    .find((v) => v.startsWith(`${AUTO_SHOW_COOKIE}=`));
  if (!found) return 0;
  const raw = decodeURIComponent(found.slice(AUTO_SHOW_COOKIE.length + 1));
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

function writeLastAutoShowMs(ms: number) {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTO_SHOW_COOKIE}=${encodeURIComponent(String(ms))}; path=/; max-age=${60 * 60 * 24 * 400}; samesite=lax`;
}

function isAdminLike(roleNames: string[]): boolean {
  return roleNames.includes("admin") || roleNames.includes("super_admin");
}

/** National overview home only (not other /dashboard/* routes). */
function isNationalOverviewHome(pathname: string | null): boolean {
  if (!pathname) return false;
  return pathname === "/dashboard" || pathname === "/dashboard/";
}

export function RoleWelcomeVideoPrompt() {
  const pathname = usePathname();
  const user = useDashboardUser();
  const [open, setOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [dialogUrl, setDialogUrl] = useState<string | null>(null);

  const adminLike = useMemo(() => isAdminLike(user.role_names), [user.role_names]);

  const role = useMemo<"member" | "local_leader" | null>(() => {
    if (user.role_names.includes("local_leader")) return "local_leader";
    if (user.role_names.includes("member")) return "member";
    return null;
  }, [user.role_names]);

  const videoUrl = useMemo(() => roleVideoUrl(user.role_names), [user.role_names]);

  const onNationalHome = isNationalOverviewHome(pathname);

  useEffect(() => {
    if (adminLike || !role || !videoUrl) return;
    if (!onNationalHome) return;
    const last = readLastAutoShowMs();
    if (last > 0 && Date.now() - last < MS_24H) return;
    writeLastAutoShowMs(Date.now());
    setDialogUrl(videoUrl);
    setOpen(true);
    setManualOpen(false);
  }, [adminLike, role, videoUrl, onNationalHome]);

  /** Auto-opened only on National overview: close if user navigates away (manual open stays until they close). */
  useEffect(() => {
    if (!onNationalHome && open && !manualOpen) {
      setOpen(false);
      setDialogUrl(null);
    }
  }, [onNationalHome, open, manualOpen]);

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
    setOpen(false);
    setManualOpen(false);
  };

  return (
    <>
      <Tooltip title="Welcome video">
        <IconButton
          color="inherit"
          size="small"
          aria-label="Open welcome video"
          onClick={() => {
            setManualOpen(true);
            setDialogUrl(videoUrl);
            setOpen(true);
          }}
        >
          <VideocamOutlinedIcon />
        </IconButton>
      </Tooltip>

      <Dialog
        open={open && Boolean(dialogUrl)}
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
        <DialogContent sx={{ pb: manualOpen ? 2 : 2, pt: 0, px: { xs: 1, sm: 2 } }}>
          <Box sx={{ width: "100%", bgcolor: "transparent" }}>
            {dialogUrl ? (
              <CourseVideoPlyr
                key={dialogUrl}
                videoUrl={dialogUrl}
                initialSeconds={0}
                onPersistSeconds={() => {}}
                autoplayMuted={false}
              />
            ) : null}
          </Box>
          {!manualOpen && open ? (
            <Typography variant="caption" sx={{ display: "block", textAlign: "center", mt: 1.5, color: "grey.400" }}>
              En National overview se abre solo como máximo una vez cada 24 h. Puedes verlo cuando quieras con el botón
              de videocámara arriba.
            </Typography>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
