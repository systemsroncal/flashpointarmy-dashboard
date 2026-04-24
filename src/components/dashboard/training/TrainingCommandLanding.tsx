"use client";

import CheckBoxIcon from "@mui/icons-material/CheckBox";
import { Box, Button, Link as MuiLink, Typography } from "@mui/material";
import Link from "next/link";
import { CourseVideoPlyr } from "@/components/courses/CourseVideoPlyr";
import { TrainingIntroVideoAdmin } from "@/components/dashboard/training/TrainingIntroVideoAdmin";

const checklist = [
  "This is your briefing room.",
  "Your equipping ground.",
  "Your launch point.",
];

type IntroVideoAdminProps = {
  initialDbUrl: string;
  hasEnvFallback: boolean;
};

type Props = {
  /** Optional intro video (YouTube/Vimeo/MP4 URL). */
  introVideoUrl?: string | null;
  /** Primary CTA course path, e.g. `/dashboard/course/biblical-citizenship`. */
  primaryCourseHref?: string;
  /** Shown to super_admin / admin: edit URL stored in `training_settings`. */
  introVideoAdmin?: IntroVideoAdminProps | null;
};

export function TrainingCommandLanding({
  introVideoUrl,
  primaryCourseHref = "/dashboard/course/biblical-citizenship",
  introVideoAdmin,
}: Props) {
  const trimmedIntro = introVideoUrl?.trim() ?? "";

  return (
    <Box
      sx={{
        position: "relative",
        minHeight: "72vh",
        py: { xs: 3, md: 5 },
        px: { xs: 1, sm: 2 },
        overflow: "hidden",
        backgroundColor: "#0e0e10",
        backgroundImage: `radial-gradient(ellipse at 50% 0%, rgba(255,200,60,0.06), transparent 55%),
          linear-gradient(180deg, #121214 0%, #0a0a0c 100%)`,
      }}
    >
      <Typography
        aria-hidden
        sx={{
          position: "absolute",
          left: { xs: -4, md: 8 },
          top: "18%",
          writingMode: "vertical-rl",
          transform: "rotate(180deg)",
          fontSize: { xs: "2.5rem", md: "4rem" },
          fontWeight: 800,
          color: "rgba(255,255,255,0.06)",
          letterSpacing: 4,
          userSelect: "none",
          pointerEvents: "none",
        }}
      >
        PREPARE
      </Typography>
      <Typography
        aria-hidden
        sx={{
          position: "absolute",
          right: { xs: -4, md: 8 },
          top: "18%",
          writingMode: "vertical-rl",
          fontSize: { xs: "2.5rem", md: "4rem" },
          fontWeight: 800,
          color: "rgba(255,255,255,0.06)",
          letterSpacing: 4,
          userSelect: "none",
          pointerEvents: "none",
        }}
      >
        STAND FIRM
      </Typography>

      <Box
        sx={{
          maxWidth: 720,
          mx: "auto",
          position: "relative",
          zIndex: 1,
          borderRadius: 2,
          border: "1px solid rgba(212, 175, 55, 0.55)",
          boxShadow: "0 0 0 1px rgba(0,0,0,0.5), 0 24px 48px rgba(0,0,0,0.45)",
          bgcolor: "rgba(22,22,26,0.96)",
          p: { xs: 2.5, sm: 3.5 },
        }}
      >
        <Typography
          component="h1"
          sx={{
            fontWeight: 800,
            fontSize: { xs: "1.35rem", sm: "1.6rem" },
            color: "#fff",
            mb: 1.5,
            lineHeight: 1.25,
          }}
        >
          Welcome to FlashPoint Army Training Command
        </Typography>
        <Typography sx={{ color: "rgba(255,255,255,0.82)", mb: 2, lineHeight: 1.6 }}>
          Are you ready to step into disciplined, faith-driven leadership and deepen your understanding of Biblical
          citizenship?
        </Typography>
        <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, mb: 2 }}>
          {checklist.map((line) => (
            <Box
              key={line}
              component="li"
              sx={{ display: "flex", alignItems: "flex-start", gap: 1, mb: 1 }}
            >
              <CheckBoxIcon sx={{ color: "#2e7d32", fontSize: 22, mt: 0.1 }} />
              <Typography sx={{ color: "rgba(255,255,255,0.9)" }}>{line}</Typography>
            </Box>
          ))}
        </Box>
        <Typography sx={{ color: "rgba(255,255,255,0.85)", mb: 1.5 }}>
          Watch the introduction below and prepare to engage.
        </Typography>

        <Box
          sx={{
            position: "relative",
            borderRadius: 2,
            overflow: "hidden",
            mb: 2.5,
            bgcolor: "#000",
            aspectRatio: "16/9",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {trimmedIntro ? (
            <CourseVideoPlyr
              videoUrl={trimmedIntro}
              initialSeconds={0}
              onPersistSeconds={() => {}}
              autoplayMuted
              omitPlayLargeControl
            />
          ) : (
            <Box
              sx={{
                height: "100%",
                minHeight: 200,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "text.secondary",
                px: 2,
                textAlign: "center",
              }}
            >
              <Typography variant="body2">
                Intro video not configured. Set{" "}
                <Box component="code" sx={{ color: "primary.light" }}>
                  NEXT_PUBLIC_TRAINING_INTRO_VIDEO
                </Box>{" "}
                to a YouTube, Vimeo, or MP4 URL.
              </Typography>
            </Box>
          )}
        </Box>

        <Button
          component={Link}
          href={primaryCourseHref}
          variant="contained"
          fullWidth
          sx={{
            py: 1.25,
            fontWeight: 800,
            color: "#0a0a0a",
            bgcolor: "primary.main",
            "&:hover": { bgcolor: "primary.light" },
            mb: 3,
          }}
        >
          Begin Your Training
        </Button>

        <Typography
          sx={{
            fontWeight: 900,
            letterSpacing: 2,
            color: "#fff",
            fontSize: { xs: "1.5rem", sm: "1.75rem" },
            mb: 0.5,
          }}
        >
          THE MISSION
        </Typography>
        <Typography sx={{ color: "rgba(255,255,255,0.88)", fontWeight: 700, mb: 1.5 }}>
          Your Training Assignment
        </Typography>
        <Typography sx={{ color: "rgba(255,255,255,0.78)", mb: 1.5, lineHeight: 1.65 }}>
          In partnership with Patriot Academy, this track equips believers to understand liberty, think critically, and
          engage their communities with Biblical clarity.
        </Typography>
        <Typography sx={{ color: "rgba(255,255,255,0.9)", fontWeight: 600, mb: 0.5 }}>
          This is not passive learning.
        </Typography>
        <Typography sx={{ color: "rgba(255,255,255,0.75)", mb: 2.5 }}>This is preparation.</Typography>

        <Button
          component={Link}
          href={primaryCourseHref}
          variant="contained"
          fullWidth
          sx={{
            py: 1.25,
            fontWeight: 800,
            color: "#0a0a0a",
            bgcolor: "primary.main",
            "&:hover": { bgcolor: "primary.light" },
          }}
        >
          Begin Your Training
        </Button>

        <Typography variant="caption" sx={{ display: "block", mt: 2, color: "text.secondary", textAlign: "center" }}>
          Course URL example:{" "}
          <MuiLink component={Link} href={primaryCourseHref} color="primary">
            {primaryCourseHref}
          </MuiLink>
        </Typography>

        {introVideoAdmin ? <TrainingIntroVideoAdmin {...introVideoAdmin} /> : null}
      </Box>
    </Box>
  );
}
