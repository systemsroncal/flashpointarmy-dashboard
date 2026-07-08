"use client";

import { ChapterMapInviteCta } from "@/components/dashboard/national-overview/ChapterMapInviteCta";
import { ChapterInviteShareDialog } from "@/components/dashboard/national-overview/ChapterInviteShareDialog";
import {
  MISSION_DIFFICULTY_COLORS,
  MISSION_DIFFICULTY_LABELS,
  MISSION_PHASES,
  type MissionCard,
} from "@/lib/missions/twelve-missions";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Box, Stack, Typography } from "@mui/material";
import { useState } from "react";

const MISSION_ICON_SIZE = "2.35rem";

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace("#", "");
  const expanded =
    normalized.length === 3
      ? normalized
          .split("")
          .map((c) => c + c)
          .join("")
      : normalized;
  const num = Number.parseInt(expanded, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function phaseHoverShadow(headerBg: string): string {
  const { r, g, b } = hexToRgb(headerBg);
  return `0 10px 28px rgba(${r}, ${g}, ${b}, 0.38)`;
}

function MissionCardItem({
  mission,
  missionLinksEnabled,
  phaseHeaderBg,
  onOpenShare,
}: {
  mission: MissionCard;
  missionLinksEnabled: boolean;
  phaseHeaderBg: string;
  onOpenShare: () => void;
}) {
  const accent = MISSION_DIFFICULTY_COLORS[mission.difficulty];
  const isShareAction = Boolean(mission.opensShareDialog) && !mission.comingSoon;
  const isLink = Boolean(mission.url) && !mission.comingSoon && missionLinksEnabled;
  const isInteractive = isLink || isShareAction;
  const showLinkLabel = (Boolean(mission.url) || isShareAction) && !mission.comingSoon;

  return (
    <Box
      component={isLink ? "a" : isShareAction ? "button" : "div"}
      type={isShareAction ? "button" : undefined}
      href={isLink ? mission.url : undefined}
      target={isLink ? "_blank" : undefined}
      rel={isLink ? "noopener noreferrer" : undefined}
      onClick={isShareAction ? onOpenShare : undefined}
      sx={{
        position: "relative",
        overflow: "hidden",
        borderRadius: "10px",
        bgcolor: "#fff",
        border: "1px solid rgba(0,0,0,0.06)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
        minHeight: { xs: 128, sm: 140 },
        height: "100%",
        display: "block",
        width: "100%",
        textDecoration: "none",
        textAlign: "left",
        color: "inherit",
        cursor: isInteractive ? "pointer" : "default",
        transition: "box-shadow 0.2s, transform 0.2s",
        ...(isShareAction && {
          font: "inherit",
          p: 0,
        }),
        "&:hover": {
          boxShadow: phaseHoverShadow(phaseHeaderBg),
          transform: "translateY(-1px)",
        },
      }}
    >
      {mission.comingSoon ? (
        <Box
          sx={{
            position: "absolute",
            top: "3px",
            right: "8px",
            pl: "7.2px",
            pr: "7.2px",
            pt: "0.8px",
            pb: "0.8px",
            borderRadius: "5px",
            bgcolor: "rgba(115, 115, 115, 0.1)",
            border: "1px solid rgba(115, 115, 115, 0.22)",
            fontSize: "0.55rem",
            fontWeight: 700,
            letterSpacing: "0.6px",
            color: "#737373",
            zIndex: 1,
          }}
        >
          COMING SOON
        </Box>
      ) : null}

      <Box
        sx={{
          position: "absolute",
          left: 8,
          top: 8,
          width: 22,
          height: 22,
          borderRadius: 0.75,
          bgcolor: accent,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 800,
          fontSize: "0.78rem",
          color: "#fff",
          zIndex: 1,
        }}
      >
        {mission.number}
      </Box>

      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          gap: { xs: 1.25, sm: 1.5 },
          p: { xs: 1.75, sm: 2.25 },
          pt: { xs: 2.5, sm: 2.75 },
          height: "100%",
          boxSizing: "border-box",
        }}
      >
        <Box
          aria-hidden
          sx={{
            width: MISSION_ICON_SIZE,
            height: MISSION_ICON_SIZE,
            minWidth: MISSION_ICON_SIZE,
            flexShrink: 0,
            mt: 0.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: accent,
            fontSize: MISSION_ICON_SIZE,
            lineHeight: 1,
            overflow: "hidden",
            "& svg": {
              width: "1em",
              height: "1em",
              maxWidth: "100%",
              maxHeight: "100%",
            },
          }}
        >
          <FontAwesomeIcon icon={mission.icon} fixedWidth />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: { xs: "0.9rem", sm: "0.98rem" },
              lineHeight: 1.35,
              color: "#111",
              mb: 0.75,
            }}
          >
            {mission.title}
          </Typography>
          <Stack spacing={0.25}>
            {mission.partner ? (
              <Typography
                sx={{
                  fontSize: { xs: "0.72rem", sm: "0.78rem" },
                  color: "#555",
                  lineHeight: 1.45,
                }}
              >
                {mission.partner}
              </Typography>
            ) : null}
            <Typography
              sx={{
                fontSize: { xs: "0.72rem", sm: "0.78rem" },
                color: "#666",
                lineHeight: 1.45,
              }}
            >
              {mission.description}
            </Typography>
            {showLinkLabel ? (
              <Typography
                sx={{
                  fontSize: { xs: "0.72rem", sm: "0.78rem" },
                  color: "#666",
                  lineHeight: 1.45,
                  fontStyle: "italic",
                  textDecoration: "underline",
                }}
              >
                {mission.linkLabel ?? "Click Here"}
              </Typography>
            ) : null}
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}

export function MissionsLanding({ missionLinksEnabled = true }: { missionLinksEnabled?: boolean }) {
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <Box
      sx={{
        minHeight: "70vh",
        py: { xs: 3, md: 5 },
        px: { xs: 1.5, sm: 2 },
        background: "linear-gradient(180deg, #1a1a1e 0%, #0e0e10 100%)",
      }}
    >
      <Box sx={{ textAlign: "center", mb: { xs: 3, md: 4 } }}>
        <Typography
          sx={{
            fontWeight: 900,
            letterSpacing: 3,
            fontSize: { xs: "0.85rem", sm: "0.95rem" },
            color: "rgba(255,255,255,0.75)",
            mb: 1.5,
          }}
        >
          FP ARMY CHAPTERS
        </Typography>
        <Typography
          component="h1"
          sx={{
            fontWeight: 900,
            fontSize: { xs: "1.75rem", sm: "2.35rem", md: "2.75rem" },
            color: "#fff",
            lineHeight: 1.15,
            mb: 1,
          }}
        >
          THE 12 MISSIONS TO SAVE AMERICA
        </Typography>
      </Box>

      <Box sx={{ maxWidth: 1460, mx: "auto" }}>
        <Stack spacing={{ xs: 2.5, md: 3 }}>
          {MISSION_PHASES.map((phase) => {
            const accent = MISSION_DIFFICULTY_COLORS[phase.difficulty];

            return (
              <Box
                key={phase.id}
                sx={{
                  borderRadius: 2.5,
                  overflow: "hidden",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: { xs: "flex-start", sm: "center" },
                    justifyContent: "space-between",
                    gap: 2,
                    flexDirection: { xs: "column", sm: "row" },
                    bgcolor: phase.headerBg,
                    px: { xs: 2, sm: 2.5, md: 3 },
                    py: { xs: 1.75, sm: 2 },
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontWeight: 800,
                        fontSize: { xs: "1rem", sm: "1.15rem", md: "1.25rem" },
                        color: "#fff",
                        letterSpacing: 0.4,
                        lineHeight: 1.25,
                      }}
                    >
                      {phase.title}
                    </Typography>
                    {phase.subtitle ? (
                      <Typography
                        sx={{
                          mt: 0.5,
                          fontSize: { xs: "0.82rem", sm: "0.9rem" },
                          color: "rgba(255,255,255,0.72)",
                          lineHeight: 1.4,
                        }}
                      >
                        {phase.subtitle}
                      </Typography>
                    ) : null}
                  </Box>

                  <Box
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 0.85,
                      flexShrink: 0,
                      px: 1.5,
                      py: 0.65,
                      borderRadius: 1.5,
                      bgcolor: "rgba(0,0,0,0.22)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        bgcolor: accent,
                      }}
                    />
                    <Typography
                      sx={{
                        fontWeight: 700,
                        fontSize: "0.82rem",
                        color: "#fff",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {MISSION_DIFFICULTY_LABELS[phase.difficulty]}
                    </Typography>
                  </Box>
                </Box>

                <Box
                  sx={{
                    bgcolor: "#fff",
                    p: { xs: 1.5, sm: 2, md: 2.5 },
                  }}
                >
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(4, 1fr)" },
                      gap: { xs: 1.5, sm: 2 },
                    }}
                  >
                    {phase.missions.map((mission) => (
                      <MissionCardItem
                        key={mission.number}
                        mission={mission}
                        missionLinksEnabled={missionLinksEnabled}
                        phaseHeaderBg={phase.headerBg}
                        onOpenShare={() => setShareOpen(true)}
                      />
                    ))}
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Stack>

        <Box
          sx={{
            mt: { xs: 2.5, md: 3 },
            borderRadius: 2.5,
            overflow: "hidden",
            bgcolor: "rgba(22,22,26,0.96)",
            border: "1px solid rgba(212, 175, 55, 0.35)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
            px: { xs: 2, sm: 2.5, md: 3 },
            pb: { xs: 2, sm: 2.5 },
          }}
        >
          <ChapterMapInviteCta />
        </Box>
      </Box>

      <ChapterInviteShareDialog open={shareOpen} onClose={() => setShareOpen(false)} />
    </Box>
  );
}
