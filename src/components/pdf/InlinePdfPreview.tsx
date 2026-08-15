"use client";

import { publicAssetSrc } from "@/lib/media/public-asset-url";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import { useMemo, useState } from "react";

export const ANNOUNCEMENT_PDF_PROXY_ENDPOINT = "/api/dashboard/announcements/pdf-proxy";

type Props = {
  pdfUrl: string;
  fileName?: string | null;
  /** When false, starts collapsed. Default: open with Mozilla PDF.js viewer. */
  defaultOpen?: boolean;
  /** Same-origin endpoint that streams the PDF (`?url=` is appended). */
  proxyEndpoint?: string;
  /** `light` matches the Mobilize surfaces; `dark` matches Mission Updates. */
  tone?: "dark" | "light";
  /** `compact` keeps the viewer inside a card instead of filling the viewport. */
  size?: "full" | "compact";
};

/**
 * Inline PDF via official Mozilla PDF.js viewer (https://github.com/mozilla/pdf.js).
 * Same-origin `/public/pdfjs` — works across mobile/desktop browsers without leaving the page.
 */
export function InlinePdfPreview({
  pdfUrl,
  fileName,
  defaultOpen = true,
  proxyEndpoint = ANNOUNCEMENT_PDF_PROXY_ENDPOINT,
  tone = "dark",
  size = "full",
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const [frameError, setFrameError] = useState(false);

  const viewerSrc = useMemo(() => {
    const file = `${proxyEndpoint}?url=${encodeURIComponent(publicAssetSrc(pdfUrl.trim()))}`;
    // Relative path so the viewer stays same-origin (cookies + auth on proxy).
    return `/pdfjs/web/viewer.html?file=${encodeURIComponent(file)}`;
  }, [pdfUrl, proxyEndpoint]);

  const label = fileName?.trim() || "PDF document";
  const isLight = tone === "light";

  return (
    <Box
      sx={{
        mt: 2,
        border: isLight ? "1px solid rgba(0,0,0,0.12)" : "1px solid rgba(255,215,0,0.18)",
        borderRadius: 1.5,
        bgcolor: isLight ? "rgba(0,0,0,0.02)" : "rgba(0,0,0,0.28)",
        overflow: "hidden",
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{
          px: 1.5,
          py: 1.25,
          borderBottom: open
            ? isLight
              ? "1px solid rgba(0,0,0,0.08)"
              : "1px solid rgba(255,255,255,0.08)"
            : "none",
        }}
      >
        <PictureAsPdfOutlinedIcon sx={{ color: isLight ? "error.main" : "primary.main" }} />
        <Typography
          variant="body2"
          sx={{ flex: 1, minWidth: 0, color: isLight ? "text.primary" : "grey.200" }}
          noWrap
        >
          {label}
        </Typography>
        <Button
          size="small"
          variant="outlined"
          onClick={() => setOpen((v) => !v)}
          sx={{ textTransform: "none", flexShrink: 0 }}
        >
          {open ? "Hide PDF" : "Show PDF"}
        </Button>
      </Stack>

      {open ? (
        <Box sx={{ bgcolor: "#525659" }}>
          {frameError ? (
            <Alert severity="warning" sx={{ m: 1.5 }}>
              Could not load the PDF viewer. Refresh the page or try again.
            </Alert>
          ) : null}
          <Box
            component="iframe"
            title={label}
            src={viewerSrc}
            onError={() => setFrameError(true)}
            sx={{
              display: "block",
              width: "100%",
              // Full page height of the PDF viewport (Mozilla viewer); scrolls inside.
              height:
                size === "compact"
                  ? { xs: "min(70vh, 560px)", sm: "min(70vh, 680px)" }
                  : { xs: "min(92vh, 1200px)", sm: "min(88vh, 1400px)" },
              minHeight: size === "compact" ? { xs: 380, sm: 480 } : { xs: 520, sm: 720 },
              border: 0,
              bgcolor: "#525659",
            }}
          />
        </Box>
      ) : null}
    </Box>
  );
}
