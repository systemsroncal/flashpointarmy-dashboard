"use client";

import { JourneyWelcomeDialog } from "@/components/dashboard/onboarding/JourneyWelcomeDialog";
import { ChapterMapInviteCta } from "@/components/dashboard/national-overview/ChapterMapInviteCta";
import { ChapterInviteShareDialog } from "@/components/dashboard/national-overview/ChapterInviteShareDialog";
import {
  MISSION_DIFFICULTY_COLORS,
  MISSION_DIFFICULTY_LABELS,
  MISSION_PHASES,
  type MissionCard,
} from "@/lib/missions/twelve-missions";
import { missionPartnerLogoUrl, missionPartnerLogoUsesTallSize } from "@/lib/missions/mission-partner-logos";
import {
  MISSIONS_WELCOME_HTML,
  MISSIONS_WELCOME_TITLE,
} from "@/lib/missions/missions-welcome-content";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import { Box, Button, IconButton, Stack, Tooltip, Typography } from "@mui/material";
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
  phaseActionColor,
  onOpenShare,
}: {
  mission: MissionCard;
  missionLinksEnabled: boolean;
  phaseHeaderBg: string;
  phaseActionColor?: string;
  onOpenShare: () => void;
}) {
  const accent = phaseActionColor ?? MISSION_DIFFICULTY_COLORS[mission.difficulty];
  const isShareAction = Boolean(mission.opensShareDialog) && !mission.comingSoon;
  const isExternalLink = Boolean(mission.url) && !mission.comingSoon && missionLinksEnabled;
  const showActionButton = isExternalLink || isShareAction;
  const partnerLogo = mission.partnerLogoUrl ?? missionPartnerLogoUrl(mission.url);
  const partnerLogoTall = missionPartnerLogoUsesTallSize(mission.url, mission.partnerLogoSize);
  const descriptionFontSize = { xs: "0.845rem", sm: "0.905rem" };

  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        borderRadius: "10px",
        bgcolor: "#fff",
        border: "1px solid rgba(0,0,0,0.06)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
        minHeight: { xs: 128, sm: 140 },
        height: "100%",
        display: "flex",
        flexDirection: "column",
        width: "100%",
        textAlign: "left",
        color: "inherit",
        pb: partnerLogo ? (partnerLogoTall ? 7 : 5) : 0,
        transition: "box-shadow 0.2s, transform 0.2s",
        "&:hover": showActionButton
          ? {
              boxShadow: phaseHoverShadow(phaseHeaderBg),
              transform: "translateY(-1px)",
            }
          : undefined,
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
          flex: 1,
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
                  fontSize: descriptionFontSize,
                  color: "#555",
                  lineHeight: 1.45,
                }}
              >
                {mission.partner}
              </Typography>
            ) : null}
            <Typography
              sx={{
                fontSize: descriptionFontSize,
                color: "#666",
                lineHeight: 1.45,
              }}
            >
              {mission.description}
            </Typography>
          </Stack>
        </Box>
      </Box>

      {showActionButton ? (
        <Box sx={{ px: { xs: 1.75, sm: 2.25 }, pb: { xs: 1.75, sm: 2.25 }, pt: 0 }}>
          <Button
            component={isExternalLink ? "a" : "button"}
            href={isExternalLink ? mission.url : undefined}
            target={isExternalLink ? "_blank" : undefined}
            rel={isExternalLink ? "noopener noreferrer" : undefined}
            onClick={isShareAction ? onOpenShare : undefined}
            variant="contained"
            size="small"
            endIcon={isExternalLink ? <OpenInNewIcon sx={{ fontSize: "0.95rem !important" }} /> : <ShareOutlinedIcon sx={{ fontSize: "0.95rem !important" }} />}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.78rem",
              borderRadius: 1.25,
              px: 1.75,
              py: 0.65,
              bgcolor: accent,
              boxShadow: "0 2px 6px rgba(0,0,0,0.18)",
              "&:hover": {
                bgcolor: accent,
                filter: "brightness(0.92)",
                boxShadow: "0 3px 10px rgba(0,0,0,0.22)",
              },
            }}
          >
            {mission.linkLabel ?? (isShareAction ? "Start Inviting" : "Click Here")}
          </Button>
        </Box>
      ) : null}

      {partnerLogo ? (
        <Box
          component="img"
          src={partnerLogo}
          alt=""
          sx={{
            display: "block",
            position: "absolute",
            bottom: 4,
            right: 4,
            objectFit: "contain",
            objectPosition: "right bottom",
            ...(partnerLogoTall
              ? {
                  width: "auto",
                  maxWidth: { xs: "52%", sm: "48%" },
                  height: { xs: 40, sm: 55 },
                }
              : {
                  width: "22%",
                  height: 31,
                }),
          }}
        />
      ) : null}
    </Box>
  );
}

export function MissionsLanding({
  missionLinksEnabled = true,
  showWelcome = false,
}: {
  missionLinksEnabled?: boolean;
  showWelcome?: boolean;
}) {
  const [shareOpen, setShareOpen] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(showWelcome);

  return (
    <Box
      sx={{
        minHeight: "70vh",
        py: { xs: 3, md: 5 },
        px: { xs: 1.5, sm: 2 },
        background: "linear-gradient(180deg, #1a1a1e 0%, #0e0e10 100%)",
      }}
    >
      <JourneyWelcomeDialog
        open={welcomeOpen}
        kind="missions"
        title={MISSIONS_WELCOME_TITLE}
        contentHtml={MISSIONS_WELCOME_HTML}
        maxWidthPx={850}
        ctaLabel="Start missions"
        onDismissed={() => setWelcomeOpen(false)}
      />
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
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: { xs: 0.75, sm: 1 },
            flexWrap: "wrap",
            mb: 1,
          }}
        >
          <Typography
            component="h1"
            sx={{
              fontWeight: 900,
              fontSize: { xs: "1.75rem", sm: "2.35rem", md: "2.75rem" },
              color: "#fff",
              lineHeight: 1.15,
            }}
          >
            THE 12 MISSIONS TO SAVE AMERICA
          </Typography>
          <Tooltip title="About the 12 Missions">
            <IconButton
              onClick={() => setWelcomeOpen(true)}
              aria-label="About the 12 Missions"
              sx={{
                color: "rgba(255,255,255,0.72)",
                p: 0.5,
                "&:hover": { color: "primary.main", bgcolor: "rgba(255,255,255,0.06)" },
              }}
            >
              <InfoOutlinedIcon sx={{ fontSize: { xs: "1.35rem", sm: "1.55rem", md: "1.7rem" } }} />
            </IconButton>
          </Tooltip>
        </Box>
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
                        phaseActionColor={phase.actionColor}
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
