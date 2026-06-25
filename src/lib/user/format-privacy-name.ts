/** Public-facing name: first name + last initial (e.g. Carlos P.). */
export function formatPrivacyName(
  firstName?: string | null,
  lastName?: string | null,
  fallback?: string | null
): string {
  const fn = String(firstName ?? "").trim();
  const ln = String(lastName ?? "").trim();
  if (fn && ln) return `${fn} ${ln.charAt(0).toUpperCase()}.`;
  if (fn) return fn;
  if (ln) return `${ln.charAt(0).toUpperCase()}.`;
  const fb = String(fallback ?? "").trim();
  return fb || "A member";
}

function redactNamePair(first: string, last: string): string {
  return `${first} ${last.charAt(0).toUpperCase()}.`;
}

const NAME_PAIR =
  /([A-ZÀ-ÖØ-Þ][\p{L}'-]*)\s+([A-ZÀ-ÖØ-Þ][\p{L}'-]+)/u;

/** Redact "First Last" to "First L." in public feed / notification copy. */
export function scrubPrivacyNamesInText(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return text;

  // Subtitle that is only a person's name (e.g. member registration feed rows).
  if (/^[A-ZÀ-ÖØ-Þ][\p{L}'-]*\s+[A-ZÀ-ÖØ-Þ][\p{L}'-]+$/u.test(trimmed)) {
    return trimmed.replace(NAME_PAIR, (_, first, last) => redactNamePair(first, last));
  }

  return trimmed
    .replace(
      /\b([A-ZÀ-ÖØ-Þ][\p{L}'-]*)\s+([A-ZÀ-ÖØ-Þ][\p{L}'-]+)\b(?=\s+(?:was|registered|joined|requested|completed|finished|granted))/gu,
      (_, first, last) => redactNamePair(first, last)
    )
    .replace(
      /^([A-ZÀ-ÖØ-Þ][\p{L}'-]*)\s+([A-ZÀ-ÖØ-Þ][\p{L}'-]+)\b(?=\s+)/u,
      (_, first, last) => redactNamePair(first, last)
    );
}
