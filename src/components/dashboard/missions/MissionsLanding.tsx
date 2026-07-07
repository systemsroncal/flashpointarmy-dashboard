"use client";

import {
  MISSION_DIFFICULTY_STYLES,
  TWELVE_MISSIONS,
  type MissionDifficulty,
} from "@/lib/missions/twelve-missions";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Box, Paper, Stack, Typography } from "@mui/material";

const DIFFICULTY_ORDER: MissionDifficulty[] = ["beginner", "intermediate", "advanced"];

function MissionsLegend() {
  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: { xs: 1.5, sm: 2.5 },
        mb: { xs: 3, md: 4 },
        pb: 2,
        borderBottom: "2px solid #e8e8e8",
      }}
    >
      {DIFFICULTY_ORDER.map((difficulty) => {
        const style = MISSION_DIFFICULTY_STYLES[difficulty];
        return (
          <Box
            key={difficulty}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Box
              sx={{
                width: 14,
                height: 14,
                borderRadius: "50%",
                bgcolor: style.color,
                flexShrink: 0,
              }}
            />
            <Typography sx={{ fontSize: { xs: "0.8rem", sm: "0.88rem" }, color: "#333" }}>
              <Box component="span" sx={{ fontWeight: 700, color: style.color }}>
                {style.phases}
              </Box>
              {" · "}
              {style.label}
            </Typography>
          </Box>
        );
      })}
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

      <Paper
        elevation={0}
        sx={{
          maxWidth: 1460,
          mx: "auto",
          borderRadius: 3,
          bgcolor: "#fff",
          p: { xs: 2, sm: 3, md: 4 },
        }}
      >
        <MissionsLegend />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(4, 1fr)" },
            gap: { xs: 1.5, sm: 2 },
          }}
        >
          {TWELVE_MISSIONS.map((mission) => {
            const missionAccent = MISSION_DIFFICULTY_STYLES[mission.difficulty].color;

            return (
              <Box
                key={mission.number}
                role="button"
                tabIndex={0}
                onClick={() => {
                  /* prototype — mission selection TBD */
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                  }
                }}
                sx={{
                  position: "relative",
                  overflow: "hidden",
                  borderRadius: 2,
                  bgcolor: "rgb(245, 245, 245)",
                  border: `1px solid ${missionAccent}40`,
                  borderLeft: `4px solid ${missionAccent}`,
                  minHeight: { xs: 120, sm: 132 },
                  height: "100%",
                  cursor: "pointer",
                  transition: "box-shadow 0.2s, border-color 0.2s",
                  "&:hover": {
                    borderColor: missionAccent,
                    boxShadow: `0 8px 24px ${missionAccent}22`,
                  },
                }}
              >
                <Box
                  sx={{
                    position: "absolute",
                    left: "5px",
                    top: "6px",
                    width: 20,
                    height: 20,
                    borderRadius: 0.75,
                    bgcolor: missionAccent,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: "calc(0.8rem - 2px)",
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
                    p: { xs: 1.5, sm: 2 },
                    height: "100%",
                    boxSizing: "border-box",
                  }}
                >
                  <FontAwesomeIcon
                    icon={mission.icon}
                    style={{
                      fontSize: "calc(2.5rem - 2px)",
                      color: missionAccent,
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  />

                  <Box sx={{ flex: 1, minWidth: 0, pt: 0.15 }}>
                    <Typography
                      sx={{
                        fontWeight: 800,
                        fontSize: { xs: "0.88rem", sm: "0.95rem" },
                        lineHeight: 1.35,
                        color: "#111",
                        mb: 0.75,
                      }}
                    >
                      {mission.title}
                    </Typography>
                    <Stack spacing={0.15}>
                      <Typography
                        sx={{
                          fontSize: { xs: "0.72rem", sm: "0.78rem" },
                          color: "#666",
                          lineHeight: 1.45,
                        }}
                      >
                        {mission.description}
                      </Typography>
                      {mission.partner ? (
                        <Typography
                          sx={{
                            fontSize: { xs: "0.72rem", sm: "0.78rem" },
                            color: "#666",
                            lineHeight: 1.45,
                            fontWeight: 600,
                          }}
                        >
                          {mission.partner}
                        </Typography>
                      ) : null}
                    </Stack>
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Paper>
    </Box>
  );
}
