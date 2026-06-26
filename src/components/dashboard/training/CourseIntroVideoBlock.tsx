"use client";

import { CourseVideoPlyr } from "@/components/courses/CourseVideoPlyr";
import { Box, Paper, Typography } from "@mui/material";

type Props = {
  videoUrl: string;
};

/** Former training intro — shown on Biblical Citizenship course grid. */
export function CourseIntroVideoBlock({ videoUrl }: Props) {
  const trimmed = videoUrl.trim();
  if (!trimmed) return null;

  return (
    <Paper
      elevation={0}
      sx={{
        mb: 2,
        p: { xs: 2, sm: 2.5 },
        borderRadius: 2,
        border: "1px solid rgba(212, 175, 55, 0.45)",
        bgcolor: "rgba(22, 22, 28, 0.92)",
      }}
    >
      <Typography sx={{ color: "#fff", fontWeight: 700, mb: 1.5, fontSize: "1.05rem" }}>
        Course introduction
      </Typography>
      <Box
        sx={{
          position: "relative",
          borderRadius: 2,
          overflow: "hidden",
          bgcolor: "#000",
          aspectRatio: "16/9",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <CourseVideoPlyr videoUrl={trimmed} initialSeconds={0} onPersistSeconds={() => {}} />
      </Box>
    </Paper>
  );
}
