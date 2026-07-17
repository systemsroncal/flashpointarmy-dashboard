"use client";

import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { Box, IconButton, Stack, Typography } from "@mui/material";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { publicAssetSrc } from "@/lib/media/public-asset-url";
import type { MobilizeFeedAdCarouselSlide } from "@/lib/mobilize/feed-ads-types";

/** Renders feed-ad images at their natural aspect ratio (no forced crop). */
export const feedAdImageSx = {
  width: "100%",
  height: "auto",
  maxWidth: "100%",
  display: "block",
  borderRadius: 1.5,
  verticalAlign: "middle",
} as const;

type Props = {
  slides: MobilizeFeedAdCarouselSlide[];
  title?: string;
  className?: string;
  elementId?: string;
};

export function MobilizeFeedAdsCarousel({ slides, title, className, elementId }: Props) {
  const [index, setIndex] = useState(0);
  const count = slides.length;

  const go = useCallback(
    (delta: number) => {
      setIndex((i) => (i + delta + count) % count);
    },
    [count]
  );

  useEffect(() => {
    if (index >= count) setIndex(0);
  }, [count, index]);

  if (!count) return null;

  const slide = slides[index];
  const heading = title?.trim();

  const img = (
    <Box
      component="img"
      src={publicAssetSrc(slide.image_url)}
      alt=""
      sx={feedAdImageSx}
    />
  );

  return (
    <Box id={elementId} className={className}>
      {heading ? (
        <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1.25, letterSpacing: "-0.01em", color: "#0d0d0d" }}>
          {heading}
        </Typography>
      ) : null}
      <Box sx={{ position: "relative", lineHeight: 0 }}>
        {slide.href.trim() ? (
          <Link
            href={slide.href.trim()}
            target={slide.href.startsWith("/") ? undefined : "_blank"}
            rel={slide.href.startsWith("/") ? undefined : "noopener noreferrer"}
            className={slide.className}
            id={slide.elementId}
            style={{ display: "block" }}
          >
            {img}
          </Link>
        ) : (
          <Box className={slide.className} id={slide.elementId}>
            {img}
          </Box>
        )}
        {count > 1 ? (
          <>
            <IconButton
              size="small"
              aria-label="Previous slide"
              onClick={() => go(-1)}
              sx={{
                position: "absolute",
                left: 6,
                top: "50%",
                transform: "translateY(-50%)",
                bgcolor: "rgba(255,255,255,0.92)",
                boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
                "&:hover": { bgcolor: "#fff" },
              }}
            >
              <ChevronLeftIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              aria-label="Next slide"
              onClick={() => go(1)}
              sx={{
                position: "absolute",
                right: 6,
                top: "50%",
                transform: "translateY(-50%)",
                bgcolor: "rgba(255,255,255,0.92)",
                boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
                "&:hover": { bgcolor: "#fff" },
              }}
            >
              <ChevronRightIcon fontSize="small" />
            </IconButton>
          </>
        ) : null}
      </Box>
      {count > 1 ? (
        <Stack direction="row" spacing={0.75} justifyContent="center" sx={{ mt: 1 }}>
          {slides.map((_, i) => (
            <Box
              key={i}
              component="button"
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setIndex(i)}
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                border: "none",
                p: 0,
                cursor: "pointer",
                bgcolor: i === index ? "#0d0d0d" : "rgba(0,0,0,0.2)",
              }}
            />
          ))}
        </Stack>
      ) : null}
    </Box>
  );
}
