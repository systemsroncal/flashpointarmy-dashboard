"use client";

import CheckBoxIcon from "@mui/icons-material/CheckBox";
import { Box, Button, Typography } from "@mui/material";
import Link from "next/link";
import { CourseVideoPlyr } from "@/components/courses/CourseVideoPlyr";
import { ExternalTrainingCertificateBanner } from "@/components/dashboard/training/ExternalTrainingCertificateBanner";
import { TrainingIntroVideoAdmin } from "@/components/dashboard/training/TrainingIntroVideoAdmin";

const assignmentSteps = [
  "Watch the introduction from Gene Bailey below.",
  "Complete all lessons in the Biblical Citizenship course at your own pace.",
  'If you have already completed this course through Patriot Academy, select "Continue Here" below to continue your journey.',
];

type IntroVideoAdminProps = {
  initialDbUrl: string;
  hasEnvFallback: boolean;
};

type Props = {
  /** Welcome video (Gene Bailey) — embedded on this page. */
  welcomeVideoUrl?: string | null;
  /** Course intro URL stored in training_settings (admin editor only; shown on course page). */
  courseIntroVideoUrl?: string | null;
  /** Primary CTA course path, e.g. `/dashboard/course/biblical-citizenship`. */
  primaryCourseHref?: string;
  /** Patriot Academy certificate link below the main CTA. */
  showExternalCertPrompt?: boolean;
  externalCourseTitle?: string;
  introVideoAdmin?: IntroVideoAdminProps | null;
};

export function TrainingCommandLanding({
  welcomeVideoUrl,
  courseIntroVideoUrl: _courseIntroVideoUrl,
  primaryCourseHref = "/dashboard/course/biblical-citizenship",
  showExternalCertPrompt = false,
  externalCourseTitle = "Biblical Citizenship",
  introVideoAdmin,
}: Props) {
  const trimmedWelcome = welcomeVideoUrl?.trim() ?? "";

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
          maxWidth: 1100,
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

        <Typography sx={{ color: "rgba(255,255,255,0.88)", fontWeight: 600, mb: 1.5, lineHeight: 1.5 }}>
          Every mission begins with preparation.
        </Typography>
        <Typography sx={{ color: "rgba(255,255,255,0.82)", mb: 2.5, lineHeight: 1.7 }}>
          Before leading, serving, or participating in your local chapter, every member is asked to complete the Biblical
          Citizenship course. This foundational training will equip you with the Biblical principles, historical
          context, and civic understanding that unite every FlashPoint Army Chapter across the nation.
        </Typography>

        <Typography sx={{ color: "rgba(255,255,255,0.92)", fontWeight: 700, mb: 1.25, fontSize: "1.05rem" }}>
          Your First Assignment
        </Typography>
        <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, mb: 2 }}>
          {assignmentSteps.map((line) => (
            <Box
              key={line}
              component="li"
              sx={{ display: "flex", alignItems: "flex-start", gap: 1, mb: 1 }}
            >
              <CheckBoxIcon sx={{ color: "#2e7d32", fontSize: 22, mt: 0.1, flexShrink: 0 }} />
              <Typography sx={{ color: "rgba(255,255,255,0.9)", lineHeight: 1.65 }}>{line}</Typography>
            </Box>
          ))}
        </Box>

        <Typography sx={{ color: "rgba(255,255,255,0.78)", mb: 2, lineHeight: 1.65, fontStyle: "italic" }}>
          Your progress will be saved automatically as you move through each lesson.
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
          {trimmedWelcome ? (
            <CourseVideoPlyr
              videoUrl={trimmedWelcome}
              initialSeconds={0}
              onPersistSeconds={() => {}}
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
              <Typography variant="body2">Welcome video is not configured.</Typography>
            </Box>
          )}
        </Box>

        <Typography
          sx={{
            fontWeight: 900,
            letterSpacing: 2,
            color: "#fff",
            fontSize: { xs: "1.5rem", sm: "1.75rem" },
            mb: 1,
            mt: 1,
          }}
        >
          THE MISSION
        </Typography>
        <Typography sx={{ color: "rgba(255,255,255,0.82)", mb: 1.5, lineHeight: 1.7 }}>
          In partnership with Patriot Academy, this training prepares believers to understand liberty, think Biblically,
          and engage their communities with wisdom, conviction, and purpose.
        </Typography>
        <Typography sx={{ color: "rgba(255,255,255,0.9)", fontWeight: 600, mb: 0.5 }}>
          This is more than a course.
        </Typography>
        <Typography sx={{ color: "rgba(255,255,255,0.78)", mb: 1 }}>
          It is the foundation for every chapter, every leader, and every mission that follows.
        </Typography>
        <Typography sx={{ color: "rgba(255,255,255,0.85)", fontWeight: 600, mb: 2.5 }}>
          Complete your training. Then prepare to take action.
        </Typography>

        <Button
          component={Link}
          href={primaryCourseHref}
          variant="contained"
          fullWidth
          sx={{
            py: 1.25,
            minHeight: 48,
            touchAction: "manipulation",
            fontWeight: 800,
            fontSize: { xs: "0.95rem", sm: "1rem" },
            "@media (min-width: 1101px)": {
              fontSize: "1.2rem",
              py: 1.5,
              minHeight: 52,
            },
            color: "#0a0a0a",
            bgcolor: "primary.main",
            "&:hover": { bgcolor: "primary.light" },
          }}
        >
          Start Biblical Citizenship
        </Button>

        {showExternalCertPrompt ? (
          <ExternalTrainingCertificateBanner
            showPrompt={showExternalCertPrompt}
            courseTitle={externalCourseTitle}
            variant="inline"
          />
        ) : null}

        {introVideoAdmin ? <TrainingIntroVideoAdmin {...introVideoAdmin} /> : null}
      </Box>
    </Box>
  );
}
