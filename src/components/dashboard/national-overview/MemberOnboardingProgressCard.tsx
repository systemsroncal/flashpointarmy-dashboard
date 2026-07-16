"use client";

import { MissionRankInfoDialog } from "@/components/dashboard/national-overview/MissionRankInfoDialog";
import { OnboardingStatusWithInfo } from "@/components/dashboard/onboarding/OnboardingStatusWithInfo";
import { coachMeetingStepTitle } from "@/lib/onboarding/coach-meeting-labels";
import {
  coachMeetingStepDisplay,
  firstMissionStepDisplay,
  firstMissionStepTitle,
  trainingStepDisplay,
} from "@/lib/onboarding/onboarding-step-display";
import type { MemberOnboardingSnapshot } from "@/lib/onboarding/member-onboarding-status";
import { resolveOnboardingStepStatusHref } from "@/lib/onboarding/onboarding-navigation";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { Box, IconButton, Paper, Tooltip, Typography } from "@mui/material";
import Link from "next/link";
import { useMemo, useState } from "react";

type StepKey = keyof Pick<MemberOnboardingSnapshot, "training" | "coachMeeting" | "firstMission">;

function statusColor(status: string): string {
  if (status === "completed") return "#22c55e";
  if (status === "in_progress" || status === "pending") return "#f1900f";
  if (status === "locked") return "rgba(255,255,255,0.35)";
  return "rgba(255,255,255,0.55)";
}

function stepTitleButtonSx(status: string, linkable: boolean) {
  const base = {
    display: "inline-block",
    px: 1.25,
    py: 0.55,
    borderRadius: 1.25,
    border: "1px solid",
    fontWeight: 700,
    fontSize: { xs: "0.92rem", sm: "0.95rem" },
    lineHeight: 1.3,
    mb: 0.75,
    textDecoration: "none",
    transition: "background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease",
  } as const;

  if (status === "completed") {
    return {
      ...base,
      color: "#dcfce7",
      bgcolor: "rgba(34, 197, 94, 0.16)",
      borderColor: "rgba(34, 197, 94, 0.38)",
      ...(linkable
        ? {
            cursor: "pointer",
            "&:hover": {
              bgcolor: "rgba(34, 197, 94, 0.24)",
              borderColor: "rgba(34, 197, 94, 0.55)",
            },
          }
        : {}),
    };
  }

  if (status === "in_progress" || status === "pending") {
    return {
      ...base,
      color: "#fff7ed",
      bgcolor: "rgba(241, 144, 15, 0.18)",
      borderColor: "rgba(241, 144, 15, 0.42)",
      ...(linkable
        ? {
            cursor: "pointer",
            "&:hover": {
              bgcolor: "rgba(241, 144, 15, 0.28)",
              borderColor: "rgba(241, 144, 15, 0.58)",
            },
          }
        : {}),
    };
  }

  if (status === "locked") {
    return {
      ...base,
      color: "rgba(255,255,255,0.45)",
      bgcolor: "rgba(255,255,255,0.05)",
      borderColor: "rgba(255,255,255,0.12)",
      cursor: "default",
    };
  }

  return {
    ...base,
    color: "#fff",
    bgcolor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.16)",
    ...(linkable ? { cursor: "pointer" } : {}),
  };
}

type Props = {
  snapshot: MemberOnboardingSnapshot;
};

export function MemberOnboardingProgressCard({ snapshot }: Props) {
  const [rankInfoOpen, setRankInfoOpen] = useState(false);

  const steps = useMemo(
    (): {
      key: StepKey;
      label: string;
      statusLabel: string;
      tooltip: string;
      status: string;
      statusHref: string | null;
    }[] => {
      const training = trainingStepDisplay(snapshot.training);
      const coach = coachMeetingStepDisplay(snapshot.coachMeeting, snapshot.rankAudience);
      const mission = firstMissionStepDisplay(snapshot.firstMission, snapshot.rankAudience);
      return [
        {
          key: "training",
          label: "Training",
          statusLabel: training.label,
          tooltip: training.tooltip,
          status: snapshot.training,
          statusHref: resolveOnboardingStepStatusHref("training", snapshot),
        },
        {
          key: "coachMeeting",
          label: coachMeetingStepTitle(snapshot.rankAudience),
          statusLabel: coach.label,
          tooltip: coach.tooltip,
          status: snapshot.coachMeeting,
          statusHref: resolveOnboardingStepStatusHref("coachMeeting", snapshot),
        },
        {
          key: "firstMission",
          label: firstMissionStepTitle(),
          statusLabel: mission.label,
          tooltip: mission.tooltip,
          status: snapshot.firstMission,
          statusHref: resolveOnboardingStepStatusHref("firstMission", snapshot),
        },
      ];
    },
    [snapshot]
  );

  return (
    <>
      <Paper
        sx={{
          p: { xs: 2, sm: 2.5 },
          mb: 2,
          bgcolor: "rgba(0,0,0,0.45)",
          border: "1px solid rgba(212, 175, 55, 0.45)",
          borderRadius: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 1,
            mb: 2,
          }}
        >
          <Typography variant="h6" sx={{ color: "primary.main", fontWeight: 800, fontSize: "1.05rem" }}>
            Complete your onboarding
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
            <Tooltip title="Mission rank information">
              <IconButton
                size="small"
                aria-label="Mission rank information"
                onClick={() => setRankInfoOpen(true)}
                sx={{
                  color: "rgba(255,255,255,0.72)",
                  "&:hover": { color: "primary.main", bgcolor: "rgba(255,255,255,0.06)" },
                }}
              >
                <InfoOutlinedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.78)" }}>
              Mission Rank:{" "}
              <Box component="span" sx={{ color: "#fff", fontWeight: 700 }}>
                {snapshot.rankLabel}
              </Box>
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
            gap: { xs: 1.5, sm: 2 },
          }}
        >
          {steps.map(({ key, label, statusLabel, tooltip, status, statusHref }) => {
            const color = statusColor(status);
            const titleLinkable = Boolean(statusHref);
            const titleSx = stepTitleButtonSx(status, titleLinkable);
            return (
              <Box key={key}>
                {titleLinkable ? (
                  <Typography component={Link} href={statusHref!} sx={titleSx}>
                    {label}
                  </Typography>
                ) : (
                  <Typography sx={titleSx}>{label}</Typography>
                )}
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                  <Box
                    aria-hidden
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: color,
                      flexShrink: 0,
                      boxShadow:
                        status === "in_progress" || status === "pending"
                          ? `0 0 6px ${color}`
                          : "none",
                    }}
                  />
                  <Box sx={{ color: "rgba(255,255,255,0.72)", fontSize: "0.92rem" }}>
                    <OnboardingStatusWithInfo
                      label={statusLabel}
                      tooltip={tooltip}
                      href={statusHref}
                      size="default"
                    />
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Paper>

      <MissionRankInfoDialog
        open={rankInfoOpen}
        audience={snapshot.rankAudience}
        onClose={() => setRankInfoOpen(false)}
      />
    </>
  );
}
