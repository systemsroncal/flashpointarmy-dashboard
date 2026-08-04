"use client";

import { publicAssetSrc } from "@/lib/media/public-asset-url";
import CloseIcon from "@mui/icons-material/Close";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { Box, Dialog, DialogContent, IconButton } from "@mui/material";
import { useCallback, useEffect, useState } from "react";

type Props = {
  urls: string[];
  open: boolean;
  initialIndex?: number;
  onClose: () => void;
};

export function MobilizeImageLightbox({ urls, open, initialIndex = 0, onClose }: Props) {
  const images = urls.map((u) => publicAssetSrc(u.trim())).filter(Boolean);
  const [index, setIndex] = useState(initialIndex);

  useEffect(() => {
    if (open) setIndex(Math.min(Math.max(0, initialIndex), Math.max(0, images.length - 1)));
  }, [open, initialIndex, images.length]);

  const go = useCallback(
    (dir: -1 | 1) => {
      if (!images.length) return;
      setIndex((i) => (i + dir + images.length) % images.length);
    },
    [images.length]
  );

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, go, onClose]);

  if (!images.length) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: "#0a0a0a",
          m: { xs: 1, sm: 2 },
          maxWidth: "min(1100px, 96vw)",
          width: "100%",
          borderRadius: 2,
          overflow: "hidden",
        },
      }}
    >
      <IconButton
        onClick={onClose}
        aria-label="Close"
        sx={{ position: "absolute", top: 8, right: 8, zIndex: 2, color: "#fff" }}
      >
        <CloseIcon />
      </IconButton>
      <DialogContent sx={{ p: 0, position: "relative" }}>
        <Box
          sx={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: { xs: 280, sm: 420 },
            bgcolor: "#000",
            px: { xs: 5, sm: 7 },
            py: 2,
          }}
        >
          {images.length > 1 ? (
            <IconButton
              onClick={() => go(-1)}
              aria-label="Previous image"
              sx={{
                position: "absolute",
                left: 8,
                color: "#fff",
                bgcolor: "rgba(255,255,255,0.12)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.22)" },
              }}
            >
              <ChevronLeftIcon />
            </IconButton>
          ) : null}
          <Box
            component="img"
            src={images[index]}
            alt=""
            sx={{
              maxWidth: "100%",
              maxHeight: { xs: "55vh", sm: "70vh" },
              objectFit: "contain",
              display: "block",
            }}
          />
          {images.length > 1 ? (
            <IconButton
              onClick={() => go(1)}
              aria-label="Next image"
              sx={{
                position: "absolute",
                right: 8,
                color: "#fff",
                bgcolor: "rgba(255,255,255,0.12)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.22)" },
              }}
            >
              <ChevronRightIcon />
            </IconButton>
          ) : null}
        </Box>
        {images.length > 1 ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              gap: 0.75,
              flexWrap: "wrap",
              px: 2,
              py: 1.5,
              bgcolor: "#111",
              borderTop: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {images.map((src, i) => (
              <Box
                key={`${src}-${i}`}
                component="button"
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Go to image ${i + 1}`}
                aria-current={i === index}
                sx={{
                  width: 44,
                  height: 44,
                  p: 0,
                  border:
                    i === index ? "2px solid #fff" : "2px solid transparent",
                  borderRadius: 0.75,
                  overflow: "hidden",
                  cursor: "pointer",
                  bgcolor: "#222",
                  opacity: i === index ? 1 : 0.65,
                  "&:hover": { opacity: 1 },
                }}
              >
                <Box
                  component="img"
                  src={src}
                  alt=""
                  sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              </Box>
            ))}
          </Box>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
