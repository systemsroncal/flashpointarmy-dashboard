"use client";

import type { LinkPreviewMeta } from "@/lib/mobilize/social/link-preview";
import CloseIcon from "@mui/icons-material/Close";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { Box, CircularProgress, IconButton, Stack, Typography } from "@mui/material";

type Props = {
  preview: LinkPreviewMeta | null;
  loading?: boolean;
  error?: string | null;
  surface?: "light" | "dark";
  onDismiss?: () => void;
};

export function MobilizeLinkPreviewComposerCard({
  preview,
  loading = false,
  error = null,
  surface = "light",
  onDismiss,
}: Props) {
  const isDark = surface === "dark";
  const border = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)";
  const muted = isDark ? "rgba(231,233,234,0.75)" : "rgba(0,0,0,0.55)";
  const text = isDark ? "#e7e9ea" : "#0d0d0d";

  if (!loading && !preview && !error) return null;

  return (
    <Box
      sx={{
        mt: 1.25,
        position: "relative",
        border: `1px solid ${border}`,
        borderRadius: 1.5,
        overflow: "hidden",
        bgcolor: isDark ? "rgba(255,255,255,0.04)" : "#fafafa",
      }}
    >
      {onDismiss ? (
        <IconButton
          size="small"
          aria-label="Remove link preview"
          onClick={onDismiss}
          sx={{
            position: "absolute",
            top: 4,
            right: 4,
            zIndex: 2,
            bgcolor: "rgba(0,0,0,0.55)",
            color: "#fff",
            width: 28,
            height: 28,
            "&:hover": { bgcolor: "rgba(0,0,0,0.75)" },
          }}
        >
          <CloseIcon sx={{ fontSize: 16 }} />
        </IconButton>
      ) : null}
      {loading ? (
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ p: 1.5 }}>
          <CircularProgress size={22} />
          <Typography variant="body2" sx={{ color: muted }}>
            Loading link preview…
          </Typography>
        </Stack>
      ) : null}
      {error && !loading ? (
        <Typography variant="body2" sx={{ p: 1.5, color: isDark ? "#ff8a8a" : "error.main" }}>
          {error}
        </Typography>
      ) : null}
      {preview && !loading ? (
        <Box
          component="a"
          href={preview.url}
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            textDecoration: "none",
            color: "inherit",
            "&:hover .mobilize-link-preview-composer__title": { textDecoration: "underline" },
          }}
        >
          {preview.imageUrl ? (
            <Box
              component="img"
              src={preview.imageUrl}
              alt=""
              sx={{
                width: { xs: "100%", sm: 168 },
                height: { xs: 140, sm: 112 },
                objectFit: "cover",
                flexShrink: 0,
                display: "block",
                bgcolor: isDark ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.06)",
              }}
            />
          ) : null}
          <Box sx={{ p: 1.25, minWidth: 0, flex: 1 }}>
            <Typography
              className="mobilize-link-preview-composer__title"
              sx={{
                fontWeight: 700,
                fontSize: "0.9rem",
                lineHeight: 1.35,
                color: text,
                mb: 0.35,
              }}
            >
              {preview.title || preview.url}
            </Typography>
            {preview.description ? (
              <Typography
                variant="body2"
                sx={{
                  color: muted,
                  fontSize: "0.8125rem",
                  lineHeight: 1.4,
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {preview.description}
              </Typography>
            ) : null}
            <Stack direction="row" alignItems="center" spacing={0.35} sx={{ mt: 0.75 }}>
              <OpenInNewIcon sx={{ fontSize: 14, color: muted }} />
              <Typography variant="caption" sx={{ color: muted }}>
                {preview.siteName || new URL(preview.url).hostname.replace(/^www\./i, "")}
              </Typography>
            </Stack>
          </Box>
        </Box>
      ) : null}
    </Box>
  );
}