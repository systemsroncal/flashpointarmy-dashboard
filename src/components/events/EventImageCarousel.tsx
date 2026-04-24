"use client";

import { Box, IconButton } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { publicAssetSrc } from "@/lib/media/public-asset-url";
import { useMemo, useState } from "react";

export function EventImageCarousel({
  featuredImageUrl,
  galleryImageUrls,
  alt,
}: {
  featuredImageUrl: string | null;
  galleryImageUrls: string[];
  alt: string;
}) {
  const images = useMemo(() => {
    const list = [featuredImageUrl, ...galleryImageUrls]
      .filter((x): x is string => Boolean(x && x.trim()))
      .map((x) => publicAssetSrc(x.trim()));
    return [...new Set(list)];
  }, [featuredImageUrl, galleryImageUrls]);

  const [idx, setIdx] = useState(0);
  if (images.length === 0) return null;

  const current = images[Math.min(idx, images.length - 1)];
  const canSlide = images.length > 1;

  return (
    <Box>
      <Box
        sx={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 260,
          maxHeight: 520,
          borderRadius: 1,
          mb: 1,
          bgcolor: "rgba(0,0,0,0.28)",
          border: "1px solid rgba(255,215,0,0.12)",
          overflow: "hidden",
          p: 1,
        }}
      >
        <Box
          component="img"
          src={current}
          alt={alt}
          sx={{
            maxWidth: "100%",
            maxHeight: 480,
            width: "auto",
            height: "auto",
            objectFit: "contain",
            display: "block",
          }}
        />
        {canSlide ? (
          <>
            <IconButton
              onClick={() => setIdx((prev) => (prev - 1 + images.length) % images.length)}
              size="small"
              sx={{ position: "absolute", top: 12, left: 12, bgcolor: "rgba(0,0,0,0.4)" }}
            >
              <ChevronLeftIcon />
            </IconButton>
            <IconButton
              onClick={() => setIdx((prev) => (prev + 1) % images.length)}
              size="small"
              sx={{ position: "absolute", top: 12, right: 12, bgcolor: "rgba(0,0,0,0.4)" }}
            >
              <ChevronRightIcon />
            </IconButton>
          </>
        ) : null}
      </Box>
      {canSlide ? (
        <Box sx={{ display: "flex", gap: 1, overflowX: "auto", pb: 1 }}>
          {images.map((img, i) => (
            <Box
              key={`${img}-${i}`}
              component="img"
              src={img}
              alt=""
              onClick={() => setIdx(i)}
              sx={{
                width: 88,
                height: 64,
                objectFit: "contain",
                bgcolor: "rgba(0,0,0,0.35)",
                borderRadius: 1,
                cursor: "pointer",
                outline: i === idx ? "2px solid #d4af37" : "1px solid rgba(255,255,255,0.12)",
              }}
            />
          ))}
        </Box>
      ) : null}
    </Box>
  );
}
