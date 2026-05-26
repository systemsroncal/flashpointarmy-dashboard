"use client";

import type { TrainingGraduateBadgeRole } from "@/lib/courses/course-completion";
import { Avatar, Box, Typography, type SxProps, type Theme } from "@mui/material";
import type { ReactNode } from "react";

function MedalIcon({ size = 12 }: { size?: number }) {
  return (
    <Box
      component="svg"
      viewBox="0 0 512 512"
      aria-hidden
      sx={{ width: size, height: size, flexShrink: 0, display: "block" }}
    >
      <path
        fill="currentColor"
        d="M4.1 38.5C7 15.8 26.1 0 49.2 0h413.7c23.1 0 42.2 15.8 45.1 38.5l47.1 351.8c2.8 20.7-11.5 39.5-32.4 42.3-1.7.2-3.4.3-5.1.3H44.7c-20.9 0-37.9-16.1-39.7-36.9L4.1 38.5zM256 96c-53 0-96 43-96 96s43 96 96 96 96-43 96-96-43-96-96-96zm0 144a48 48 0 1 1 0-96 48 48 0 1 1 0 96z"
      />
    </Box>
  );
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

const BADGE_STYLES: Record<
  TrainingGraduateBadgeRole,
  { label: string; background: string; Icon: typeof MedalIcon }
> = {
  local_leader: {
    label: "LOCAL LEADER",
    background: "linear-gradient(90deg, #F5B11E 0%, #FFCA59 50%, #F5B11E 100%)",
    Icon: MedalIcon,
  },
  member: {
    label: "MEMBER",
    background: "linear-gradient(90deg, #979797 0%, #CECECE 50%, #979797 100%)",
    Icon: StarIcon,
  },
};

export function CourseGraduateBadge({
  role,
  size = "default",
}: {
  role: TrainingGraduateBadgeRole;
  /** `compact` for dense layouts; `default` matches sidebar profile mockup. */
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
 * Avatar with a subtle course-graduate icon pinned to the top-left corner.
 * Used in user list tables where the full text badge would clutter rows.
 */
export function AvatarWithGraduateIcon({
  graduateRole,
  size = 30,
  src,
  alt,
  children,
  avatarSx,
  sx,
}: {
  graduateRole?: TrainingGraduateBadgeRole | null;
  size?: number;
  src?: string;
  alt?: string;
  children?: ReactNode;
  avatarSx?: SxProps<Theme>;
  sx?: SxProps<Theme>;
}) {
  const overlaySize = Math.max(13, Math.round(size * 0.44));
  const iconSize = Math.max(7, Math.round(overlaySize * 0.52));

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
        sx={{
          width: size,
          height: size,
          fontSize: Math.max(0.65, size * 0.36) + "rem",
          ...avatarSx,
        }}
      >
        {children}
      </Avatar>
      {graduateRole ? (
        <Box
          component="span"
          title={`${BADGE_STYLES[graduateRole].label} — Biblical Citizenship completed`}
          aria-label={`${BADGE_STYLES[graduateRole].label} — Biblical Citizenship course completed`}
          sx={{
            position: "absolute",
            top: -3,
            left: -3,
            width: overlaySize,
            height: overlaySize,
            borderRadius: "50%",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            background: BADGE_STYLES[graduateRole].background,
            color: "#111",
            border: "1.5px solid rgba(10,10,12,0.95)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.12)",
            zIndex: 1,
            pointerEvents: "none",
          }}
        >
          {(() => {
            const Icon = BADGE_STYLES[graduateRole].Icon;
            return <Icon size={iconSize} />;
          })()}
        </Box>
      ) : null}
    </Box>
  );
}
