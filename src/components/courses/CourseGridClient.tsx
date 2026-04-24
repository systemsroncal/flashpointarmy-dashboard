"use client";

import { publicAssetSrc } from "@/lib/media/public-asset-url";
import LockIcon from "@mui/icons-material/Lock";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { Box, Paper, Typography } from "@mui/material";
import Image from "next/image";
import Link from "next/link";

export type SessionCardModel = {
  id: string;
  slug: string;
  title: string;
  cover_image_url: string | null;
  sort_order: number;
  locked: boolean;
};

export function CourseGridClient({
  courseSlug,
  courseTitle,
  authorLabel,
  sessions,
}: {
  courseSlug: string;
  courseTitle: string;
  authorLabel: string;
  sessions: SessionCardModel[];
}) {
  const sorted = [...sessions].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 900, color: "#fff", mb: 2 }}>
        {courseTitle}
      </Typography>
      <Paper
        sx={{
          p: { xs: 1.5, sm: 2 },
          borderRadius: 2,
          border: "1px solid rgba(255,165,0,0.35)",
          bgcolor: "rgba(0,0,0,0.35)",
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, minmax(0, 1fr))",
              sm: "repeat(3, minmax(0, 1fr))",
              md: "repeat(4, minmax(0, 1fr))",
            },
            gap: 1.5,
          }}
        >
          {sorted.map((s) => {
            const href = s.locked ? "#" : `/dashboard/course/${courseSlug}/session/${s.slug}`;
            const inner = (
              <Paper
                sx={{
                  textDecoration: "none",
                  color: "inherit",
                  overflow: "hidden",
                  borderRadius: 1,
                  border: "1px solid rgba(255,255,255,0.08)",
                  display: "block",
                  opacity: s.locked ? 0.72 : 1,
                  cursor: s.locked ? "not-allowed" : "pointer",
                  "&:hover": s.locked
                    ? {}
                    : { borderColor: "rgba(255,215,0,0.45)", boxShadow: "0 0 0 1px rgba(255,215,0,0.12)" },
                }}
              >
                  <Box
                    sx={{
                      position: "relative",
                      height: 120,
                      bgcolor: s.locked ? "#b8860b" : "#e6b422",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundImage: s.cover_image_url
                        ? `url(${publicAssetSrc(s.cover_image_url)})`
                        : undefined,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  >
                    {!s.cover_image_url ? (
                      <Box
                        sx={{
                          position: "relative",
                          width: "72%",
                          maxWidth: 160,
                          height: 72,
                          mx: "auto",
                        }}
                      >
                        <Image
                          src="/logos/Dashboard-Logo.svg"
                          alt=""
                          fill
                          sizes="160px"
                          style={{ objectFit: "contain" }}
                          unoptimized
                        />
                      </Box>
                    ) : null}
                    {s.locked ? (
                      <LockIcon
                        sx={{
                          position: "absolute",
                          color: "#fff",
                          fontSize: 40,
                          filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.6))",
                        }}
                      />
                    ) : null}
                  </Box>
                  <Box sx={{ bgcolor: "#000", px: 1, py: 1.25, minHeight: 72 }}>
                    <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", color: "#fff", lineHeight: 1.25 }}>
                      {s.title}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      bgcolor: "#000",
                      px: 1,
                      pb: 1,
                      pt: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.85)" }}>
                      <Box component="span" sx={{ color: "primary.main", mr: 0.5 }}>
                        ●
                      </Box>
                      {authorLabel}
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.25, color: "#fff" }}>
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>
                        PLAY
                      </Typography>
                      {s.locked ? (
                        <LockIcon sx={{ fontSize: 16, color: "#fff" }} />
                      ) : (
                        <PlayArrowIcon sx={{ fontSize: 20, color: "primary.main" }} />
                      )}
                    </Box>
                  </Box>
              </Paper>
            );
            return (
              <Box key={s.id}>
                {s.locked ? (
                  inner
                ) : (
                  <Link href={href} style={{ textDecoration: "none", color: "inherit" }}>
                    {inner}
                  </Link>
                )}
              </Box>
            );
          })}
        </Box>
      </Paper>
    </Box>
  );
}
