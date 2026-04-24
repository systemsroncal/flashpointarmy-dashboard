"use client";

import { CourseVideoPlyr } from "@/components/courses/CourseVideoPlyr";
import { CourseQuizBlock } from "@/components/courses/CourseQuizBlock";
import { EventDescriptionHtml } from "@/components/events/EventDescriptionHtml";
import { useDashboardUser } from "@/contexts/DashboardUserContext";
import { publicAssetSrc } from "@/lib/media/public-asset-url";
import type { QuizElementPayload } from "@/types/course-content";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import {
  Box,
  Button,
  Divider,
  Link as MuiLink,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export type SessionElementRow = {
  id: string;
  element_type: string;
  title_html: string | null;
  description_html: string | null;
  payload: unknown;
  sort_order: number;
};

export function CourseSessionPlayer({
  courseSlug,
  sessionId,
  sessionSlug,
  sessionTitle,
  sessionSubtitle,
  coverImageUrl,
  elements,
  prevSlug,
  nextSlug,
  nextLocked,
  initialCompleted,
  initialVideoPositions,
  quizScores,
}: {
  courseSlug: string;
  sessionId: string;
  sessionSlug: string;
  sessionTitle: string;
  sessionSubtitle: string | null;
  coverImageUrl: string | null;
  elements: SessionElementRow[];
  prevSlug: string | null;
  nextSlug: string | null;
  nextLocked: boolean;
  initialCompleted: boolean;
  initialVideoPositions: Record<string, number>;
  quizScores: Record<string, { score: number; maxScore: number }>;
}) {
  const user = useDashboardUser();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [completed, setCompleted] = useState(initialCompleted);
  const [busyComplete, setBusyComplete] = useState(false);

  const mergePersist = useCallback(
    async (patch: { video_positions?: Record<string, number>; completed_at?: string | null }) => {
      const { data } = await supabase
        .from("course_session_progress")
        .select("video_positions, completed_at")
        .eq("user_id", user.id)
        .eq("session_id", sessionId)
        .maybeSingle();

      const prevPos =
        (typeof data?.video_positions === "object" && data?.video_positions && !Array.isArray(data.video_positions)
          ? (data.video_positions as Record<string, number>)
          : {}) ?? {};

      const nextPos = { ...prevPos, ...(patch.video_positions ?? {}) };

      const completedAt =
        patch.completed_at !== undefined ? patch.completed_at : (data?.completed_at as string | null) ?? null;

      await supabase.from("course_session_progress").upsert(
        {
          user_id: user.id,
          session_id: sessionId,
          video_positions: nextPos,
          completed_at: completedAt,
        },
        { onConflict: "user_id,session_id" }
      );
    },
    [supabase, user.id, sessionId]
  );

  const onVideoSeconds = useCallback(
    (elementId: string, sec: number) => {
      void mergePersist({ video_positions: { [elementId]: sec } });
    },
    [mergePersist]
  );

  async function markComplete() {
    setBusyComplete(true);
    try {
      await mergePersist({ completed_at: new Date().toISOString() });
      setCompleted(true);
      router.refresh();
    } finally {
      setBusyComplete(false);
    }
  }

  const sorted = [...elements].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <Box>
      <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 2, bgcolor: "rgba(0,0,0,0.45)" }}>
        <MuiLink
          component={Link}
          href={`/dashboard/course/${courseSlug}`}
          color="primary"
          sx={{ fontWeight: 600, display: "inline-block", mb: 1 }}
        >
          ← Back to course
        </MuiLink>
        {coverImageUrl ? (
          <Box
            component="img"
            src={publicAssetSrc(coverImageUrl)}
            alt=""
            sx={{ width: "100%", maxHeight: 280, objectFit: "cover", borderRadius: 1, mb: 2 }}
          />
        ) : null}
        <Typography variant="h5" sx={{ fontWeight: 800, color: "primary.main", mb: 0.5 }}>
          {sessionTitle}
        </Typography>
        {sessionSubtitle ? (
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            {sessionSubtitle}
          </Typography>
        ) : null}
      </Paper>

      <Stack spacing={2} sx={{ mb: 3 }}>
        {sorted.map((el) => (
          <Paper key={el.id} sx={{ p: 2, bgcolor: "rgba(0,0,0,0.38)" }}>
            {el.title_html?.trim() ? (
              <Box sx={{ mb: 1 }}>
                <EventDescriptionHtml
                  html={el.title_html}
                  sx={{ typography: "subtitle1", fontWeight: 800, "& p": { m: 0 } }}
                />
              </Box>
            ) : null}
            {el.description_html ? (
              <Box sx={{ mb: el.element_type === "plain_text" || el.element_type === "rich_text" ? 0 : 1.5 }}>
                <EventDescriptionHtml html={el.description_html} />
              </Box>
            ) : null}

            {el.element_type === "plain_text" ? (
              <Typography sx={{ whiteSpace: "pre-wrap" }}>
                {String((el.payload as { text?: string } | null)?.text ?? "")}
              </Typography>
            ) : null}

            {el.element_type === "rich_text" ? (
              <EventDescriptionHtml html={(el.payload as { html?: string } | null)?.html ?? ""} />
            ) : null}

            {el.element_type === "video" ? (
              <Box
                sx={{
                  width: 1,
                  maxWidth: "100%",
                  overflow: "hidden",
                  borderRadius: 1,
                  /* Clear separation from session actions (Plyr controls sit at bottom edge) */
                  mb: 0.5,
                }}
              >
                <CourseVideoPlyr
                  videoUrl={String((el.payload as { url?: string } | null)?.url ?? "").trim()}
                  initialSeconds={initialVideoPositions[el.id] ?? 0}
                  storageKey={`coursevid:${user.id}:${el.id}`}
                  onPersistSeconds={(sec) => onVideoSeconds(el.id, sec)}
                />
              </Box>
            ) : null}

            {el.element_type === "pdf" ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <PictureAsPdfIcon color="primary" />
                <MuiLink
                  href={publicAssetSrc(String((el.payload as { url?: string } | null)?.url ?? ""))}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {(el.payload as { fileName?: string } | null)?.fileName || "View or download PDF"}
                </MuiLink>
              </Box>
            ) : null}

            {el.element_type === "image" ? (
              <Box>
                {(el.payload as { url?: string } | null)?.url ? (
                  <Box
                    component="img"
                    src={publicAssetSrc(String((el.payload as { url?: string }).url))}
                    alt=""
                    sx={{ maxWidth: "100%", borderRadius: 1, mb: 1 }}
                  />
                ) : null}
              </Box>
            ) : null}

            {el.element_type === "quiz" ? (
              <CourseQuizBlock
                elementId={el.id}
                payload={el.payload as QuizElementPayload}
                existingScore={quizScores[el.id] ?? null}
              />
            ) : null}
          </Paper>
        ))}
      </Stack>

      <Divider sx={{ my: 3, borderColor: "rgba(255,215,0,0.15)" }} />

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        alignItems="stretch"
        justifyContent="space-between"
        sx={{ mb: 2, pt: { xs: 1, sm: 0.5 } }}
      >
        <Button
          component={Link}
          href={prevSlug ? `/dashboard/course/${courseSlug}/session/${prevSlug}` : "#"}
          disabled={!prevSlug}
          variant="outlined"
          startIcon={<ArrowBackIcon />}
        >
          Previous
        </Button>
        <Button
          variant="contained"
          color="success"
          startIcon={<CheckCircleOutlineIcon />}
          disabled={completed || busyComplete}
          onClick={() => void markComplete()}
        >
          {completed ? "Session completed" : "Mark session as completed"}
        </Button>
        <Button
          component={Link}
          href={nextSlug && !nextLocked ? `/dashboard/course/${courseSlug}/session/${nextSlug}` : "#"}
          disabled={!nextSlug || nextLocked}
          variant="outlined"
          endIcon={<ArrowForwardIcon />}
        >
          Next
        </Button>
      </Stack>
      {nextLocked && nextSlug ? (
        <Typography variant="caption" color="warning.main">
          Complete this session to unlock the next one.
        </Typography>
      ) : null}
    </Box>
  );
}
