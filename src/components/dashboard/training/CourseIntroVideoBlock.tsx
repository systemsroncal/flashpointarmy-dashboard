"use client";

import { CourseVideoPlyr } from "@/components/courses/CourseVideoPlyr";
import { ExternalTrainingCertificateBanner } from "@/components/dashboard/training/ExternalTrainingCertificateBanner";
import { Box, Typography } from "@mui/material";

const INTRO_COPY =
  "Every member of FlashPoint Army Chapters begins with the same foundation. Through this training, you'll explore the Biblical principles, constitutional foundations, and historical context that have shaped our nation. This course is designed to equip you with the knowledge needed to engage your community with conviction, wisdom, and purpose. It is presented in partnership with Patriot Academy.";

type Props = {
  videoUrl: string;
  /** Show Patriot Academy certificate CTA below intro copy (course page). */
  showCertificateCta?: boolean;
  courseTitle?: string;
};

/** Biblical Citizenship course hero — intro copy and training intro video. */
export function CourseIntroVideoBlock({
  videoUrl,
  showCertificateCta = false,
  courseTitle = "Biblical Citizenship",
}: Props) {
  const trimmed = videoUrl.trim();
  if (!trimmed) return null;

  return (
    <Box sx={{ mb: { xs: 3, sm: 4 } }}>
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
            borderRadius: 1,
            overflow: "hidden",
            aspectRatio: "16/9",
            alignSelf: "center",
            width: "100%",
          }}
        >
          <CourseVideoPlyr videoUrl={trimmed} initialSeconds={0} onPersistSeconds={() => {}} />
        </Box>
      </Box>
    </Box>
  );
}
