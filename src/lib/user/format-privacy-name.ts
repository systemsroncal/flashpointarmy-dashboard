/** Title-case a name segment (handles hyphens / apostrophes). */
export function capitalizePersonName(raw: string): string {
  const s = String(raw ?? "").trim();
  if (!s) return s;
  return s
    .split(/([\s'-]+)/)
    .map((part) => {
      if (!part || /^[\s'-]+$/.test(part)) return part;
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join("");
}

/** Public-facing name: first name + last initial (e.g. Carlos P.). */
export function formatPrivacyName(
  firstName?: string | null,
  lastName?: string | null,
  fallback?: string | null
): string {
  const fn = capitalizePersonName(String(firstName ?? "").trim());
  const ln = String(lastName ?? "").trim();
  if (fn && ln) return `${fn} ${ln.charAt(0).toUpperCase()}.`;
  if (fn) return fn;
  if (ln) return `${ln.charAt(0).toUpperCase()}.`;
  const fb = String(fallback ?? "").trim();
  return fb ? capitalizePersonName(fb) : "A member";
}

function redactNamePair(first: string, last: string): string {
  return `${capitalizePersonName(first)} ${last.charAt(0).toUpperCase()}.`;
}

/** Normalize already-redacted handles like "MARIA P." → "Maria P.". */
function capitalizePrivacyHandlesInText(text: string): string {
  return text.replace(
    /\b([\p{L}][\p{L}'-]*)\s+([\p{L}])\.(?=[\s!,?.…]|$)/gu,
    (_, first: string, initial: string) =>
      `${capitalizePersonName(first)} ${initial.toUpperCase()}.`
  );
}

const NAME_PAIR =
  /([A-ZÀ-ÖØ-Þ][\p{L}'-]*)\s+([A-ZÀ-ÖØ-Þ][\p{L}'-]+)/u;

/** Redact "First Last" to "First L." in public feed / notification copy. */
export function scrubPrivacyNamesInText(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return text;

  let out = trimmed;

  // Subtitle that is only a person's name (e.g. member registration feed rows).
  if (/^[A-ZÀ-ÖØ-Þ][\p{L}'-]*\s+[A-ZÀ-ÖØ-Þ][\p{L}'-]+$/u.test(out)) {
    out = out.replace(NAME_PAIR, (_, first, last) => redactNamePair(first, last));
  } else {
    out = out
      .replace(
        /\b([A-ZÀ-ÖØ-Þ][\p{L}'-]*)\s+([A-ZÀ-ÖØ-Þ][\p{L}'-]+)\b(?=\s+(?:was|registered|joined|requested|completed|finished|granted))/gu,
        (_, first, last) => redactNamePair(first, last)
      )
      .replace(
        /^([A-ZÀ-ÖØ-Þ][\p{L}'-]*)\s+([A-ZÀ-ÖØ-Þ][\p{L}'-]+)\b(?=\s+)/u,
        (_, first, last) => redactNamePair(first, last)
      );
  }

  return capitalizePrivacyHandlesInText(out);
}
