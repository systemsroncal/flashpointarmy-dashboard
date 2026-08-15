"use client";

import { MobilizeImageLightbox } from "@/components/mobilize/MobilizeImageLightbox";
import { publicAssetSrc } from "@/lib/media/public-asset-url";
import { Box } from "@mui/material";
import { useState } from "react";

/**
 * Tallest a single image may get before it is boxed in (4:5 portrait is the
 * recommended upload ratio, so this keeps one post from filling the viewport).
 */
const SINGLE_MAX_HEIGHT = "min(75vh, 720px)";
/** Letterbox backdrop for images whose ratio differs from the card column. */
const MEDIA_BACKDROP = "#f0f2f5";

export function MobilizeAnnouncementMediaGrid({ urls }: { urls: string[] }) {
  const images = urls.filter((u) => u.trim().length > 0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  if (!images.length) return null;

  const count = images.length;
  const single = count === 1;

  function openLightbox(index: number) {
    setLightboxIndex(index);
    setLightboxOpen(true);
  }

  return (
    <>
      {single ? (
        // One image: show it whole at its own ratio (1:1, 4:5, 1.91:1…), never cropped.
        <Box
          component="button"
          type="button"
          onClick={() => openLightbox(0)}
          aria-label="Open image"
          sx={{
            mt: 1.25,
            display: "block",
            width: "100%",
            p: 0,
            border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: 1.5,
            overflow: "hidden",
            bgcolor: MEDIA_BACKDROP,
            cursor: "pointer",
            lineHeight: 0,
          }}
        >
          <Box
            component="img"
            src={publicAssetSrc(images[0])}
            alt=""
            loading="lazy"
            decoding="async"
            sx={{
              width: "100%",
              height: "auto",
              maxHeight: SINGLE_MAX_HEIGHT,
              // Kicks in only for extreme ratios, where the image is boxed
              // instead of cropped so nothing is cut off.
              objectFit: "contain",
              display: "block",
            }}
          />
        </Box>
      ) : (
        <Box
          sx={{
            mt: 1.25,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 0.75,
            borderRadius: 1.5,
            overflow: "hidden",
          }}
        >
          {images.map((url, i) => {
            const wide = count === 3 && i === 0;
            return (
              <Box
                key={`${url}-${i}`}
                component="button"
                type="button"
                onClick={() => openLightbox(i)}
                aria-label={`Open image ${i + 1} of ${count}`}
                sx={{
                  display: "block",
                  p: 0,
                  border: "1px solid rgba(0,0,0,0.08)",
                  cursor: "pointer",
                  gridColumn: wide ? "1 / -1" : undefined,
                  // Uniform tiles keep the mosaic aligned; the lightbox shows
                  // each image complete.
                  aspectRatio: wide ? "1.91 / 1" : "1 / 1",
                  bgcolor: MEDIA_BACKDROP,
                  borderRadius: 1,
                  overflow: "hidden",
                  textAlign: "left",
                }}
              >
                <Box
                  component="img"
                  src={publicAssetSrc(url)}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </Box>
            );
          })}
        </Box>
      )}
      <MobilizeImageLightbox
        urls={images}
        open={lightboxOpen}
        initialIndex={lightboxIndex}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
}
