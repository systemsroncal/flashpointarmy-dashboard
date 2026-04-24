import type { QuizElementPayload, QuizQuestion } from "@/types/course-content";

function correctTf(q: QuizQuestion, answer: unknown): boolean {
  if (typeof answer !== "boolean") return false;
  return answer === Boolean(q.correctTrue);
}

function correctSingle(q: QuizQuestion, answer: unknown): boolean {
  const opts = q.options ?? [];
  const correctId = opts.find((o) => o.correct)?.id;
  if (!correctId || typeof answer !== "string") return false;
  return answer === correctId;
}

function correctMulti(q: QuizQuestion, answer: unknown): boolean {
  const opts = q.options ?? [];
  const correctIds = new Set(opts.filter((o) => o.correct).map((o) => o.id));
  if (!Array.isArray(answer) || answer.some((a) => typeof a !== "string")) return false;
  const picked = new Set(answer as string[]);
  if (picked.size !== correctIds.size) return false;
  for (const id of correctIds) {
    if (!picked.has(id)) return false;
  }
  return true;
}

function questionCorrect(q: QuizQuestion, answer: unknown): boolean {
  switch (q.type) {
    case "tf":
      return correctTf(q, answer);
    case "single":
      return correctSingle(q, answer);
    case "multi":
      return correctMulti(q, answer);
    default:
      return false;
  }
}

/**
 * Proportional score: each correct question awards its `points` weight.
 * `maxScore` comes from payload (course grading cap).
 */
export function gradeQuizPayload(
  payload: QuizElementPayload,
  answers: Record<string, unknown>
): { score: number; maxScore: number } {
  const maxScore = Number.isFinite(payload.maxPoints) ? Math.max(0, payload.maxPoints) : 0;
  const questions = payload.questions ?? [];
  const weightSum = questions.reduce((s, q) => s + (Number.isFinite(q.points) ? Math.max(0, q.points) : 0), 0);

  let earnedWeights = 0;
  for (const q of questions) {
    const w = Number.isFinite(q.points) ? Math.max(0, q.points) : 0;
    if (w <= 0) continue;
    if (questionCorrect(q, answers[q.id])) earnedWeights += w;
  }

  if (maxScore <= 0 || weightSum <= 0) {
    return { score: 0, maxScore: maxScore || 0 };
  }

  const score = (earnedWeights / weightSum) * maxScore;
  return { score: Math.round(score * 100) / 100, maxScore };
}
