import { US_STATES, usStateByCode } from "@/data/usStates";

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Longest names first so "North Carolina" wins over "Carolina" if both existed. */
const STATES_BY_NAME_LEN = [...US_STATES].sort((a, b) => b.name.length - a.name.length);

/**
 * Maps messy Excel input ("texas", "MN", "Michigan", long prose mentioning a state)
 * to a USPS 2-letter code. Returns null if no reliable match.
 */
export function normalizeUsStateFromText(raw: string | undefined | null): string | null {
  if (raw == null) return null;
  let s = String(raw).trim();
  if (!s) return null;

  s = s.split(/[\r\n]+/)[0].trim();
  if (s.length > 400) s = s.slice(0, 400);

  const flat = s.replace(/\s+/g, " ");

  if (flat.length <= 4) {
    const letters = flat.replace(/[^A-Za-z]/g, "");
    if (letters.length === 2) {
      const code = letters.toUpperCase();
      if (usStateByCode(code)) return code;
    }
  }

  const lowerFlat = flat.toLowerCase();
  for (const st of US_STATES) {
    if (st.name.toLowerCase() === lowerFlat) return st.code;
  }

  for (const st of STATES_BY_NAME_LEN) {
    const re = new RegExp(`\\b${escapeRegExp(st.name)}\\b`, "i");
    if (re.test(flat)) return st.code;
  }

  const upperTokens = flat.match(/\b[A-Z]{2}\b/g);
  if (upperTokens) {
    for (const w of upperTokens) {
      if (usStateByCode(w)) return w;
    }
  }

  return null;
}

/**
 * Tries comma-separated US address segments (city, state, zip) for a state name or code.
 */
export function parseStateFromUsAddress(address: string | undefined | null): string | null {
  if (address == null || !String(address).trim()) return null;
  const parts = String(address)
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  for (let i = parts.length - 1; i >= 0; i--) {
    const c = normalizeUsStateFromText(parts[i]);
    if (c) return c;
  }
  return normalizeUsStateFromText(address);
}

export type ResolveStateInput = {
  churchStateRaw: string;
  address?: string;
};

/**
 * Resolves `chapters.state` (USPS 2-letter): Church State column first, then address line.
 */
export function resolveChapterUsState(input: ResolveStateInput): { code: string } | { error: string } {
  const fromChurch = normalizeUsStateFromText(input.churchStateRaw);
  if (fromChurch) return { code: fromChurch };

  const fromAddr = parseStateFromUsAddress(input.address ?? "");
  if (fromAddr) return { code: fromAddr };

  return {
    error:
      "Could not resolve US state. Use a 2-letter code (e.g. MI), full state name, or ensure the address includes the state (e.g. City, Michigan, 484xx).",
  };
}
