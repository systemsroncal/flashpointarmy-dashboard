"use client";

import { GatheringDescriptionEditor } from "@/components/dashboard/gatherings/GatheringDescriptionEditor";
import type { QuizElementPayload, QuizQuestion } from "@/types/course-content";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import {
  Alert,
  Box,
  Button,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useMemo } from "react";


export function coerceQuizPayload(raw: unknown): QuizElementPayload {
  const base: QuizElementPayload = { maxPoints: null, questions: [] };
  if (!raw || typeof raw !== "object") return base;
  const o = raw as Record<string, unknown>;

  let maxPoints: number | null = null;
  if (o.maxPoints !== undefined && o.maxPoints !== null && String(o.maxPoints).trim() !== "") {
    const n = Number(o.maxPoints);
    if (Number.isFinite(n) && n >= 0) maxPoints = n;
  }

  const questionsRaw = Array.isArray(o.questions) ? o.questions : [];
  const questions: QuizQuestion[] = questionsRaw.map((q, i) => normalizeQuestion(q, i));

  return { maxPoints, questions };
}

function normalizeQuestion(q: unknown, i: number): QuizQuestion {
  const id =
    typeof q === "object" && q !== null && "id" in q && typeof (q as { id: unknown }).id === "string"
      ? (q as { id: string }).id
      : `q_${i + 1}_${Math.random().toString(36).slice(2, 9)}`;
  if (!q || typeof q !== "object") {
    return {
      id,
      type: "tf",
      promptHtml: "<p></p>",
      points: 1,
      correctTrue: true,
      trueLabelHtml: "<span>Verdadero</span>",
      falseLabelHtml: "<span>Falso</span>",
    };
  }
  const r = q as Record<string, unknown>;
  const typeRaw = typeof r.type === "string" ? r.type : "tf";
  const type: QuizQuestion["type"] =
    typeRaw === "single" || typeRaw === "multi" || typeRaw === "text" ? typeRaw : "tf";
  const points = Number.isFinite(Number(r.points)) ? Math.max(0, Number(r.points)) : 1;

  const base: QuizQuestion = {
    id,
    type,
    promptHtml: typeof r.promptHtml === "string" ? r.promptHtml : "<p></p>",
    points,
  };

  if (type === "tf") {
    return {
      ...base,
      correctTrue:
        typeof r.correctTrue === "boolean"
          ? r.correctTrue
          : typeof r.correct_true === "boolean"
            ? r.correct_true
            : true,
      trueLabelHtml:
        typeof r.trueLabelHtml === "string"
          ? r.trueLabelHtml
          : typeof r.true_label_html === "string"
            ? r.true_label_html
            : "<span>Verdadero</span>",
      falseLabelHtml:
        typeof r.falseLabelHtml === "string"
          ? r.falseLabelHtml
          : typeof r.false_label_html === "string"
            ? r.false_label_html
            : "<span>Falso</span>",
    };
  }
  if (type === "single" || type === "multi") {
    const optsRaw = Array.isArray(r.options) ? r.options : [];
    const options = optsRaw.length
      ? optsRaw.map((o, j) => {
          if (!o || typeof o !== "object") {
            return { id: `o${j}`, labelHtml: "<span></span>", correct: j === 0 };
          }
          const x = o as Record<string, unknown>;
          return {
            id: typeof x.id === "string" ? x.id : `o${j}_${id}`,
            labelHtml: typeof x.labelHtml === "string" ? x.labelHtml : "<span></span>",
            correct: x.correct === true,
          };
        })
      : [
          { id: `o1_${id}`, labelHtml: "<span>Opción A</span>", correct: true },
          { id: `o2_${id}`, labelHtml: "<span>Opción B</span>", correct: false },
        ];
    return { ...base, options };
  }
  const accRaw = r.acceptableAnswers;
  let acceptableAnswers: string[] | undefined;
  if (Array.isArray(accRaw))
    acceptableAnswers = accRaw.map((x) => String(x).trim()).filter(Boolean);
  else if (typeof r.acceptableAnswersText === "string") {
    acceptableAnswers = r.acceptableAnswersText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
  }
  return { ...base, type: "text", acceptableAnswers: acceptableAnswers ?? [""] };
}

function newQuestion(type: QuizQuestion["type"], idx: number): QuizQuestion {
  const id = `q_${Date.now()}_${idx}`;
  if (type === "tf") {
    return {
      id,
      type: "tf",
      promptHtml: "<p></p>",
      points: 1,
      correctTrue: true,
      trueLabelHtml: "<span>Verdadero</span>",
      falseLabelHtml: "<span>Falso</span>",
    };
  }
  if (type === "single") {
    return {
      id,
      type: "single",
      promptHtml: "<p></p>",
      points: 1,
      options: [
        { id: `a_${id}`, labelHtml: "<span>Opción 1</span>", correct: true },
        { id: `b_${id}`, labelHtml: "<span>Opción 2</span>", correct: false },
      ],
    };
  }
  if (type === "multi") {
    return {
      id,
      type: "multi",
      promptHtml: "<p></p>",
      points: 1,
      options: [
        { id: `a_${id}`, labelHtml: "<span>Opción A (correcta)</span>", correct: true },
        { id: `b_${id}`, labelHtml: "<span>Opción B</span>", correct: false },
      ],
    };
  }
  return {
    id,
    type: "text",
    promptHtml: "<p></p>",
    points: 1,
    acceptableAnswers: [""],
  };
}

export function CourseQuizFormEditor({
  payload: rawPayload,
  onPayloadChange,
}: {
  payload: unknown;
  onPayloadChange: (next: QuizElementPayload) => void;
}) {
  const payload = useMemo(() => coerceQuizPayload(rawPayload), [rawPayload]);
  const questions = useMemo(() => payload.questions ?? [], [payload]);

  const sumPoints = useMemo(
    () => questions.reduce((s, q) => s + (Number.isFinite(q.points) ? Math.max(0, q.points) : 0), 0),
    [questions]
  );

  const explicitMax = payload.maxPoints;
  const maxWarning =
    explicitMax != null &&
    Number.isFinite(explicitMax) &&
    explicitMax > 0 &&
    Math.abs(explicitMax - sumPoints) > 0.0001
      ? `La suma de puntos por pregunta (${sumPoints}) no coincide con el puntaje máximo (${explicitMax}). El cálculo del alumno escalará proporcionalmente.`
      : null;

  function patch(next: QuizElementPayload) {
    onPayloadChange(next);
  }

  function setMaxPointsStr(v: string) {
    const t = v.trim();
    if (t === "") {
      patch({ ...payload, maxPoints: null });
      return;
    }
    const n = Number(t);
    if (Number.isFinite(n) && n >= 0) patch({ ...payload, maxPoints: n });
  }

  function updateQuestion(i: number, q: QuizQuestion) {
    const nextQs = questions.map((x, j) => (j === i ? q : x));
    patch({ ...payload, questions: nextQs });
  }

  function removeQuestion(i: number) {
    patch({ ...payload, questions: questions.filter((_, j) => j !== i) });
  }

  function addQuestion(type: QuizQuestion["type"]) {
    patch({ ...payload, questions: [...questions, newQuestion(type, questions.length)] });
  }

  return (
    <Box sx={{ mt: 1 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
        Puntuación máxima del cuestionario
      </Typography>
      <TextField
        size="small"
        placeholder="Vacío = suma automática de preguntas"
        value={explicitMax == null ? "" : String(explicitMax)}
        onChange={(e) => setMaxPointsStr(e.target.value)}
        fullWidth
        sx={{ mb: 1, maxWidth: 280 }}
        helperText={
          explicitMax == null || !Number.isFinite(explicitMax)
            ? `Sin tope fijo: la nota máxima será la suma de los puntos por pregunta (${sumPoints}).`
            : undefined
        }
      />
      {maxWarning ? (
        <Alert severity="warning" sx={{ mb: 1.5, py: 0.5 }}>
          {maxWarning}
        </Alert>
      ) : null}

      <Stack spacing={2}>
        {questions.map((q, i) => (
          <Box
            key={q.id}
            sx={{
              p: 1.5,
              borderRadius: 1,
              border: "1px solid rgba(255,215,0,0.15)",
              bgcolor: "rgba(0,0,0,0.25)",
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
              <Typography variant="subtitle2" fontWeight={700} color="primary">
                Pregunta {i + 1}
              </Typography>
              <IconButton size="small" aria-label="Eliminar esta pregunta" onClick={() => removeQuestion(i)}>
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Box>

            <FormControl fullWidth size="small" sx={{ mb: 1 }}>
              <InputLabel>Tipo</InputLabel>
              <Select
                label="Tipo"
                value={q.type}
                onChange={(e) => {
                  const t = e.target.value as QuizQuestion["type"];
                  updateQuestion(i, newQuestion(t, i));
                }}
              >
                <MenuItem value="tf">Verdadero / falso</MenuItem>
                <MenuItem value="single">Opción única</MenuItem>
                <MenuItem value="multi">Opción múltiple</MenuItem>
                <MenuItem value="text">Respuesta de texto</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Puntos"
              size="small"
              type="number"
              inputProps={{ min: 0, step: 0.25 }}
              value={q.points}
              onChange={(e) =>
                updateQuestion(i, {
                  ...q,
                  points: Math.max(0, Number(e.target.value) || 0),
                })
              }
              sx={{ mb: 1, maxWidth: 140 }}
            />

            <GatheringDescriptionEditor
              compact
              showHelper={false}
              label="Enunciado"
              value={q.promptHtml}
              onChange={(html) => updateQuestion(i, { ...q, promptHtml: html })}
            />

            {q.type === "tf" ? (
              <Stack spacing={1} sx={{ mt: 0 }}>
                <GatheringDescriptionEditor
                  compact
                  showHelper={false}
                  label='Texto del botón «Verdadero»'
                  value={(q.trueLabelHtml as string | undefined) ?? "<span>Verdadero</span>"}
                  onChange={(html) => updateQuestion(i, { ...q, trueLabelHtml: html })}
                />
                <GatheringDescriptionEditor
                  compact
                  showHelper={false}
                  label='Texto del botón «Falso»'
                  value={(q.falseLabelHtml as string | undefined) ?? "<span>Falso</span>"}
                  onChange={(html) => updateQuestion(i, { ...q, falseLabelHtml: html })}
                />
                <FormControl fullWidth size="small">
                  <InputLabel>Respuesta correcta</InputLabel>
                  <Select
                    label="Respuesta correcta"
                    value={q.correctTrue === false ? "f" : "t"}
                    onChange={(e) =>
                      updateQuestion(i, { ...q, correctTrue: e.target.value === "t" })
                    }
                  >
                    <MenuItem value="t">Correcto: botón «Verdadero»</MenuItem>
                    <MenuItem value="f">Correcto: botón «Falso»</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
            ) : null}

            {(q.type === "single" || q.type === "multi") && q.options ? (
              <Stack spacing={1} sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Opciones (marca cuál(es) son correctas)
                </Typography>
                {q.options.map((opt, oi) => (
                  <Box key={opt.id} sx={{ display: "flex", gap: 0.5, alignItems: "flex-start" }}>
                    <Button
                      size="small"
                      variant={opt.correct ? "contained" : "outlined"}
                      sx={{ flexShrink: 0, minWidth: 72 }}
                      onClick={() =>
                        updateQuestion(i, {
                          ...q,
                          options: q.options!.map((x, jj) =>
                            q.type === "single"
                              ? { ...x, correct: jj === oi }
                              : jj === oi
                                ? { ...x, correct: !x.correct }
                                : x
                          ),
                        })
                      }
                    >
                      {opt.correct ? "Correcta" : "Elegir"}
                    </Button>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <GatheringDescriptionEditor
                        compact
                        showHelper={false}
                        label={`Opción ${oi + 1}`}
                        value={opt.labelHtml}
                        onChange={(html) =>
                          updateQuestion(i, {
                            ...q,
                            options: q.options!.map((x, jj) =>
                              jj === oi ? { ...x, labelHtml: html } : x
                            ),
                          })
                        }
                      />
                    </Box>
                    <IconButton
                      size="small"
                      aria-label="Eliminar opción"
                      onClick={() =>
                        updateQuestion(i, {
                          ...q,
                          options: q.options!.filter((_, jj) => jj !== oi),
                        })
                      }
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
                <Button
                  size="small"
                  variant="text"
                  onClick={() =>
                    updateQuestion(i, {
                      ...q,
                      options: [
                        ...q.options!,
                        {
                          id: `o_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
                          labelHtml: "<span>Nueva opción</span>",
                          correct: false,
                        },
                      ],
                    })
                  }
                >
                  + Añadir opción
                </Button>
              </Stack>
            ) : null}

            {q.type === "text" ? (
              <TextField
                label="Respuestas aceptadas (una por línea, sin distinguir mayúsculas)"
                size="small"
                fullWidth
                multiline
                minRows={3}
                value={(q.acceptableAnswers ?? []).join("\n")}
                onChange={(e) =>
                  updateQuestion(i, {
                    ...q,
                    acceptableAnswers: e.target.value
                      .split("\n")
                      .map((l) => l.trim())
                      .filter(Boolean),
                  })
                }
                sx={{ mt: 1 }}
              />
            ) : null}
          </Box>
        ))}
      </Stack>

      <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mt: 1.5 }}>
        <Button size="small" variant="outlined" onClick={() => addQuestion("tf")}>
          + V/F
        </Button>
        <Button size="small" variant="outlined" onClick={() => addQuestion("single")}>
          + Una opción
        </Button>
        <Button size="small" variant="outlined" onClick={() => addQuestion("multi")}>
          + Varias opciones
        </Button>
        <Button size="small" variant="outlined" onClick={() => addQuestion("text")}>
          + Texto
        </Button>
      </Stack>
    </Box>
  );
}
