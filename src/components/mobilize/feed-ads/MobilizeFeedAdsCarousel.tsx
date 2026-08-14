"use client";

import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { Box, IconButton, Stack, Typography, useMediaQuery } from "@mui/material";
import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
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

const DEFAULT_SPEED_MS = 4500;

type Props = {
  slides: MobilizeFeedAdCarouselSlide[];
  title?: string;
  className?: string;
  elementId?: string;
  /** Advance slides automatically. Default true. */
  autoplay?: boolean;
  /** Discrete interval or continuous full-loop duration (ms). */
  speed_ms?: number;
  /** Seamless horizontal scroll instead of stepping one slide at a time. */
  continuous_rotation?: boolean;
};

function SlideMedia({ slide }: { slide: MobilizeFeedAdCarouselSlide }) {
  const img = (
    <Box component="img" src={publicAssetSrc(slide.image_url)} alt="" sx={feedAdImageSx} />
  );

  if (slide.href.trim()) {
    return (
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
    );
  }

  return (
    <Box className={slide.className} id={slide.elementId}>
      {img}
    </Box>
  );
}

function CarouselHeading({ title }: { title?: string }) {
  const heading = title?.trim();
  if (!heading) return null;
  return (
    <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1.25, letterSpacing: "-0.01em", color: "#0d0d0d" }}>
      {heading}
    </Typography>
  );
}

function ContinuousTrack({
  slides,
  speedMs,
  reduceMotion,
}: {
  slides: MobilizeFeedAdCarouselSlide[];
  speedMs: number;
  reduceMotion: boolean;
}) {
  // Duplicate the set so translateX(-50%) loops seamlessly.
  const loopSlides = [...slides, ...slides];
  const animating = !reduceMotion && slides.length > 1;
  const slidePct = 100 / loopSlides.length;

  return (
    <Box sx={{ overflow: "hidden", borderRadius: 1.5, width: "100%" }}>
      <Box
        sx={{
          display: "flex",
          width: `${loopSlides.length * 100}%`,
          ...(animating
            ? {
                animation: `mobilizeFeedAdMarquee ${speedMs}ms linear infinite`,
                "@keyframes mobilizeFeedAdMarquee": {
                  from: { transform: "translateX(0)" },
                  to: { transform: "translateX(-50%)" },
                },
                "@media (prefers-reduced-motion: reduce)": {
                  animation: "none",
                },
                "&:hover": { animationPlayState: "paused" },
              }
            : {}),
        }}
      >
        {loopSlides.map((slide, i) => (
          <Box
            key={`${slide.image_url}-${i}`}
            sx={{
              flex: `0 0 ${slidePct}%`,
              width: `${slidePct}%`,
              maxWidth: `${slidePct}%`,
              boxSizing: "border-box",
              px: 0.25,
            }}
          >
            <SlideMedia slide={slide} />
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function DiscreteCarousel({
  slides,
  autoplay,
  speedMs,
  reduceMotion,
}: {
  slides: MobilizeFeedAdCarouselSlide[];
  autoplay: boolean;
  speedMs: number;
  reduceMotion: boolean;
}) {
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

  useEffect(() => {
    if (!autoplay || reduceMotion || count < 2) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, speedMs);
    return () => clearInterval(timer);
  }, [autoplay, reduceMotion, count, speedMs]);

  const slide = slides[index];

  return (
    <>
      <Box sx={{ position: "relative", lineHeight: 0 }}>
        <SlideMedia slide={slide} />
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
    </>
  );
}

export function MobilizeFeedAdsCarousel({
  slides,
  title,
  className,
  elementId,
  autoplay = true,
  speed_ms = DEFAULT_SPEED_MS,
  continuous_rotation = false,
}: Props) {
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const count = slides.length;
  if (!count) return null;

  const speedMs =
    Number.isFinite(speed_ms) && speed_ms > 0 ? Math.round(speed_ms) : DEFAULT_SPEED_MS;

  let body: ReactNode;
  if (continuous_rotation && autoplay && count > 1) {
    body = <ContinuousTrack slides={slides} speedMs={speedMs} reduceMotion={reduceMotion} />;
  } else {
    body = (
      <DiscreteCarousel
        slides={slides}
        autoplay={autoplay && !continuous_rotation}
        speedMs={speedMs}
        reduceMotion={reduceMotion}
      />
    );
  }

  return (
    <Box id={elementId} className={className}>
      <CarouselHeading title={title} />
      {body}
    </Box>
  );
}
