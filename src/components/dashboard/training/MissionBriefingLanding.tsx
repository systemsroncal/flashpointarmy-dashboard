"use client";

import CheckBoxIcon from "@mui/icons-material/CheckBox";
import { BriefingVideoAdmin } from "@/components/dashboard/training/BriefingVideoAdmin";
import { MissionBriefingPlayer } from "@/components/dashboard/training/MissionBriefingPlayer";
import { Box, Typography } from "@mui/material";

const briefingSteps = [
  "Watch the Mission Briefing video below.",
  "Understand your role, how the platform works, and what comes next.",
  "Mark the briefing complete when you have watched enough of the video.",
  "Choose your first mission to continue your journey.",
];

type Props = {
  videoUrl: string;
  initialPositionSeconds: number;
  initialDurationSeconds: number | null;
  briefingCompleted: boolean;
  briefingVideoAdmin?: {
    initialDbUrl: string;
    hasEnvFallback: boolean;
  } | null;
};

export function MissionBriefingLanding({
  videoUrl,
  initialPositionSeconds,
  initialDurationSeconds,
  briefingCompleted,
  briefingVideoAdmin,
}: Props) {
  const trimmed = videoUrl.trim();

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
          Watch Briefing
        </Typography>

        <Typography sx={{ color: "rgba(255,255,255,0.88)", fontWeight: 600, mb: 1.5, lineHeight: 1.5 }}>
          Welcome to the next step of your onboarding.
        </Typography>
        <Typography sx={{ color: "rgba(255,255,255,0.82)", mb: 2.5, lineHeight: 1.7 }}>
          You completed Biblical Citizenship. Before choosing your first mission, watch this briefing to learn how
          FlashPoint Army works and what is expected of you as a member.
        </Typography>

        <Typography sx={{ color: "rgba(255,255,255,0.92)", fontWeight: 700, mb: 1.25, fontSize: "1.05rem" }}>
          What to do
        </Typography>
        <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, mb: 2 }}>
          {briefingSteps.map((line) => (
            <Box key={line} component="li" sx={{ display: "flex", alignItems: "flex-start", gap: 1, mb: 1 }}>
              <CheckBoxIcon sx={{ color: "#2e7d32", fontSize: 22, mt: 0.1, flexShrink: 0 }} />
              <Typography sx={{ color: "rgba(255,255,255,0.9)", lineHeight: 1.65 }}>{line}</Typography>
            </Box>
          ))}
        </Box>

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
