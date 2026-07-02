"use client";

import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import Link from "next/link";

type Props = {
  label: string;
  tooltip: string;
  /** When set, the status label navigates to the step module (e.g. Watch Briefing → video page). */
  href?: string | null;
  /** Smaller text for sidebar / nav. */
  size?: "default" | "small";
  lineHeight?: number;
};

export function OnboardingStatusWithInfo({
  label,
  tooltip,
  href,
  size = "default",
  lineHeight = 1.35,
}: Props) {
  const fontSize = size === "small" ? "0.68rem" : "0.72rem";
  const linkable = Boolean(href);

  const labelSx = {
    color: size === "small" ? "inherit" : "rgba(255,255,255,0.5)",
    fontSize,
    lineHeight,
    ...(linkable
      ? {
          cursor: "pointer",
          textDecoration: "none",
          "&:hover": {
            color: "primary.main",
            textDecoration: "underline",
          },
        }
      : {}),
  };

  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.35, maxWidth: "100%" }}>
      {linkable ? (
        <Typography component={Link} href={href!} sx={labelSx}>
          {label}
        </Typography>
      ) : (
        <Typography component="span" sx={labelSx}>
          {label}
        </Typography>
      )}
      {tooltip ? (
        <Tooltip title={tooltip} enterTouchDelay={0} arrow>
          <IconButton
            size="small"
            aria-label={`Status info: ${label}`}
            sx={{
              p: 0.25,
              color: "rgba(255,255,255,0.45)",
              "&:hover": { color: "primary.main", bgcolor: "rgba(255,255,255,0.06)" },
            }}
          >
            <InfoOutlinedIcon sx={{ fontSize: size === "small" ? 14 : 15 }} />
          </IconButton>
        </Tooltip>
      ) : null}
    </Box>
  );
}
