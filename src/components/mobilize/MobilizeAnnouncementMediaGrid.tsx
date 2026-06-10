"use client";

import { publicAssetSrc } from "@/lib/media/public-asset-url";
import { Box } from "@mui/material";

export function MobilizeAnnouncementMediaGrid({ urls }: { urls: string[] }) {
  const images = urls.filter((u) => u.trim().length > 0);
  if (!images.length) return null;

  const count = images.length;
  const gridColumns = count === 1 ? "1fr" : count === 2 ? "1fr 1fr" : "1fr 1fr";

  return (
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
          component="a"
          href={publicAssetSrc(url)}
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            display: "block",
            gridColumn: count === 3 && i === 0 ? "1 / -1" : undefined,
            maxHeight: count === 1 ? 420 : 220,
            bgcolor: "#f3f4f6",
            borderRadius: 1,
            overflow: "hidden",
            border: "1px solid rgba(0,0,0,0.08)",
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
  );
}
