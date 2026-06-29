"use client";

import { TWELVE_MISSIONS_SECTIONS } from "@/lib/missions/twelve-missions";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Box, Paper, Stack, Typography } from "@mui/material";

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
          maxWidth: 1200,
          mx: "auto",
          borderRadius: 3,
          bgcolor: "#fff",
          p: { xs: 2, sm: 3, md: 4 },
        }}
      >
        {TWELVE_MISSIONS_SECTIONS.map((section) => (
          <Box key={section.id} sx={{ mb: { xs: 3, md: 4 } }}>
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: { xs: "1.05rem", sm: "1.2rem" },
                color: "#111",
                mb: 2,
                pb: 1,
                borderBottom: "2px solid #e8e8e8",
              }}
            >
              {section.heading}
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(4, 1fr)" },
                gap: { xs: 1.5, sm: 2 },
              }}
            >
              {section.missions.map((mission) => {
                const descriptionLines = mission.partner
                  .split(" · ")
                  .map((line) => line.trim())
                  .filter(Boolean);

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
                      p: { xs: 1.5, sm: 2 },
                      borderRadius: 2,
                      bgcolor: "rgb(245, 245, 245)",
                      border: "1px solid #e0e0e0",
                      minHeight: { xs: 120, sm: 132 },
                      display: "flex",
                      alignItems: "flex-start",
                      gap: { xs: 1.25, sm: 1.5 },
                      cursor: "pointer",
                      transition: "box-shadow 0.2s, border-color 0.2s",
                      "&:hover": {
                        borderColor: "#c9a227",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: 0.75,
                        bgcolor: "#737373",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 800,
                        fontSize: "0.8rem",
                        color: "#fff",
                        flexShrink: 0,
                      }}
                    >
                      {mission.number}
                    </Box>

                    <FontAwesomeIcon
                      icon={mission.icon}
                      style={{
                        fontSize: "2.5rem",
                        color: "#737373",
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
                        {descriptionLines.map((line) => (
                          <Typography
                            key={line}
                            sx={{
                              fontSize: { xs: "0.72rem", sm: "0.78rem" },
                              color: "#666",
                              lineHeight: 1.45,
                            }}
                          >
                            {line}
                          </Typography>
                        ))}
                      </Stack>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
        ))}
      </Paper>
    </Box>
  );
}
