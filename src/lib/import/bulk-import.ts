export type FlatRow = Record<string, string>;

export type ImportResultItem = {
  status: "imported" | "omitted";
  email?: string;
  phone?: string;
  reason?: string;
  chapter?: string;
};

/** Excel / Fluent Forms: email column headers (aliases; normalized match in pickField). */
export const EMAIL_EXCEL_KEYS = [
  "Email",
  "email",
  "E-mail",
  "E-mail address",
  "Email Address",
  "email address",
  "Email address",
  "user_email",
  "User Email",
];

/** Excel column header for phone in leader/member bulk files (aliases supported). */
export const PHONE_EXCEL_KEYS = [
  "numeric_field",
  "Numeric Field",
  "Phone number",
  "phone",
  "Phone",
  "Mobile",
  "mobile",
  "Cell",
  "cell",
  "input_phone",
];

/**
 * Resolves phone from known columns, then from any flat key whose name suggests phone / Fluent numeric.
 */
export function pickPhoneFromImportRow(row: FlatRow): string {
  const direct = pickField(row, PHONE_EXCEL_KEYS).trim();
  if (direct) {
    const c = cleanPhone(direct);
    if (c.length >= 7) return c;
  }
  for (const [k, v] of Object.entries(row)) {
    const kn = normalizeHeaderKey(k);
    if (!/\b(phone|mobile|cell|tel|numeric)\b/.test(kn)) continue;
    const s = String(v ?? "").trim();
    if (!s) continue;
    const c = cleanPhone(s);
    if (c.length >= 7) return c;
  }
  return "";
}

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
  /** Fluent Forms "Start a Chapter" (form 4) common machine name for church / org */
  "input_text_1",
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

/** Same name columns as Fluent Forms + legacy Excel "Name" only. */
export const IMPORT_FIRST_NAME_KEYS = [
  "First Name",
  "first_name",
  "First name",
  "fname",
  "Given name",
];
export const IMPORT_LAST_NAME_KEYS = [
  "Last Name",
  "last_name",
  "Last name",
  "lname",
  "Surname",
  "Family name",
];
export const IMPORT_FULL_NAME_KEYS = ["name", "Name", "Full Name", "full_name", "Display name"];

/**
 * Resolves first/last from dedicated columns, full-name fields, or a single "Name" column.
 */
export function parsePersonNamesFromImportRow(row: FlatRow): { firstName: string; lastName: string } {
  let firstName = pickField(row, IMPORT_FIRST_NAME_KEYS).trim();
  let lastName = pickField(row, IMPORT_LAST_NAME_KEYS).trim();
  if (!firstName || !lastName) {
    const full = pickField(row, IMPORT_FULL_NAME_KEYS).trim();
    const s = splitName(full);
    if (!firstName) firstName = s.firstName;
    if (!lastName) lastName = s.lastName;
  }
  if (!firstName || !lastName) {
    const legacy = pickField(row, ["name", "Name"]).trim();
    if (legacy) {
      const s = splitName(legacy);
      if (!firstName) firstName = s.firstName;
      if (!lastName) lastName = s.lastName;
    }
  }
  return { firstName: firstName.trim(), lastName: lastName.trim() };
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

/** Optional columns when importing chapters + local leader in one sheet */
export function pickLeaderEmail(row: FlatRow) {
  return pickField(row, [
    "Leader email",
    "Local leader email",
    "Leader Email",
    "leader email",
    "Local Leader Email",
    "Email Address",
    "Email",
    "email",
  ]).toLowerCase();
}

export function pickLeaderFullName(row: FlatRow) {
  return pickField(row, [
    "Leader name",
    "Local leader name",
    "Leader Name",
    "Leader full name",
    "Local Leader Name",
  ]);
}

export function pickLeaderPhone(row: FlatRow) {
  return cleanPhone(
    pickField(row, [
      "Leader phone",
      "Leader Phone",
      "Leader Phone number",
      "Local leader phone",
    ])
  );
}
