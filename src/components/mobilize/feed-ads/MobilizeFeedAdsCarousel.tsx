"use client";

import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { Box, IconButton, Stack } from "@mui/material";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { publicAssetSrc } from "@/lib/media/public-asset-url";
import type { MobilizeFeedAdCarouselSlide } from "@/lib/mobilize/feed-ads-types";

type Props = {
  slides: MobilizeFeedAdCarouselSlide[];
  className?: string;
  elementId?: string;
};

export function MobilizeFeedAdsCarousel({ slides, className, elementId }: Props) {
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
  const img = (
    <Box
      component="img"
      src={publicAssetSrc(slide.image_url)}
      alt=""
      sx={{
        width: "100%",
        display: "block",
        borderRadius: 1.5,
        objectFit: "cover",
        aspectRatio: "16 / 10",
        bgcolor: "rgba(0,0,0,0.06)",
      }}
    />
  );

  return (
    <Box id={elementId} className={className}>
      <Box sx={{ position: "relative", borderRadius: 1.5, overflow: "hidden" }}>
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
                bgcolor: i === index ? "primary.main" : "rgba(0,0,0,0.2)",
              }}
            />
          ))}
        </Stack>
      ) : null}
    </Box>
  );
}
