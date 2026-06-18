"use client";

import type { TrainingGraduateBadgeRole } from "@/lib/courses/course-completion";
import {
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  type SxProps,
  type Theme,
} from "@mui/material";
import type { ReactNode } from "react";

const GOLD = "rgb(255, 215, 0)";
const ADMIN_AVATAR_BG = "#f8ffd1";
const MEMBER_GRADUATE_CIRCLE_BG =
  "linear-gradient(90deg, #15803d 0%, #22c55e 50%, #15803d 100%)";
const LOCAL_LEADER_GRADUATE_CIRCLE_BG =
  "linear-gradient(90deg, #ca8a04 0%, #fbbf24 50%, #ca8a04 100%)";
/** Reference avatar size for overlay metrics from design (sidebar profile). */
const OVERLAY_REF_SIZE = 40;
const OVERLAY_REF = {
  top: -10,
  right: -9,
  iconSize: 25,
  crownRotateDeg: 41,
} as const;

function overlayMetrics(avatarSize: number) {
  const scale = avatarSize / OVERLAY_REF_SIZE;
  return {
    top: OVERLAY_REF.top * scale,
    right: OVERLAY_REF.right * scale,
    iconSize: OVERLAY_REF.iconSize * scale,
  };
}

function StarIcon({ size = 12 }: { size?: number }) {
  return (
    <Box
      component="svg"
      viewBox="0 0 576 512"
      aria-hidden
      sx={{ width: size, height: size, flexShrink: 0, display: "block" }}
    >
      <path
        fill="currentColor"
        d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.5 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7S19.1 219.8 28.9 227l96.4 93.9L97.5 473.4c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 320.9l96.4-93.9c9.8-7.6 13.1-21.1 8.5-32.6s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z"
      />
    </Box>
  );
}

function CrownIcon({ size = 12 }: { size?: number }) {
  return (
    <Box
      component="svg"
      viewBox="0 0 576 512"
      aria-hidden
      sx={{ width: size, height: size, flexShrink: 0, display: "block" }}
    >
      <path
        fill="currentColor"
        d="M309 106c11.4-7 19-19.7 19-34 0-22.1-17.9-40-40-40s-40 17.9-40 40c0 14.4 7.6 27 19 34L209 237l-63-31.5C136 198 124 192 112 192c-22.1 0-40 17.9-40 40 0 12.2 5.5 23.1 14.1 30.5l26.9 21.3L32 384h512L453.9 284.8l26.9-21.3c8.6-7.4 14.1-18.3 14.1-30.5 0-22.1-17.9-40-40-40-12 0-24 6-34 13.5L309 106z"
      />
    </Box>
  );
}

const BADGE_STYLES: Record<
  TrainingGraduateBadgeRole,
  { label: string; background: string; Icon: typeof StarIcon }
> = {
  local_leader: {
    label: "LOCAL LEADER",
    background: LOCAL_LEADER_GRADUATE_CIRCLE_BG,
    Icon: StarIcon,
  },
  member: {
    label: "MEMBER",
    background: MEMBER_GRADUATE_CIRCLE_BG,
    Icon: StarIcon,
  },
};

export function graduateDisplayName(parts: {
  first_name?: string | null;
  last_name?: string | null;
  display_name?: string | null;
  email?: string | null;
}): string {
  const full = [parts.first_name, parts.last_name].filter(Boolean).join(" ").trim();
  if (full) return full;
  const disp = parts.display_name?.trim();
  if (disp) return disp;
  const email = parts.email?.trim();
  if (email) return email.split("@")[0] ?? email;
  return "Graduate";
}

export function CourseGraduateCongratulationsDialog({
  open,
  onClose,
  firstName,
  lastName,
  displayName,
  email,
}: {
  open: boolean;
  onClose: () => void;
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  email?: string | null;
}) {
  const name = graduateDisplayName({
    first_name: firstName,
    last_name: lastName,
    display_name: displayName,
    email,
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth aria-labelledby="graduate-congrats-title">
      <DialogTitle id="graduate-congrats-title" sx={{ color: "primary.main", fontWeight: 800 }}>
        Course completed
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" sx={{ mb: 1.5 }}>
          Congratulations {name}!
        </Typography>
        <Typography variant="body2" color="text.secondary">
          You have successfully completed the Biblical Citizenship training course. Thank you for
          your commitment to faithful biblical citizenship.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="contained" onClick={onClose} autoFocus>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function CourseGraduateBadge({
  role,
  size = "default",
}: {
  role: TrainingGraduateBadgeRole;
  size?: "default" | "compact";
}) {
  const config = BADGE_STYLES[role];
  const Icon = config.Icon;
  const compact = size === "compact";

  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: compact ? 0.4 : 0.5,
        px: compact ? 0.85 : 1.1,
        py: compact ? 0.2 : 0.35,
        borderRadius: "26.9253px",
        background: config.background,
        color: "#000",
        maxWidth: "100%",
      }}
      aria-label={`${config.label} — Biblical Citizenship course completed`}
    >
      <Icon size={compact ? 10 : 12} />
      <Typography
        component="span"
        sx={{
          fontWeight: 800,
          fontSize: compact ? "0.58rem" : "0.62rem",
          letterSpacing: "0.08em",
          lineHeight: 1.2,
          color: "inherit",
        }}
      >
        {config.label}
      </Typography>
    </Box>
  );
}

/**
 * Avatar with course-graduate and admin icons on the top-right corner.
 * `table`: gradient badge behind graduate stars (user directories).
 * `directory`: same gradient as table, circle sized like the sidebar profile badge.
 * `sidebar`: plain gold/green/gray icons without badge background (drawer profile).
 */
export function AvatarWithGraduateIcon({
  graduateRole,
  showAdminCrown = false,
  overlayStyle = "table",
  size = 30,
  src,
  alt,
  children,
  avatarSx,
  sx,
  onGraduateClick,
}: {
  graduateRole?: TrainingGraduateBadgeRole | null;
  /** Platform admin / super_admin — gold crown, no course requirement. */
  showAdminCrown?: boolean;
  /** `sidebar` = plain overlays; `table` = small badge in lists; `directory` = list gradient at sidebar badge size. */
  overlayStyle?: "table" | "sidebar" | "directory";
  size?: number;
  src?: string;
  alt?: string;
  children?: ReactNode;
  avatarSx?: SxProps<Theme>;
  sx?: SxProps<Theme>;
  /** When set and user is a graduate, avatar + badge open this handler (e.g. congratulations dialog). */
  onGraduateClick?: () => void;
}) {
  const isSidebar = overlayStyle === "sidebar";
  const isDirectory = overlayStyle === "directory";
  const { top, right, iconSize } = overlayMetrics(size);
  const tableOverlaySize = Math.max(13, Math.round(size * 0.44));
  const tableIconSize = Math.max(7, Math.round(tableOverlaySize * 0.52));
  const directoryCircleSize = iconSize;
  const directoryIconSize = Math.max(9, Math.round(directoryCircleSize * 0.55));
  const tableCrownSize = Math.max(11, Math.round(size * 0.38));
  const clickable = Boolean(graduateRole && onGraduateClick);
  const adminAvatarBg = isSidebar && showAdminCrown && !src;

  return (
    <Box
      sx={{
        position: "relative",
        display: "inline-flex",
        width: size,
        height: size,
        flexShrink: 0,
        ...sx,
      }}
    >
      <Avatar
        src={src}
        alt={alt}
        onClick={
          clickable
            ? (e) => {
                e.stopPropagation();
                onGraduateClick?.();
              }
            : undefined
        }
        sx={{
          width: size,
          height: size,
          fontSize: `${Math.round(size * 0.38)}px`,
          cursor: clickable ? "pointer" : undefined,
          ...avatarSx,
          ...(adminAvatarBg
            ? { bgcolor: ADMIN_AVATAR_BG, color: "rgba(0,0,0,0.87)" }
            : {}),
        }}
      >
        {children}
      </Avatar>
      {graduateRole ? (
        <Box
          component="span"
          onClick={
            clickable
              ? (e) => {
                  e.stopPropagation();
                  onGraduateClick?.();
                }
              : undefined
          }
          title={`${BADGE_STYLES[graduateRole].label} — Biblical Citizenship completed`}
          aria-label={`${BADGE_STYLES[graduateRole].label} — Biblical Citizenship course completed`}
          sx={
            isSidebar
              ? {
                  position: "absolute",
                  top,
                  right,
                  left: "auto",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: graduateRole === "local_leader" ? "#fbbf24" : "#9ca3af",
                  filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.75))",
                  zIndex: 1,
                  cursor: clickable ? "pointer" : "default",
                  pointerEvents: clickable ? "auto" : "none",
                }
              : isDirectory
                ? {
                    position: "absolute",
                    top,
                    right,
                    left: "auto",
                    width: directoryCircleSize,
                    height: directoryCircleSize,
                    borderRadius: "50%",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: BADGE_STYLES[graduateRole].background,
                    color: "#111",
                    border: "1.5px solid rgba(10,10,12,0.95)",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.12)",
                    zIndex: 1,
                    cursor: clickable ? "pointer" : "default",
                    pointerEvents: clickable ? "auto" : "none",
                  }
                : {
                    position: "absolute",
                    top: -3,
                    right: -3,
                    left: "auto",
                    width: tableOverlaySize,
                    height: tableOverlaySize,
                    borderRadius: "50%",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: BADGE_STYLES[graduateRole].background,
                    color: "#111",
                    border: "1.5px solid rgba(10,10,12,0.95)",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.12)",
                    zIndex: 1,
                    cursor: clickable ? "pointer" : "default",
                    pointerEvents: clickable ? "auto" : "none",
                  }
          }
        >
          <StarIcon
            size={isSidebar ? iconSize : isDirectory ? directoryIconSize : tableIconSize}
          />
        </Box>
      ) : null}
      {showAdminCrown ? (
        <Box
          component="span"
          title="Administrator"
          aria-label="Administrator"
          sx={
            isSidebar
              ? {
                  position: "absolute",
                  top,
                  right,
                  left: "auto",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: GOLD,
                  filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.75))",
                  zIndex: 2,
                  pointerEvents: "none",
                  transform: `rotate(${OVERLAY_REF.crownRotateDeg}deg)`,
                }
              : {
                  position: "absolute",
                  bottom: -2,
                  right: -4,
                  left: "auto",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: GOLD,
                  filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.75))",
                  zIndex: 2,
                  pointerEvents: "none",
                }
          }
        >
          <CrownIcon size={isSidebar ? iconSize : tableCrownSize} />
        </Box>
      ) : null}
    </Box>
  );
}
