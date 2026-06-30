"use client";

import { CourseVideoPlyr } from "@/components/courses/CourseVideoPlyr";
import { CourseQuizBlock } from "@/components/courses/CourseQuizBlock";
import { EventDescriptionHtml } from "@/components/events/EventDescriptionHtml";
import { useDashboardUser } from "@/contexts/DashboardUserContext";
import { publicAssetSrc } from "@/lib/media/public-asset-url";
import { resolveVideoForPlyr } from "@/lib/media/resolve-plyr-video";
import {
  insertCourseCompletedFeed,
  insertCourseSessionCompletedFeed,
} from "@/lib/community/training-feed";
import { BIBLICAL_CITIZENSHIP_COURSE_SLUG } from "@/lib/courses/course-completion";
import { coachMeetingScheduleLabel } from "@/lib/onboarding/coach-meeting-labels";
import type { QuizElementPayload } from "@/types/course-content";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import {
  Alert,
  Box,
  Button,
  Divider,
  Link as MuiLink,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import {
  isTrainingDebugActiveClient,
  parseTrainingDebugQueryParam,
} from "@/lib/training/training-debug";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export type SessionElementRow = {
  id: string;
  element_type: string;
  title_html: string | null;
  description_html: string | null;
  payload: unknown;
  sort_order: number;
};

/** Keys inside `course_session_progress.video_positions` that mark a video as fully watched. */
function videoDoneStorageKey(elementId: string): string {
  return `__done__${elementId}`;
}

/** Persisted duration (seconds) for computing saved progress %. */
function videoDurationStorageKey(elementId: string): string {
  return `__dur__${elementId}`;
}

/** Minimum saved watch progress before "Mark session as completed" is offered. */
const MARK_COMPLETE_MIN_SAVED_FRACTION = 0.6;

function isVideoDoneFlag(value: unknown): boolean {
  return value === 1 || value === true;
}

/** Resume math should ignore server-side metadata mixed into `video_positions`. */
function numericVideoPositions(positions: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(positions)) {
    if (k.startsWith("__")) continue;
    const n = Number(v);
    if (Number.isFinite(n) && n >= 0) out[k] = n;
  }
  return out;
}

function readVideoDurationsFromPositions(positions: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(positions)) {
    if (!k.startsWith("__dur__")) continue;
    const id = k.slice("__dur__".length);
    const n = Number(v);
    if (Number.isFinite(n) && n > 0) out[id] = n;
  }
  return out;
}

function isVideoEligibleForMarkComplete(
  elementId: string,
  positions: Record<string, number>,
  durations: Record<string, number>,
  watchedToEndBefore: Record<string, boolean>
): boolean {
  if (watchedToEndBefore[elementId]) return true;
  const saved = numericVideoPositions(positions)[elementId] ?? 0;
  const dur = durations[elementId];
  if (!dur || dur <= 0) return false;
  return saved / dur >= MARK_COMPLETE_MIN_SAVED_FRACTION;
}

export function CourseSessionPlayer({
  courseSlug,
  courseTitle,
  sortedSessionIds,
  sessionId,
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
  trainingDebug = false,
}: {
  courseSlug: string;
  courseTitle: string;
  sortedSessionIds: string[];
  sessionId: string;
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
  /** Server hint from `?trainingDebug=1` (any role; host/env gated). */
  trainingDebug?: boolean;
}) {
  const user = useDashboardUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const trainingDebugActive = useMemo(() => {
    if (trainingDebug) return true;
    const requested = parseTrainingDebugQueryParam(searchParams.get("trainingDebug"));
    return isTrainingDebugActiveClient(requested);
  }, [trainingDebug, searchParams]);
  const isFinalBiblicalSession =
    courseSlug === BIBLICAL_CITIZENSHIP_COURSE_SLUG && !nextSlug;
  const coachMeetingAudience = user.role_names.includes("local_leader")
    ? ("local_leader" as const)
    : ("member" as const);
  const scheduleCoachLabel = coachMeetingScheduleLabel(coachMeetingAudience);
  const supabase = useMemo(() => createClient(), []);
  const [completed, setCompleted] = useState(initialCompleted);
  const [busyComplete, setBusyComplete] = useState(false);
  const [videoPositions, setVideoPositions] = useState<Record<string, number>>(initialVideoPositions);
  const videoPositionsRef = useRef(initialVideoPositions);
  videoPositionsRef.current = videoPositions;

  const mergeVideoPositionMaps = useCallback(
    (base: Record<string, number>, patch: Record<string, number>): Record<string, number> => {
      const next = { ...base };
      for (const [k, v] of Object.entries(patch)) {
        const n = Math.max(0, Number(v) || 0);
        if (k.startsWith("__done__") && n === 0) {
          delete next[k];
          continue;
        }
        next[k] = Math.max(next[k] ?? 0, n);
      }
      return next;
    },
    []
  );

  const sorted = useMemo(
    () => [...elements].sort((a, b) => a.sort_order - b.sort_order),
    [elements]
  );

  const videoElementIds = useMemo(
    () =>
      sorted
        .filter((e) => {
          if (e.element_type !== "video") return false;
          const url = String((e.payload as { url?: string } | null)?.url ?? "").trim();
          return resolveVideoForPlyr(url).kind !== "none";
        })
        .map((e) => e.id),
    [sorted]
  );

  const videoIdsKey = videoElementIds.join("\0");

  function readVideoFullyWatched(
    ids: string[],
    positions: Record<string, number> = videoPositionsRef.current
  ): Record<string, boolean> {
    const next: Record<string, boolean> = {};
    for (const id of ids) {
      try {
        if (localStorage.getItem(`coursevid-done:${user.id}:${sessionId}:${id}`) === "1") {
          next[id] = true;
          continue;
        }
      } catch {
        /* ignore */
      }
      if (isVideoDoneFlag(positions[videoDoneStorageKey(id)])) {
        next[id] = true;
      }
    }
    return next;
  }

  const [videoFullyWatchedById, setVideoFullyWatchedById] = useState(() =>
    readVideoFullyWatched(videoElementIds, initialVideoPositions)
  );
  const [videoDurationsById, setVideoDurationsById] = useState<Record<string, number>>(() =>
    readVideoDurationsFromPositions(initialVideoPositions)
  );

  useEffect(() => {
    setVideoPositions((prev) => {
      const next = mergeVideoPositionMaps(prev, initialVideoPositions);
      videoPositionsRef.current = next;
      return next;
    });
    setVideoFullyWatchedById(readVideoFullyWatched(videoElementIds, initialVideoPositions));
  }, [initialVideoPositions, mergeVideoPositionMaps, videoIdsKey, user.id, sessionId]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data, error } = await supabase
        .from("course_session_progress")
        .select("video_positions")
        .eq("user_id", user.id)
        .eq("session_id", sessionId)
        .maybeSingle();
      if (cancelled || error) return;
      const vp = data?.video_positions;
      if (typeof vp === "object" && vp && !Array.isArray(vp)) {
        const merged = vp as Record<string, number>;
        setVideoPositions((prev) => {
          const next = mergeVideoPositionMaps(prev, merged);
          videoPositionsRef.current = next;
          return next;
        });
        setVideoFullyWatchedById(readVideoFullyWatched(videoElementIds, merged));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, user.id, sessionId, mergeVideoPositionMaps, videoIdsKey]);

  useEffect(() => {
    setVideoFullyWatchedById(readVideoFullyWatched(videoElementIds));
  }, [user.id, sessionId, videoIdsKey, videoPositions]);

  useEffect(() => {
    setVideoDurationsById((prev) => ({
      ...readVideoDurationsFromPositions(videoPositions),
      ...prev,
    }));
  }, [videoPositions]);

  const markCompleteAllowed = useMemo(() => {
    if (videoElementIds.length === 0) return true;
    return videoElementIds.every((id) =>
      isVideoEligibleForMarkComplete(id, videoPositions, videoDurationsById, videoFullyWatchedById)
    );
  }, [videoElementIds, videoPositions, videoDurationsById, videoFullyWatchedById]);

  const mergePersist = useCallback(
    async (patch: { video_positions?: Record<string, number>; completed_at?: string | null }) => {
      const { data } = await supabase
        .from("course_session_progress")
        .select("video_positions, completed_at")
        .eq("user_id", user.id)
        .eq("session_id", sessionId)
        .maybeSingle();

      const serverPos =
        typeof data?.video_positions === "object" && data?.video_positions && !Array.isArray(data.video_positions)
          ? (data.video_positions as Record<string, number>)
          : {};

      const nextPos = mergeVideoPositionMaps(
        mergeVideoPositionMaps(serverPos, videoPositionsRef.current),
        patch.video_positions ?? {}
      );

      const completedAt =
        patch.completed_at !== undefined ? patch.completed_at : (data?.completed_at as string | null) ?? null;

      const { error } = await supabase.from("course_session_progress").upsert(
        {
          user_id: user.id,
          session_id: sessionId,
          video_positions: nextPos,
          completed_at: completedAt,
        },
        { onConflict: "user_id,session_id" }
      );
      if (error && process.env.NODE_ENV === "development") {
        console.warn("[CourseSessionPlayer] Could not save progress:", error.message);
      }
      return { error: error?.message ?? null, nextPos };
    },
    [supabase, user.id, sessionId, mergeVideoPositionMaps]
  );

  const onVideoProgress = useCallback(
    (elementId: string, _current: number, duration: number) => {
      if (duration <= 0) return;
      setVideoDurationsById((prev) => {
        if (prev[elementId] === duration) return prev;
        return { ...prev, [elementId]: duration };
      });
      const durKey = videoDurationStorageKey(elementId);
      const stored = Number(videoPositionsRef.current[durKey] ?? 0);
      if (Math.abs(stored - duration) <= 1) return;
      setVideoPositions((prev) => {
        const next = mergeVideoPositionMaps(prev, { [durKey]: duration });
        videoPositionsRef.current = next;
        return next;
      });
      void mergePersist({ video_positions: { [durKey]: duration } });
    },
    [mergePersist, mergeVideoPositionMaps]
  );

  const onVideoSeconds = useCallback(
    (elementId: string, sec: number) => {
      const n = Math.max(0, sec);
      setVideoPositions((prev) => {
        const next = mergeVideoPositionMaps(prev, { [elementId]: n });
        videoPositionsRef.current = next;
        return next;
      });
      void mergePersist({ video_positions: { [elementId]: n } });
    },
    [mergePersist, mergeVideoPositionMaps]
  );

  async function markComplete() {
    if (videoElementIds.length > 0 && !markCompleteAllowed) return;
    setBusyComplete(true);
    try {
      const completedAt = new Date().toISOString();
      await mergePersist({ completed_at: completedAt });
      setCompleted(true);
      try {
        await insertCourseSessionCompletedFeed({
          supabase,
          userId: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          sessionTitle,
          courseTitle,
        });

        const { data: progRows } = await supabase
          .from("course_session_progress")
          .select("session_id, completed_at")
          .eq("user_id", user.id)
          .in("session_id", sortedSessionIds.length ? sortedSessionIds : [sessionId]);

        const done = new Set<string>();
        for (const row of progRows ?? []) {
          if (row.completed_at) done.add(row.session_id as string);
        }
        done.add(sessionId);
        const allSessions = sortedSessionIds.length > 0 ? sortedSessionIds : [sessionId];
        const allDone = allSessions.length > 0 && allSessions.every((id) => done.has(id));
        if (allDone) {
          await insertCourseCompletedFeed({
            supabase,
            userId: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            courseTitle,
          });
          if (courseSlug === BIBLICAL_CITIZENSHIP_COURSE_SLUG) {
            try {
              await fetch("/api/onboarding/coach-meetings/unlock", { method: "POST" });
            } catch {
              /* best-effort */
            }
          }
        }
      } catch {
        /* feed is best-effort */
      }
      router.refresh();
    } finally {
      setBusyComplete(false);
    }
  }

  const onVideoFullyWatched = useCallback(
    (elementId: string) => {
      try {
        localStorage.setItem(`coursevid-done:${user.id}:${sessionId}:${elementId}`, "1");
      } catch {
        /* ignore */
      }
      const donePatch = { [videoDoneStorageKey(elementId)]: 1 };
      setVideoPositions((prev) => {
        const next = { ...prev, ...donePatch };
        videoPositionsRef.current = next;
        return next;
      });
      void mergePersist({ video_positions: donePatch });
      setVideoFullyWatchedById((prev) => ({ ...prev, [elementId]: true }));
    },
    [user.id, sessionId, videoElementIds, mergePersist]
  );

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

      {trainingDebugActive ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          Training debug mode is on. Remove{" "}
          <Typography component="span" variant="body2" sx={{ fontFamily: "monospace" }}>
            ?trainingDebug=1
          </Typography>{" "}
          from the URL when you are done testing.
        </Alert>
      ) : null}

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
              (() => {
                const videoUrl = String((el.payload as { url?: string } | null)?.url ?? "").trim();
                if (resolveVideoForPlyr(videoUrl).kind === "none") return null;
                const numericPositions = numericVideoPositions(videoPositions);
                const savedSec = numericPositions[el.id] ?? 0;
                return (
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
                  videoUrl={videoUrl}
                  initialSeconds={savedSec}
                  storageKey={`coursevid:${user.id}:${el.id}`}
                  onPersistSeconds={(sec) => onVideoSeconds(el.id, sec)}
                  onProgress={(curr, dur) => onVideoProgress(el.id, curr, dur)}
                  suppressResumePrompt={Boolean(videoFullyWatchedById[el.id])}
                  onVideoFullyWatched={() => onVideoFullyWatched(el.id)}
                />
              </Box>
                );
              })()
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
                locked={!completed}
                lockMessage={
                  nextSlug
                    ? "Complete this session (watch all videos and mark as completed) to unlock the quiz."
                    : "Complete this session to finish the course and unlock the quiz."
                }
              />
            ) : null}
          </Paper>
        ))}
      </Stack>

      <Divider sx={{ my: 3, borderColor: "rgba(255,215,0,0.15)" }} />

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        alignItems={{ xs: "stretch", sm: "flex-start" }}
        justifyContent="space-between"
        sx={{ mb: 2, pt: { xs: 1, sm: 0.5 } }}
      >
        <Button
          component={prevSlug ? Link : "button"}
          href={prevSlug ? `/dashboard/course/${courseSlug}/session/${prevSlug}` : undefined}
          disabled={!prevSlug}
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          sx={{ minHeight: 48, alignSelf: { sm: "flex-start" }, touchAction: "manipulation" }}
        >
          Previous
        </Button>
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            minHeight: 40,
            px: 1,
          }}
        >
          {isFinalBiblicalSession ? (
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              alignItems="stretch"
              justifyContent="center"
              sx={{ width: "100%", maxWidth: 560 }}
            >
              {completed ? (
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<CheckCircleOutlineIcon />}
                  disabled
                  sx={{ minHeight: 48 }}
                >
                  Session completed
                </Button>
              ) : !markCompleteAllowed && videoElementIds.length > 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", maxWidth: 360, py: 1 }}>
                  Watch at least 60% of each video (your saved position counts when you return). If you have
                  already finished a video before, you can mark the session complete at any time.
                </Typography>
              ) : (
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<CheckCircleOutlineIcon />}
                  disabled={busyComplete}
                  onClick={() => void markComplete()}
                  sx={{ minHeight: 48, touchAction: "manipulation" }}
                >
                  Mark session as completed
                </Button>
              )}
              <Button
                component={completed ? Link : "button"}
                href={completed ? "/dashboard/training/coach-meeting" : undefined}
                variant="contained"
                color="primary"
                disabled={!completed}
                startIcon={<CalendarMonthIcon />}
                sx={{ minHeight: 48, fontWeight: 700, touchAction: "manipulation", whiteSpace: "nowrap" }}
              >
                {scheduleCoachLabel}
              </Button>
            </Stack>
          ) : completed ? (
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircleOutlineIcon />}
              disabled
            >
              Session completed
            </Button>
          ) : !markCompleteAllowed && videoElementIds.length > 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", maxWidth: 360 }}>
              Watch at least 60% of each video (your saved position counts when you return). If you have already
              finished a video before, you can mark the session complete at any time.
            </Typography>
          ) : (
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircleOutlineIcon />}
              disabled={busyComplete}
              onClick={() => void markComplete()}
            >
              Mark session as completed
            </Button>
          )}
        </Box>
        <Button
          component={nextSlug && !nextLocked ? Link : "button"}
          href={
            nextSlug && !nextLocked ? `/dashboard/course/${courseSlug}/session/${nextSlug}` : undefined
          }
          disabled={!nextSlug || nextLocked}
          variant="outlined"
          endIcon={<ArrowForwardIcon />}
          sx={{ minHeight: 48, alignSelf: { sm: "flex-start" }, touchAction: "manipulation" }}
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
