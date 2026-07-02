"use client";

import { CourseVideoPlyr } from "@/components/courses/CourseVideoPlyr";
import {
  isVideoEligibleForMarkComplete,
  MARK_COMPLETE_MIN_SAVED_FRACTION,
} from "@/lib/onboarding/video-progress-threshold";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { Alert, Box, Button, Dialog, DialogContent, Stack, Typography } from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const REDIRECT_DELAY_MS = 4000;
const MISSIONS_HREF = "/dashboard/missions";

type Props = {
  videoUrl: string;
  initialPositionSeconds: number;
  initialDurationSeconds: number | null;
  briefingCompleted: boolean;
};

export function MissionBriefingPlayer({
  videoUrl,
  initialPositionSeconds,
  initialDurationSeconds,
  briefingCompleted,
}: Props) {
  const router = useRouter();
  const [position, setPosition] = useState(initialPositionSeconds);
  const [duration, setDuration] = useState<number | null>(initialDurationSeconds);
  const durationRef = useRef(initialDurationSeconds);
  const [completed, setCompleted] = useState(briefingCompleted);
  const [busyMark, setBusyMark] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [thanksOpen, setThanksOpen] = useState(false);
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedRef = useRef(false);
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persistProgress = useCallback(async (pos: number, dur: number | null) => {
    try {
      await fetch("/api/onboarding/mission-briefing/progress", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          video_position_seconds: pos,
          video_duration_seconds: dur,
        }),
      });
    } catch {
      /* best-effort */
    }
  }, []);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void fetch("/api/onboarding/mission-briefing/start", { method: "POST" });
  }, []);

  const markCompleteAllowed =
    completed ||
    isVideoEligibleForMarkComplete(position, duration, false) ||
    isVideoEligibleForMarkComplete(
      initialPositionSeconds,
      initialDurationSeconds,
      false
    );

  const chooseMissionEnabled = completed;

  async function markComplete() {
    setErr(null);
    setBusyMark(true);
    try {
      const res = await fetch("/api/onboarding/mission-briefing/complete", { method: "POST" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setErr(data.error || "Could not mark briefing complete.");
        return;
      }
      setCompleted(true);
      setThanksOpen(true);
      redirectTimerRef.current = setTimeout(() => {
        router.push(MISSIONS_HREF);
      }, REDIRECT_DELAY_MS);
      router.refresh();
    } finally {
      setBusyMark(false);
    }
  }

  function schedulePersist(pos: number) {
    if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    persistTimerRef.current = setTimeout(() => {
      void persistProgress(pos, durationRef.current);
    }, 800);
  }

  return (
    <Box>
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
        <CourseVideoPlyr
          videoUrl={videoUrl}
          initialSeconds={initialPositionSeconds}
          showProgressHint={false}
          fillContainer
          onProgress={(currentSeconds, durationSeconds) => {
            setPosition(currentSeconds);
            if (durationSeconds > 0) {
              setDuration(durationSeconds);
              durationRef.current = durationSeconds;
            }
          }}
          onPersistSeconds={(seconds) => {
            setPosition(seconds);
            schedulePersist(seconds);
          }}
        />
      </Box>

      {!completed && !markCompleteAllowed ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.65 }}>
          Watch at least {Math.round(MARK_COMPLETE_MIN_SAVED_FRACTION * 100)}% of the briefing (your saved
          position counts when you return). Progress is saved automatically.
        </Typography>
      ) : null}

      {err ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {err}
        </Alert>
      ) : null}

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mb: 2 }}>
        <Button
          variant="contained"
          color="success"
          startIcon={<CheckCircleOutlineIcon />}
          disabled={completed || !markCompleteAllowed || busyMark}
          onClick={() => void markComplete()}
          sx={{ minHeight: 48, fontWeight: 700 }}
        >
          {completed ? "Briefing completed" : busyMark ? "Saving…" : "Mark as completed"}
        </Button>
        <Button
          component={chooseMissionEnabled ? Link : "button"}
          href={chooseMissionEnabled ? MISSIONS_HREF : undefined}
          variant="contained"
          disabled={!chooseMissionEnabled}
          sx={{
            minHeight: 48,
            fontWeight: 800,
            fontSize: { xs: "0.95rem", sm: "1rem" },
            "@media (min-width: 1101px)": {
              fontSize: "1.5rem",
              py: 1.5,
              minHeight: 52,
            },
            color: "#0a0a0a",
            bgcolor: "primary.main",
            "&:hover": { bgcolor: "primary.light" },
            "&.Mui-disabled": {
              bgcolor: "rgba(255,215,0,0.22)",
              color: "rgba(10,10,10,0.45)",
            },
          }}
        >
          Choose Your First Mission
        </Button>
      </Stack>

      <Dialog open={thanksOpen} maxWidth="sm" fullWidth>
        <DialogContent sx={{ py: 3 }}>
          <Box sx={{ textAlign: "center" }}>
            <CheckCircleOutlineIcon sx={{ fontSize: 48, color: "success.main", mb: 1.5 }} />
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5 }}>
              Thank you!
            </Typography>
            <Typography color="text.secondary" sx={{ lineHeight: 1.7, mb: 2 }}>
              You have completed your Mission Briefing. You will now be redirected to choose your first
              mission.
            </Typography>
            <Button component={Link} href={MISSIONS_HREF} variant="contained" sx={{ fontWeight: 700 }}>
              Choose Your First Mission
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
