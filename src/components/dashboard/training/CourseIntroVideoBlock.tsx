"use client";

import { BIBLICAL_CITIZENSHIP_POSTER_SRC } from "@/lib/courses/course-completion";
import { ExternalTrainingCertificateBanner } from "@/components/dashboard/training/ExternalTrainingCertificateBanner";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Box, IconButton, Typography } from "@mui/material";
import Link from "next/link";

const INTRO_COPY =
  "Every member of FlashPoint Army Chapters begins with the same foundation. Through this training, you'll explore the Biblical principles, constitutional foundations, and historical context that have shaped our nation. This course is designed to equip you with the knowledge needed to engage your community with conviction, wisdom, and purpose. It is presented in partnership with Patriot Academy.";

type Props = {
  posterSrc?: string;
  /** Show Patriot Academy certificate CTA below intro copy (course page). */
  showCertificateCta?: boolean;
  courseTitle?: string;
};

/** Biblical Citizenship course hero — intro copy and course poster. */
export function CourseIntroVideoBlock({
  posterSrc = BIBLICAL_CITIZENSHIP_POSTER_SRC,
  showCertificateCta = false,
  courseTitle = "Biblical Citizenship",
}: Props) {
  return (
    <Box sx={{ mb: { xs: 3, sm: 4 } }}>
      <IconButton
        component={Link}
        href="/dashboard/training"
        aria-label="Back to Training"
        sx={{
          color: "rgba(255,255,255,0.88)",
          mb: { xs: 1.5, sm: 2 },
          ml: { xs: -0.5, md: 0 },
          "&:hover": { color: "primary.main", bgcolor: "rgba(255,255,255,0.06)" },
        }}
      >
        <ArrowBackIcon sx={{ fontSize: 28 }} />
      </IconButton>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: { xs: 2.5, md: 3 },
          alignItems: "center",
        }}
      >
        <Box sx={{ alignSelf: "center" }}>
          <Typography
            component="h1"
            sx={{
              fontWeight: 900,
              color: "#fff",
              fontSize: { xs: "1.75rem", sm: "2.25rem" },
              lineHeight: 1.2,
              mb: 1,
              textAlign: { xs: "center", md: "left" },
            }}
          >
            Biblical Citizenship
          </Typography>
          <Typography
            component="p"
            sx={{
              color: "rgba(255,255,255,0.88)",
              fontSize: { xs: "1.125rem", sm: "1.35rem" },
              fontWeight: 600,
              lineHeight: 1.45,
              mb: { xs: 2, sm: 2.5 },
              textAlign: { xs: "center", md: "left" },
            }}
          >
            Your Foundational Training for FlashPoint Army Chapters
          </Typography>
          <Typography
            sx={{
              color: "rgba(255,255,255,0.78)",
              lineHeight: 1.75,
              fontSize: { xs: "0.95rem", sm: "1rem" },
              textAlign: { xs: "center", md: "left" },
              mb: showCertificateCta ? { xs: 2, sm: 2.5 } : 0,
            }}
          >
            {INTRO_COPY}
          </Typography>
          {showCertificateCta ? (
            <ExternalTrainingCertificateBanner
              showPrompt
              courseTitle={courseTitle}
              variant="inline"
              align="left"
            />
          ) : null}
        </Box>

        <Box
          sx={{
            position: "relative",
            borderRadius: 1.5,
            overflow: "hidden",
            aspectRatio: "1 / 1",
            alignSelf: "center",
            width: "100%",
            maxWidth: { md: 420 },
            mx: { xs: "auto", md: 0 },
            boxShadow: "0 12px 32px rgba(0,0,0,0.35)",
          }}
        >
          <Box
            component="img"
            src={posterSrc}
            alt="Biblical Citizenship in Modern America — Full Course"
            sx={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}
