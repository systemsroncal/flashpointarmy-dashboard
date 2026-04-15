export type FlatRow = Record<string, string>;

export type ImportResultItem = {
  status: "imported" | "omitted";
  email?: string;
  phone?: string;
  reason?: string;
  chapter?: string;
};

/** Excel column header for phone in leader/member bulk files (aliases supported). */
export const PHONE_EXCEL_KEYS = ["Phone number", "phone", "Phone"];

/** Normalize Excel/CSV header keys: strip BOM, collapse whitespace, lowercase. */
export function normalizeHeaderKey(k: string): string {
  return k
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function pickField(row: FlatRow, names: string[]): string {
  const entries = Object.entries(row);
  for (const name of names) {
    const exact = row[name];
    if (typeof exact === "string" && exact.trim()) return exact.trim();
    const nName = normalizeHeaderKey(name);
    const found = entries.find(([k]) => normalizeHeaderKey(k) === nName);
    if (found && String(found[1]).trim()) return String(found[1]).trim();
  }
  return "";
}

/** Chapter column in start-a-chapter / bulk files — headers vary by export tool. */
const CHAPTER_NAME_EXACT = [
  "Church Affiliation",
  "Chapter name",
  "chapter name",
  "Church affiliation",
  "Church Name",
  "Church name",
  "Name of Church",
  "Name of church",
  "Affiliation",
  "Chapter",
];

export function pickChapterName(row: FlatRow): string {
  const direct = pickField(row, CHAPTER_NAME_EXACT);
  if (direct) return direct;
  for (const [k, v] of Object.entries(row)) {
    const key = normalizeHeaderKey(k);
    const val = String(v ?? "").trim();
    if (!val) continue;
    if (key.includes("church") && key.includes("affiliation")) return val;
    if (key.includes("chapter") && (key.includes("name") || key.includes("location"))) return val;
    if (key === "affiliation" || key.endsWith(" affiliation")) return val;
  }
  return "";
}

export function splitName(fullName: string) {
  const clean = fullName.trim().replace(/\s+/g, " ");
  if (!clean) return { firstName: "", lastName: "" };
  const [first, ...rest] = clean.split(" ");
  return { firstName: first || "", lastName: rest.join(" ").trim() };
}

export function cleanPhone(phone: string) {
  return phone.replace(/[^\d+]/g, "").trim();
}

export function containsTestText(row: FlatRow) {
  return Object.values(row).some((v) => /test/i.test(v || ""));
}

export function parseZipFromAddress(address: string) {
  const zipMatch = address.match(/\b(\d{5})(?:-\d{4})?\b/);
  return zipMatch?.[1] ?? "";
}

export function parseCityFromAddress(address: string) {
  const parts = address.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length < 2) return "";
  return parts[1] || "";
}
