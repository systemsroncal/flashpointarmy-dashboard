"use client";

import type { QuizElementPayload } from "@/types/course-content";
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { EventDescriptionHtml } from "@/components/events/EventDescriptionHtml";

export function CourseQuizBlock({
  elementId,
  payload,
  existingScore,
}: {
  elementId: string;
  payload: QuizElementPayload;
  existingScore: { score: number; maxScore: number } | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(Boolean(existingScore));
  const [localScore, setLocalScore] = useState(existingScore);

  const questions = payload.questions ?? [];

  const initial = useMemo(() => {
    const m: Record<string, unknown> = {};
    for (const q of questions) {
      if (q.type === "multi") m[q.id] = [];
      else if (q.type === "tf") m[q.id] = false;
      else m[q.id] = "";
    }
    return m;
  }, [questions]);

  const [answers, setAnswers] = useState<Record<string, unknown>>(initial);

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
      setDone(true);
      router.refresh();
    } catch {
      setErr("Network error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Box sx={{ p: 2, borderRadius: 1, border: "1px solid rgba(255,215,0,0.18)", bgcolor: "rgba(0,0,0,0.35)" }}>
      <Typography fontWeight={800} sx={{ mb: 1 }}>
        Quiz
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
        Maximum points for this block: {payload.maxPoints ?? 0}
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
              row
              value={answers[q.id] === true ? "t" : answers[q.id] === false ? "f" : ""}
              onChange={(_, v) =>
                setAnswers((a) => ({ ...a, [q.id]: v === "t" ? true : v === "f" ? false : undefined }))
              }
            >
              <FormControlLabel value="t" control={<Radio />} label="True" />
              <FormControlLabel value="f" control={<Radio />} label="False" />
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
        </Box>
      ))}
      {err ? (
        <Typography color="error" sx={{ mb: 1 }}>
          {err}
        </Typography>
      ) : null}
      <Button variant="contained" onClick={() => void submit()} disabled={busy || done}>
        {busy ? "Submitting…" : "Submit answers"}
      </Button>
    </Box>
  );
}
