"use client";

import {
  formatOnboardingStepLabel,
  type MemberOnboardingSnapshot,
} from "@/lib/onboarding/member-onboarding-status";
import { Box, Paper, Typography } from "@mui/material";

type StepKey = keyof Pick<MemberOnboardingSnapshot, "training" | "coachMeeting" | "firstMission">;

const STEPS: { key: StepKey; label: string }[] = [
  { key: "training", label: "Training" },
  { key: "coachMeeting", label: "Coach Meeting" },
  { key: "firstMission", label: "First Mission" },
];

function statusColor(status: string): string {
  if (status === "completed") return "#22c55e";
  if (status === "in_progress") return "#eab308";
  if (status === "locked") return "rgba(255,255,255,0.35)";
  return "rgba(255,255,255,0.55)";
}

type Props = {
  snapshot: MemberOnboardingSnapshot;
};

export function MemberOnboardingProgressCard({ snapshot }: Props) {
  return (
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
        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.78)" }}>
          Mission Rank:{" "}
          <Box component="span" sx={{ color: "#fff", fontWeight: 700 }}>
            {snapshot.rankLabel}
          </Box>
        </Typography>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
          gap: { xs: 1.5, sm: 2 },
        }}
      >
        {STEPS.map(({ key, label }) => {
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
                    boxShadow: status === "in_progress" ? `0 0 6px ${color}` : "none",
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
  );
}
