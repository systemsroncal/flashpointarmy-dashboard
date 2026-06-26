"use client";

import { CourseVideoPlyr } from "@/components/courses/CourseVideoPlyr";
import { Box, Typography } from "@mui/material";

const INTRO_COPY =
  "Every member of FlashPoint Army Chapters begins with the same foundation. Through this training, you'll explore the Biblical principles, constitutional foundations, and historical context that have shaped our nation. This course is designed to equip you with the knowledge needed to engage your community with conviction, wisdom, and purpose. It is presented in partnership with Patriot Academy.";

type Props = {
  videoUrl: string;
};

/** Biblical Citizenship course hero — intro copy and training intro video. */
export function CourseIntroVideoBlock({ videoUrl }: Props) {
  const trimmed = videoUrl.trim();
  if (!trimmed) return null;

  return (
    <Box sx={{ mb: { xs: 3, sm: 4 } }}>
      <Typography
        component="h1"
        sx={{
          fontWeight: 900,
          color: "#fff",
          fontSize: { xs: "1.75rem", sm: "2.25rem" },
          lineHeight: 1.2,
          mb: 1,
          textAlign: "center",
        }}
      >
        Biblical Citizenship
      </Typography>
      <Typography
        sx={{
          color: "rgba(255,255,255,0.82)",
          fontSize: { xs: "1rem", sm: "1.05rem" },
          lineHeight: 1.6,
          mb: { xs: 2.5, sm: 3 },
          maxWidth: 720,
          mx: "auto",
          textAlign: "center",
        }}
      >
        Your Foundational Training for FlashPoint Army Chapters
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: { xs: 2.5, md: 3 },
          alignItems: "center",
        }}
      >
        <Typography
          sx={{
            color: "rgba(255,255,255,0.78)",
            lineHeight: 1.75,
            fontSize: { xs: "0.95rem", sm: "1rem" },
            alignSelf: "center",
          }}
        >
          {INTRO_COPY}
        </Typography>

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
