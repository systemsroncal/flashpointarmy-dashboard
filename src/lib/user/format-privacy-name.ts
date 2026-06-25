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

/** Redact "First Last" to "First L." in notification copy (legacy rows / manual logs). */
export function scrubPrivacyNamesInText(text: string): string {
  return text.replace(
    /\b([A-ZÀ-ÖØ-Þ][\p{L}'-]*)\s+([A-ZÀ-ÖØ-Þ][\p{L}'-]+)\b(?=\s+(?:was|registered|joined|requested|completed|finished|granted))/gu,
    (_, first: string, last: string) => `${first} ${last.charAt(0).toUpperCase()}.`
  );
}
