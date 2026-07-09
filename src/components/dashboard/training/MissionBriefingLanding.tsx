"use client";

import { JourneyWelcomeDialog } from "@/components/dashboard/onboarding/JourneyWelcomeDialog";
import { BriefingVideoAdmin } from "@/components/dashboard/training/BriefingVideoAdmin";
import { MissionBriefingPlayer } from "@/components/dashboard/training/MissionBriefingPlayer";
import { Box, Typography } from "@mui/material";
import { useState } from "react";

type Props = {
  videoUrl: string;
  initialPositionSeconds: number;
  initialDurationSeconds: number | null;
  briefingCompleted: boolean;
  showWelcome?: boolean;
  briefingVideoAdmin?: {
    initialDbUrl: string;
    hasEnvFallback: boolean;
  } | null;
};

const BRIEFING_WELCOME = [
  "Congratulations on completing your Biblical Citizenship training.",
  "Before beginning your Initial Assignments, watch this Mission Briefing from Gene Bailey to understand the vision of FlashPoint Army Chapters, the purpose of this Command Center, and how you can begin making an impact in your community.",
  "This briefing will prepare you for the next phase of your journey. Mission begins with understanding. Action follows.",
];

export function MissionBriefingLanding({
  videoUrl,
  initialPositionSeconds,
  initialDurationSeconds,
  briefingCompleted,
  showWelcome = false,
  briefingVideoAdmin,
}: Props) {
  const trimmed = videoUrl.trim();
  const [welcomeOpen, setWelcomeOpen] = useState(showWelcome);

  return (
    <Box
      sx={{
        position: "relative",
        minHeight: "72vh",
        py: { xs: 3, md: 5 },
        px: { xs: 1, sm: 2 },
        overflow: "hidden",
        backgroundColor: "#0e0e10",
        backgroundImage: `radial-gradient(ellipse at 50% 0%, rgba(255,200,60,0.06), transparent 55%),
          linear-gradient(180deg, #121214 0%, #0a0a0c 100%)`,
      }}
    >
      <JourneyWelcomeDialog
        open={welcomeOpen}
        kind="mission_briefing"
        title="Welcome to Mission Briefing"
        paragraphs={BRIEFING_WELCOME}
        ctaLabel="Start briefing"
        onDismissed={() => setWelcomeOpen(false)}
      />
      <Box
        sx={{
          maxWidth: 1100,
          mx: "auto",
          position: "relative",
          zIndex: 1,
          borderRadius: 2,
          border: "1px solid rgba(212, 175, 55, 0.55)",
          boxShadow: "0 0 0 1px rgba(0,0,0,0.5), 0 24px 48px rgba(0,0,0,0.45)",
          bgcolor: "rgba(22,22,26,0.96)",
          p: { xs: 2.5, sm: 3.5 },
        }}
      >
        <Typography
          component="h1"
          sx={{
            fontWeight: 800,
            fontSize: { xs: "1.35rem", sm: "1.6rem" },
            color: "#fff",
            mb: 1.5,
            lineHeight: 1.25,
          }}
        >
          Mission Briefing
        </Typography>

        <Typography sx={{ color: "rgba(255,255,255,0.88)", fontWeight: 600, mb: 1.5, lineHeight: 1.5 }}>
          Congratulations on completing your Biblical Citizenship training.
        </Typography>
        <Typography sx={{ color: "rgba(255,255,255,0.82)", mb: 1.5, lineHeight: 1.7 }}>
          Before beginning your Initial Assignments, watch this Mission Briefing from Gene Bailey to understand the
          vision of FlashPoint Army Chapters, the purpose of this Command Center, and how you can begin making an
          impact in your community.
        </Typography>
        <Typography sx={{ color: "rgba(255,255,255,0.82)", mb: 1.5, lineHeight: 1.7 }}>
          This briefing will prepare you for the next phase of your journey.
        </Typography>
        <Typography sx={{ color: "rgba(255,255,255,0.78)", mb: 2.5, lineHeight: 1.65, fontStyle: "italic" }}>
          Mission begins with understanding. Action follows.
        </Typography>

        {trimmed ? (
          <MissionBriefingPlayer
            videoUrl={trimmed}
            initialPositionSeconds={initialPositionSeconds}
            initialDurationSeconds={initialDurationSeconds}
            briefingCompleted={briefingCompleted}
          />
        ) : (
          <Typography color="text.secondary">Mission Briefing video is not configured.</Typography>
        )}

        {briefingVideoAdmin ? <BriefingVideoAdmin {...briefingVideoAdmin} /> : null}
      </Box>
    </Box>
  );
}
