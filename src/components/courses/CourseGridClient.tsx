"use client";

import { publicAssetSrc } from "@/lib/media/public-asset-url";
import EditIcon from "@mui/icons-material/Edit";
import LockIcon from "@mui/icons-material/Lock";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { Box, Button, Paper, Typography } from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export type SessionCardModel = {
  id: string;
  slug: string;
  title: string;
  cover_image_url: string | null;
  sort_order: number;
  locked: boolean;
};

const SESSION_CARD_TOUCH_SX = {
  touchAction: "manipulation",
  WebkitTapHighlightColor: "rgba(255,215,0,0.22)",
  userSelect: "none",
  "& *": {
    pointerEvents: "none",
  },
} as const;

function SessionCard({
  session,
  courseSlug,
  authorLabel,
}: {
  session: SessionCardModel;
  courseSlug: string;
  authorLabel: string;
}) {
  const router = useRouter();
  const href = `/dashboard/course/${courseSlug}/session/${session.slug}`;

  const openSession = () => {
    if (session.locked) return;
    router.push(href);
  };

  const cardBody = (
    <>
      <Box
        sx={{
          position: "relative",
          height: { xs: 108, sm: 120 },
          bgcolor: session.locked ? "#b8860b" : "#e6b422",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundImage: session.cover_image_url
            ? `url(${publicAssetSrc(session.cover_image_url)})`
            : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {!session.cover_image_url ? (
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
        {session.locked ? (
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
          {session.title}
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
            {session.locked ? "LOCKED" : "PLAY"}
          </Typography>
          {session.locked ? (
            <LockIcon sx={{ fontSize: 16, color: "#fff" }} />
          ) : (
            <PlayArrowIcon sx={{ fontSize: 20, color: "primary.main" }} />
          )}
        </Box>
      </Box>
    </>
  );

  const cardSx = {
    ...SESSION_CARD_TOUCH_SX,
    textDecoration: "none",
    color: "inherit",
    overflow: "hidden",
    borderRadius: 1,
    border: "1px solid rgba(255,255,255,0.08)",
    display: "block",
    opacity: session.locked ? 0.72 : 1,
    cursor: session.locked ? "not-allowed" : "pointer",
    minHeight: 44,
    "&:hover": session.locked
      ? {}
      : { borderColor: "rgba(255,215,0,0.45)", boxShadow: "0 0 0 1px rgba(255,215,0,0.12)" },
  };

  if (session.locked) {
    return (
      <Paper sx={cardSx} aria-disabled="true">
        {cardBody}
      </Paper>
    );
  }

  return (
    <Paper
      sx={cardSx}
      role="link"
      tabIndex={0}
      aria-label={`Open session ${session.title}`}
      onClick={openSession}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openSession();
        }
      }}
    >
      {cardBody}
    </Paper>
  );
}

export function CourseGridClient({
  courseSlug,
  courseTitle,
  authorLabel,
  sessions,
  editCourseHref,
  sectionTitle,
  sectionSubtitle,
}: {
  courseSlug: string;
  courseTitle: string;
  authorLabel: string;
  sessions: SessionCardModel[];
  editCourseHref?: string | null;
  /** Overrides the heading above the lesson grid. */
  sectionTitle?: string;
  sectionSubtitle?: string;
}) {
  const sorted = [...sessions].sort((a, b) => a.sort_order - b.sort_order);
  const heading = sectionTitle ?? courseTitle;

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1, mb: 2 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant={sectionTitle ? "h6" : "h5"}
            sx={{ fontWeight: sectionTitle ? 800 : 900, color: "#fff", mb: sectionSubtitle ? 0.75 : 0 }}
          >
            {heading}
          </Typography>
          {sectionSubtitle ? (
            <Typography
              sx={{
                color: "rgba(255,255,255,0.78)",
                lineHeight: 1.65,
                fontSize: { xs: "0.95rem", sm: "1rem" },
                maxWidth: 720,
              }}
            >
              {sectionSubtitle}
            </Typography>
          ) : null}
        </Box>
        {editCourseHref ? (
          <Button
            component={Link}
            href={editCourseHref}
            size="small"
            variant="outlined"
            startIcon={<EditIcon fontSize="small" />}
            sx={{ flexShrink: 0, minHeight: 44, touchAction: "manipulation" }}
          >
            Edit course
          </Button>
        ) : null}
      </Box>
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
            gap: { xs: 1.25, sm: 1.5 },
          }}
        >
          {sorted.map((s) => (
            <SessionCard key={s.id} session={s} courseSlug={courseSlug} authorLabel={authorLabel} />
          ))}
        </Box>
      </Paper>
    </Box>
  );
}
