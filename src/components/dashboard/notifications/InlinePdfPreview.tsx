"use client";

import { publicAssetSrc } from "@/lib/media/public-asset-url";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import { Alert, Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";

type Props = {
  pdfUrl: string;
  fileName?: string | null;
  /** Collapsed by default; expands inline without leaving the page. */
  defaultOpen?: boolean;
};

function previewSrc(pdfUrl: string): string {
  const resolved = publicAssetSrc(pdfUrl.trim());
  return `/api/dashboard/announcements/pdf-proxy?url=${encodeURIComponent(resolved)}`;
}

/**
 * Cross-browser inline PDF preview (Canvas via PDF.js).
 * Works on iOS/Android Safari, Chrome, Firefox, Edge, Brave, desktop OS.
 */
export function InlinePdfPreview({ pdfUrl, fileName, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const host = hostRef.current;
    if (!host) return;

    host.innerHTML = "";
    setLoading(true);
    setError(null);
    setPageCount(0);

    void (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

        const src = previewSrc(pdfUrl);
        const doc = await pdfjs.getDocument({ url: src, withCredentials: true }).promise;
        if (cancelled) {
          await doc.destroy();
          return;
        }
        setPageCount(doc.numPages);

        for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
          if (cancelled) break;
          const page = await doc.getPage(pageNum);
          const baseViewport = page.getViewport({ scale: 1 });
          const maxWidth = Math.min(host.clientWidth || 640, 900);
          const scale = Math.min(1.5, maxWidth / baseViewport.width);
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement("canvas");
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          canvas.style.width = "100%";
          canvas.style.height = "auto";
          canvas.style.display = "block";
          canvas.style.marginBottom = pageNum < doc.numPages ? "12px" : "0";
          canvas.style.borderRadius = "6px";
          canvas.style.background = "#fff";

          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("Canvas unavailable.");
          await page.render({ canvasContext: ctx, viewport }).promise;
          if (!cancelled) host.appendChild(canvas);
        }

        if (!cancelled) setLoading(false);
        await doc.destroy();
      } catch (e) {
        if (!cancelled) {
          setLoading(false);
          setError(e instanceof Error ? e.message : "Could not preview PDF.");
        }
      }
    })();

    return () => {
      cancelled = true;
      if (host) host.innerHTML = "";
    };
  }, [open, pdfUrl]);

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
          {open ? "Hide preview" : "Preview PDF"}
        </Button>
      </Stack>

      {open ? (
        <Box sx={{ p: 1.5 }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          ) : null}
          {error ? (
            <Alert severity="warning" sx={{ mb: 1 }}>
              {error}
            </Alert>
          ) : null}
          {pageCount > 0 && !loading ? (
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
              {pageCount} page{pageCount === 1 ? "" : "s"} · preview stays in Notifications
            </Typography>
          ) : null}
          <Box
            ref={hostRef}
            sx={{
              maxHeight: { xs: 420, sm: 560 },
              overflow: "auto",
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(255,215,0,0.2) transparent",
              "&::-webkit-scrollbar": { width: 5 },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "rgba(255,215,0,0.16)",
                borderRadius: 8,
              },
              "&::-webkit-scrollbar-track": { background: "transparent" },
            }}
          />
        </Box>
      ) : null}
    </Box>
  );
}
