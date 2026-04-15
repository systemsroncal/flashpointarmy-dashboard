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

export function pickField(row: FlatRow, names: string[]): string {
  const entries = Object.entries(row);
  for (const name of names) {
    const exact = row[name];
    if (typeof exact === "string" && exact.trim()) return exact.trim();
    const lower = name.toLowerCase();
    const found = entries.find(([k]) => k.trim().toLowerCase() === lower);
    if (found && found[1].trim()) return found[1].trim();
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
