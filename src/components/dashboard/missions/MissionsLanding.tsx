"use client";

import {
  MISSION_DIFFICULTY_COLORS,
  MISSION_DIFFICULTY_LABELS,
  MISSION_PHASES,
  type MissionCard,
} from "@/lib/missions/twelve-missions";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Box, Stack, Typography } from "@mui/material";

function MissionCardItem({ mission }: { mission: MissionCard }) {
  const accent = MISSION_DIFFICULTY_COLORS[mission.difficulty];
  const isLink = Boolean(mission.url) && !mission.comingSoon;

  return (
    <Box
      component={isLink ? "a" : "div"}
      href={isLink ? mission.url : undefined}
      target={isLink ? "_blank" : undefined}
      rel={isLink ? "noopener noreferrer" : undefined}
      sx={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 2.5,
        bgcolor: "#fff",
        border: "1px solid rgba(0,0,0,0.06)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
        minHeight: { xs: 128, sm: 140 },
        height: "100%",
        display: "block",
        textDecoration: "none",
        color: "inherit",
        cursor: isLink ? "pointer" : "default",
        transition: "box-shadow 0.2s, transform 0.2s",
        ...(isLink && {
          "&:hover": {
            boxShadow: "0 10px 28px rgba(0,0,0,0.18)",
            transform: "translateY(-1px)",
          },
        }),
      }}
    >
      {mission.comingSoon ? (
        <Box
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            px: 0.9,
            py: 0.35,
            borderRadius: 1,
            bgcolor: "rgba(115, 115, 115, 0.1)",
            border: "1px solid rgba(115, 115, 115, 0.22)",
            fontSize: "0.62rem",
            fontWeight: 700,
            letterSpacing: 0.6,
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
        <FontAwesomeIcon
          icon={mission.icon}
          style={{
            fontSize: "2.35rem",
            color: accent,
            flexShrink: 0,
            marginTop: 4,
          }}
        />

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
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}

export function MissionsLanding() {
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
        <Typography sx={{ color: "rgba(255,255,255,0.78)", fontSize: { xs: "1rem", sm: "1.1rem" } }}>
          Pick the first action your chapter will champion.
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
                      <MissionCardItem key={mission.number} mission={mission} />
                    ))}
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Stack>
      </Box>
    </Box>
  );
}
