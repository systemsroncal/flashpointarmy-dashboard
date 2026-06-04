export type SessionElementTypeRow = { element_type: string };

/** True when the session only contains quiz block(s) — hidden from learner grid & progress totals. */
export function isQuizOnlySession(elements: SessionElementTypeRow[]): boolean {
  if (!elements.length) return false;
  return elements.every((e) => e.element_type === "quiz");
}

export function filterCountableSessionIds(
  sessions: { id: string }[],
  elementsBySessionId: Map<string, SessionElementTypeRow[]>
): string[] {
  return sessions
    .filter((s) => !isQuizOnlySession(elementsBySessionId.get(s.id) ?? []))
    .map((s) => s.id);
}
