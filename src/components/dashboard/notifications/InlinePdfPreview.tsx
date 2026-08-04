"use client";

import { publicAssetSrc } from "@/lib/media/public-asset-url";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import { useMemo, useState } from "react";

type Props = {
  pdfUrl: string;
  fileName?: string | null;
  /** When false, starts collapsed. Default: open with Mozilla PDF.js viewer. */
  defaultOpen?: boolean;
};

function proxyPdfPath(pdfUrl: string): string {
  const resolved = publicAssetSrc(pdfUrl.trim());
  return `/api/dashboard/announcements/pdf-proxy?url=${encodeURIComponent(resolved)}`;
}

/**
 * Inline PDF via official Mozilla PDF.js viewer (https://github.com/mozilla/pdf.js).
 * Same-origin `/public/pdfjs` — works across mobile/desktop browsers without leaving Notifications.
 */
export function InlinePdfPreview({ pdfUrl, fileName, defaultOpen = true }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const [frameError, setFrameError] = useState(false);

  const viewerSrc = useMemo(() => {
    const file = proxyPdfPath(pdfUrl);
    // Relative path so the viewer stays same-origin (cookies + auth on proxy).
    return `/pdfjs/web/viewer.html?file=${encodeURIComponent(file)}`;
  }, [pdfUrl]);

  const label = fileName?.trim() || "PDF document";

  return (
    <Box
      sx={{
        mt: 2,
        border: "1px solid rgba(255,215,0,0.18)",
        borderRadius: 1.5,
        bgcolor: "rgba(0,0,0,0.28)",
        overflow: "hidden",
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{ px: 1.5, py: 1.25, borderBottom: open ? "1px solid rgba(255,255,255,0.08)" : "none" }}
      >
        <PictureAsPdfOutlinedIcon sx={{ color: "primary.main" }} />
        <Typography variant="body2" sx={{ flex: 1, minWidth: 0, color: "grey.200" }} noWrap>
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
              height: { xs: "min(92vh, 1200px)", sm: "min(88vh, 1400px)" },
              minHeight: { xs: 520, sm: 720 },
              border: 0,
              bgcolor: "#525659",
            }}
          />
        </Box>
      ) : null}
    </Box>
  );
}
