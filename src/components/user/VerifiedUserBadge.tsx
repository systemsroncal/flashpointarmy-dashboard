"use client";

import { VERIFIED_USER_ICON_SRC } from "@/lib/user/verified-user";
import { publicAssetSrc } from "@/lib/media/public-asset-url";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import { Box, Popover, Stack, Typography } from "@mui/material";
import { useState, type MouseEvent } from "react";

type Props = {
  size?: number;
  title?: string;
  /** ISO timestamp of when the account was verified — shown in the info popover. */
  verifiedAt?: string | null;
};

function formatVerifiedSince(iso: string): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

/** Blue check badge shown next to verified user names, with an X-style info popover. */
export function VerifiedUserBadge({ size = 16, title = "Verified account", verifiedAt = null }: Props) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);
  const since = verifiedAt ? formatVerifiedSince(verifiedAt) : null;

  function openPopover(e: MouseEvent<HTMLElement>) {
    // Badges live inside profile links / post headers — don't navigate on click.
    e.preventDefault();
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  }

  return (
    <>
      <Box
        component="button"
        type="button"
        onClick={openPopover}
        aria-label={title}
        aria-haspopup="dialog"
        sx={{
          p: 0,
          border: "none",
          bgcolor: "transparent",
          lineHeight: 0,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          flexShrink: 0,
          borderRadius: "50%",
          "&:focus-visible": { outline: "2px solid #1877f2", outlineOffset: 2 },
        }}
      >
        <Box
          component="img"
          src={publicAssetSrc(VERIFIED_USER_ICON_SRC)}
          alt=""
          sx={{ width: size, height: size, display: "block" }}
        />
      </Box>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{
          backdrop: { invisible: true },
          paper: {
            sx: {
              mt: 1,
              maxWidth: 320,
              borderRadius: 3,
              p: 2,
              bgcolor: "#fff",
              color: "#0f1419",
              boxShadow: "0 0 15px rgba(101,119,134,0.2), 0 0 3px 1px rgba(101,119,134,0.15)",
              backgroundImage: "none",
            },
          },
        }}
      >
        <Typography sx={{ fontWeight: 800, fontSize: "1.25rem", mb: 1.25, color: "inherit" }}>
          Verified account
        </Typography>
        <Stack spacing={1.25}>
          <Stack direction="row" spacing={1.25} alignItems="center">
            <Box
              component="img"
              src={publicAssetSrc(VERIFIED_USER_ICON_SRC)}
              alt=""
              sx={{ width: 20, height: 20, flexShrink: 0 }}
            />
            <Typography variant="body2" sx={{ color: "inherit" }}>
              This account is verified.
            </Typography>
          </Stack>
          {since ? (
            <Stack direction="row" spacing={1.25} alignItems="center">
              <CalendarMonthOutlinedIcon sx={{ fontSize: 20, color: "#536471" }} />
              <Typography variant="body2" sx={{ color: "inherit" }}>
                Verified since {since}.
              </Typography>
            </Stack>
          ) : null}
        </Stack>
      </Popover>
    </>
  );
}
