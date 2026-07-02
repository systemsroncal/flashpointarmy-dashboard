"use client";

import { coachMeetingStepHref, coachMeetingStepTitle } from "@/lib/onboarding/coach-meeting-labels";
import {
  coachMeetingStepDisplay,
  firstMissionStepDisplay,
  firstMissionStepTitle,
} from "@/lib/onboarding/onboarding-step-display";
import {
  computeJourneyProgressPercent,
  type MemberOnboardingSnapshot,
} from "@/lib/onboarding/member-onboarding-status";
import { resolveOnboardingStepStatusHref } from "@/lib/onboarding/onboarding-navigation";
import { OnboardingStatusWithInfo } from "@/components/dashboard/onboarding/OnboardingStatusWithInfo";
import { BIBLICAL_CITIZENSHIP_COURSE_SLUG } from "@/lib/courses/course-completion";
import { flashpointYellow } from "@/theme/tokens";
import { Box, Typography } from "@mui/material";
import Link from "next/link";

const JOURNEY_FONT = 'var(--font-konkhmer-sleokchher), "Konkhmer Sleokchher", cursive';

const BC_HREF = `/dashboard/course/${BIBLICAL_CITIZENSHIP_COURSE_SLUG}`;
const MISSIONS_HREF = "/dashboard/missions";

type JourneyStep = {
  number: number;
  stepKey: "training" | "coachMeeting" | "firstMission";
  title: string;
  statusLabel: string;
  statusTooltip: string;
  status: string;
  href: string | null;
  statusHref: string | null;
  enabled: boolean;
  extraDetail?: string;
};

function buildSteps(snapshot: MemberOnboardingSnapshot): JourneyStep[] {
  const totalLessons = snapshot.trainingTotalLessons;
  const trainingExtra =
    snapshot.training === "completed"
      ? undefined
      : `${snapshot.trainingCompletedLessons}/${totalLessons || "—"} Lessons`;

  const coachDisplay = coachMeetingStepDisplay(snapshot.coachMeeting, snapshot.rankAudience);
  const missionDisplay = firstMissionStepDisplay(snapshot.firstMission, snapshot.rankAudience);

  return [
    {
      number: 1,
      stepKey: "training",
      title: "Complete Biblical Citizenship",
      statusLabel: snapshot.training === "completed" ? "Completed" : "In Progress",
      statusTooltip:
        snapshot.training === "completed"
          ? "Biblical Citizenship training is complete."
          : "Continue your Biblical Citizenship lessons. Your progress is saved automatically.",
      status: snapshot.training,
      href: BC_HREF,
      statusHref: resolveOnboardingStepStatusHref("training", snapshot),
      enabled: true,
      extraDetail: trainingExtra,
    },
    {
      number: 2,
      stepKey: "coachMeeting",
      title: coachMeetingStepTitle(snapshot.rankAudience),
      statusLabel: coachDisplay.label,
      statusTooltip: coachDisplay.tooltip,
      status: snapshot.coachMeeting,
      href: coachMeetingStepHref(snapshot.rankAudience),
      statusHref: resolveOnboardingStepStatusHref("coachMeeting", snapshot),
      enabled: snapshot.training === "completed",
    },
    {
      number: 3,
      stepKey: "firstMission",
      title: firstMissionStepTitle(),
      statusLabel: missionDisplay.label,
      statusTooltip: missionDisplay.tooltip,
      status: snapshot.firstMission,
      href: MISSIONS_HREF,
      statusHref: resolveOnboardingStepStatusHref("firstMission", snapshot),
      enabled: snapshot.coachMeeting === "completed",
    },
  ];
}

type Props = {
  snapshot: MemberOnboardingSnapshot;
};

function stepBadgeStyle(status: string): { bg: string; color: string } {
  if (status === "completed") return { bg: "#22c55e", color: "#fff" };
  if (status === "in_progress" || status === "pending") return { bg: flashpointYellow, color: "#0a0a0a" };
  return { bg: "#6b7280", color: "#fff" };
}

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

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1.25,
          mb: 1.5,
          lineHeight: 1,
          "& .MuiTypography-root": { lineHeight: 1 },
        }}
      >
        {steps.map((step) => {
          const badge = stepBadgeStyle(step.status);
          const titleSx = {
            color: step.enabled ? "#fff" : "rgba(255,255,255,0.38)",
            fontWeight: 500,
            fontSize: "0.78rem",
            lineHeight: 1,
            mb: 0.2,
            textDecoration: "none",
            cursor: step.enabled ? "pointer" : "default",
            "&:hover": step.enabled ? { color: flashpointYellow } : undefined,
          };

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
                {step.enabled && step.href ? (
                  <Typography component={Link} href={step.href} sx={titleSx}>
                    {step.title}
                  </Typography>
                ) : (
                  <Typography sx={titleSx}>{step.title}</Typography>
                )}
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.15 }}>
                  <OnboardingStatusWithInfo
                    label={step.statusLabel}
                    tooltip={step.statusTooltip}
                    href={step.statusHref}
                    lineHeight={1}
                  />
                  {step.extraDetail ? (
                    <Typography
                      sx={{
                        color: "rgba(255,255,255,0.45)",
                        fontSize: "0.68rem",
                        lineHeight: 1,
                      }}
                    >
                      {step.extraDetail}
                    </Typography>
                  ) : null}
                </Box>
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
