"use client";

import { MobilizeImageLightbox } from "@/components/mobilize/MobilizeImageLightbox";
import { publicAssetSrc } from "@/lib/media/public-asset-url";
import { Box } from "@mui/material";
import { useState } from "react";

export function MobilizeAnnouncementMediaGrid({ urls }: { urls: string[] }) {
  const images = urls.filter((u) => u.trim().length > 0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  if (!images.length) return null;

  const count = images.length;
  const gridColumns = count === 1 ? "1fr" : count === 2 ? "1fr 1fr" : "1fr 1fr";

  return (
    <>
      <Box
        sx={{
          mt: 1.25,
          display: "grid",
          gridTemplateColumns: gridColumns,
          gap: 0.75,
          borderRadius: 1.5,
          overflow: "hidden",
        }}
      >
        {images.map((url, i) => (
          <Box
            key={`${url}-${i}`}
            component="button"
            type="button"
            onClick={() => {
              setLightboxIndex(i);
              setLightboxOpen(true);
            }}
            sx={{
              display: "block",
              p: 0,
              border: "1px solid rgba(0,0,0,0.08)",
              cursor: "pointer",
              gridColumn: count === 3 && i === 0 ? "1 / -1" : undefined,
              maxHeight: count === 1 ? 420 : 220,
              bgcolor: "#f3f4f6",
              borderRadius: 1,
              overflow: "hidden",
              textAlign: "left",
            }}
          >
            <Box
              component="img"
              src={publicAssetSrc(url)}
              alt=""
              sx={{
                width: "100%",
                height: "100%",
                maxHeight: count === 1 ? 420 : 220,
                objectFit: "cover",
                display: "block",
              }}
            />
          </Box>
        ))}
      </Box>
      <MobilizeImageLightbox
        urls={images}
        open={lightboxOpen}
        initialIndex={lightboxIndex}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
}
