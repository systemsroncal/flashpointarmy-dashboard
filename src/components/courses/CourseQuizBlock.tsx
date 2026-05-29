"use client";

import type { QuizElementPayload } from "@/types/course-content";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import { EventDescriptionHtml } from "@/components/events/EventDescriptionHtml";

export function CourseQuizBlock({
  elementId,
  payload,
  existingScore,
  locked = false,
  lockMessage = "Complete this session to unlock the quiz.",
}: {
  elementId: string;
  payload: QuizElementPayload;
  existingScore: { score: number; maxScore: number } | null;
  locked?: boolean;
  lockMessage?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [localScore, setLocalScore] = useState(existingScore);

  const questions = payload.questions ?? [];

  const weightSum = useMemo(
    () =>
      (payload.questions ?? []).reduce(
        (s, q) => s + (Number.isFinite(q.points) ? Math.max(0, q.points) : 0),
        0
      ),
    [payload]
  );

  const displayMaxScore = useMemo(() => {
    const raw = payload.maxPoints;
    if (raw != null && Number.isFinite(Number(raw)) && Number(raw) > 0) return Number(raw);
    return weightSum;
  }, [payload.maxPoints, weightSum]);

  const initial = useMemo(() => {
    const m: Record<string, unknown> = {};
    for (const q of payload.questions ?? []) {
      if (q.type === "multi") m[q.id] = [];
      else if (q.type === "single" || q.type === "text") m[q.id] = "";
    }
    return m;
  }, [payload]);

  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  useEffect(() => {
    setAnswers(initial);
  }, [initial]);

  if (localScore) {
    return (
      <Box sx={{ p: 2, borderRadius: 1, border: "1px solid rgba(255,215,0,0.2)", bgcolor: "rgba(0,0,0,0.35)" }}>
        <Typography fontWeight={700} sx={{ mb: 0.5 }}>
          Quiz completed
        </Typography>
        <Typography color="text.secondary">
          Score: <strong>{localScore.score}</strong> / {localScore.maxScore}
        </Typography>
      </Box>
    );
  }

  if (locked) {
    return (
      <Box sx={{ p: 2, borderRadius: 1, border: "1px solid rgba(255,215,0,0.18)", bgcolor: "rgba(0,0,0,0.35)" }}>
        <Typography fontWeight={800} sx={{ mb: 1, display: "flex", alignItems: "center", gap: 0.75 }}>
          <LockOutlinedIcon fontSize="small" />
          Quiz locked
        </Typography>
        <Alert severity="info" sx={{ bgcolor: "rgba(0,0,0,0.25)" }}>
          {lockMessage}
        </Alert>
      </Box>
    );
  }

  async function submit() {
    setErr(null);
    setBusy(true);
    try {
      const res = await fetch("/api/courses/quiz-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ elementId, answers }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string; score?: number; maxScore?: number };
      if (!res.ok || !json.ok) {
        setErr(json.error || "Could not submit the quiz.");
        return;
      }
      setLocalScore({ score: json.score ?? 0, maxScore: json.maxScore ?? 0 });
      router.refresh();
    } catch {
      setErr("Network error.");
    } finally {
      setBusy(false);
    }
  }

  function tfLabel(html: string | undefined, fb: string) {
    const h = (html ?? "").trim();
    return h || `<span>${fb}</span>`;
  }

  return (
    <Box sx={{ p: 2, borderRadius: 1, border: "1px solid rgba(255,215,0,0.18)", bgcolor: "rgba(0,0,0,0.35)" }}>
      <Typography fontWeight={800} sx={{ mb: 1 }}>
        Quiz
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
        Maximum points for this block: {displayMaxScore}
        {weightSum > 0 && payload.maxPoints != null && Number.isFinite(Number(payload.maxPoints)) && Number(payload.maxPoints) > 0
          ? ` (question weights sum: ${weightSum})`
          : null}
      </Typography>
      {questions.map((q) => (
        <Box key={q.id} sx={{ mb: 2.5 }}>
          <Box sx={{ mb: 1 }}>
            <EventDescriptionHtml html={q.promptHtml} sx={{ "& p": { m: 0 } }} />
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
              ({q.points} pts)
            </Typography>
          </Box>
          {q.type === "tf" ? (
            <RadioGroup
              row={false}
              value={answers[q.id] === true ? "t" : answers[q.id] === false ? "f" : ""}
              onChange={(_, v) =>
                setAnswers((a) => ({
                  ...a,
                  [q.id]: v === "t" ? true : v === "f" ? false : undefined,
                }))
              }
            >
              <FormControlLabel
                value="t"
                control={<Radio />}
                label={<EventDescriptionHtml html={tfLabel(q.trueLabelHtml, "Verdadero")} sx={{ "& p": { m: 0 } }} />}
              />
              <FormControlLabel
                value="f"
                control={<Radio />}
                label={<EventDescriptionHtml html={tfLabel(q.falseLabelHtml, "Falso")} sx={{ "& p": { m: 0 } }} />}
              />
            </RadioGroup>
          ) : null}
          {q.type === "single" ? (
            <RadioGroup
              value={String(answers[q.id] ?? "")}
              onChange={(_, v) => setAnswers((a) => ({ ...a, [q.id]: v }))}
            >
              {(q.options ?? []).map((o) => (
                <FormControlLabel
                  key={o.id}
                  value={o.id}
                  control={<Radio />}
                  label={<EventDescriptionHtml html={o.labelHtml} sx={{ "& p": { m: 0 } }} />}
                />
              ))}
            </RadioGroup>
          ) : null}
          {q.type === "multi" ? (
            <FormControl component="fieldset" variant="standard">
              {(q.options ?? []).map((o) => {
                const picked = new Set((answers[q.id] as string[] | undefined) ?? []);
                return (
                  <FormControlLabel
                    key={o.id}
                    control={
                      <Checkbox
                        checked={picked.has(o.id)}
                        onChange={() => {
                          setAnswers((prev) => {
                            const cur = new Set((prev[q.id] as string[] | undefined) ?? []);
                            if (cur.has(o.id)) cur.delete(o.id);
                            else cur.add(o.id);
                            return { ...prev, [q.id]: [...cur] };
                          });
                        }}
                      />
                    }
                    label={<EventDescriptionHtml html={o.labelHtml} sx={{ "& p": { m: 0 } }} />}
                  />
                );
              })}
            </FormControl>
          ) : null}
          {q.type === "text" ? (
            <TextField
              fullWidth
              size="small"
              label="Your answer"
              value={String(answers[q.id] ?? "")}
              onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
            />
          ) : null}
        </Box>
      ))}
      {err ? (
        <Typography color="error" sx={{ mb: 1 }}>
          {err}
        </Typography>
      ) : null}
      <Button variant="contained" onClick={() => void submit()} disabled={busy || Boolean(localScore)}>
        {busy ? "Submitting…" : "Submit answers"}
      </Button>
    </Box>
  );
}
