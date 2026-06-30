"use client";

import {
  coachMeetingStepTitle,
} from "@/lib/onboarding/coach-meeting-labels";
import {
  computeJourneyProgressPercent,
  formatOnboardingStepLabel,
  type MemberOnboardingSnapshot,
} from "@/lib/onboarding/member-onboarding-status";
import { flashpointYellow } from "@/theme/tokens";
import { Box, Typography } from "@mui/material";

const JOURNEY_FONT = 'var(--font-konkhmer-sleokchher), "Konkhmer Sleokchher", cursive';

function stepBadgeStyle(status: string): { bg: string; color: string } {
  if (status === "completed") return { bg: "#22c55e", color: "#fff" };
  if (status === "in_progress" || status === "pending") return { bg: flashpointYellow, color: "#0a0a0a" };
  return { bg: "#6b7280", color: "#fff" };
}

function buildSteps(snapshot: MemberOnboardingSnapshot) {
  const totalLessons = snapshot.trainingTotalLessons;
  const trainingDetail =
    snapshot.training === "completed"
      ? "Completed"
      : `${snapshot.trainingCompletedLessons}/${totalLessons || "—"} Lessons`;

  return [
    {
      number: 1,
      title: "Complete Biblical Citizenship",
      detail: trainingDetail,
      status: snapshot.training,
    },
    {
      number: 2,
      title: coachMeetingStepTitle(snapshot.rankAudience),
      detail: formatOnboardingStepLabel(snapshot.coachMeeting),
      status: snapshot.coachMeeting,
    },
    {
      number: 3,
      title: "Choose Your Mission",
      detail: formatOnboardingStepLabel(snapshot.firstMission),
      status: snapshot.firstMission,
    },
  ];
}

type Props = {
  snapshot: MemberOnboardingSnapshot;
};

export function SidebarYourJourney({ snapshot }: Props) {
  const steps = buildSteps(snapshot);
  const progress = computeJourneyProgressPercent(snapshot);

  return (
    <Box
      sx={{
        borderRadius: 2,
        border: "1px solid rgba(255, 255, 255, 0.12)",
        bgcolor: "rgba(28, 28, 32, 0.95)",
        p: 1.5,
        fontFamily: JOURNEY_FONT,
        "& .MuiTypography-root": { fontFamily: JOURNEY_FONT },
      }}
    >
      <Typography
        sx={{
          color: flashpointYellow,
          fontWeight: 500,
          fontSize: "0.95rem",
          mb: 1.5,
        }}
      >
        Your Journey
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25, mb: 1.5 }}>
        {steps.map((step) => {
          const badge = stepBadgeStyle(step.status);
          return (
            <Box key={step.number} sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
              <Box
                sx={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  bgcolor: badge.bg,
                  color: badge.color,
                  fontWeight: 800,
                  fontFamily: JOURNEY_FONT,
                  fontSize: "0.72rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  mt: 0.15,
                }}
              >
                {step.number}
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  sx={{
                    color: "#fff",
                    fontWeight: 500,
                    fontSize: "0.78rem",
                    lineHeight: 1.35,
                    mb: 0.2,
                  }}
                >
                  {step.title}
                </Typography>
                <Typography
                  sx={{
                    color: "rgba(255,255,255,0.5)",
                    fontSize: "0.72rem",
                    lineHeight: 1.35,
                  }}
                >
                  {step.detail}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>

      <Box
        sx={{
          height: 6,
          borderRadius: 999,
          bgcolor: "rgba(0,0,0,0.55)",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            height: "100%",
            width: `${progress}%`,
            bgcolor: flashpointYellow,
            borderRadius: 999,
            transition: "width 0.25s ease",
          }}
        />
      </Box>
    </Box>
  );
}
