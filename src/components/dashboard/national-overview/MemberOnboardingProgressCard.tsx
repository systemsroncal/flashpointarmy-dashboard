"use client";

import { MissionRankInfoDialog } from "@/components/dashboard/national-overview/MissionRankInfoDialog";
import { coachMeetingStepTitle } from "@/lib/onboarding/coach-meeting-labels";
import {
  formatOnboardingStepLabel,
  type MemberOnboardingSnapshot,
} from "@/lib/onboarding/member-onboarding-status";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { Box, IconButton, Paper, Tooltip, Typography } from "@mui/material";
import { useMemo, useState } from "react";

type StepKey = keyof Pick<MemberOnboardingSnapshot, "training" | "coachMeeting" | "firstMission">;

function statusColor(status: string): string {
  if (status === "completed") return "#22c55e";
  if (status === "in_progress" || status === "pending") return "#f1900f";
  if (status === "locked") return "rgba(255,255,255,0.35)";
  return "rgba(255,255,255,0.55)";
}

type Props = {
  snapshot: MemberOnboardingSnapshot;
};

export function MemberOnboardingProgressCard({ snapshot }: Props) {
  const [rankInfoOpen, setRankInfoOpen] = useState(false);

  const steps = useMemo(
    (): { key: StepKey; label: string }[] => [
      { key: "training", label: "Training" },
      { key: "coachMeeting", label: coachMeetingStepTitle(snapshot.rankAudience) },
      { key: "firstMission", label: "Choose Your Mission" },
    ],
    [snapshot.rankAudience]
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
          {steps.map(({ key, label }) => {
            const status = snapshot[key];
            const color = statusColor(status);
            return (
              <Box key={key}>
                <Typography
                  sx={{
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: { xs: "1rem", sm: "1.05rem" },
                    mb: 0.75,
                  }}
                >
                  {label}
                </Typography>
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
                  <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.72)", fontSize: "0.92rem" }}>
                    {formatOnboardingStepLabel(status)}
                  </Typography>
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
