import { normalizeEmail } from "@/lib/auth/email-otp";
import {
  EMAIL_EXCEL_KEYS,
  PHONE_EXCEL_KEYS,
  pickField,
  splitName,
  type FlatRow,
} from "@/lib/import/bulk-import";

/**
 * Fluent Forms on fparmychapters.com — form id → primary role in Flashpoint.
 * Webhook POST must include the same numeric `form_id` in the JSON body (or top-level fields).
 */
export const FLUENT_FORM_ID_TO_ROLE = {
  1: "local_leader",
  4: "member",
} as const;

export type FluentFormRole = (typeof FLUENT_FORM_ID_TO_ROLE)[keyof typeof FLUENT_FORM_ID_TO_ROLE];

const FIRST_NAME_KEYS = ["First Name", "first_name", "First name", "fname", "Given name"];
const LAST_NAME_KEYS = ["Last Name", "last_name", "Last name", "lname", "Surname", "Family name"];
const FULL_NAME_KEYS = ["name", "Name", "Full Name", "full_name", "Display name"];
const PASSWORD_KEYS = ["Password", "password", "user_pass", "User password"];
const CHAPTER_ID_KEYS = [
  "primary_chapter_id",
  "Primary Chapter Id",
  "Primary chapter id",
  "Chapter ID",
  "chapter_id",
  "Chapter Id",
  "Chapter UUID",
];

/** Flatten nested objects (Fluent / plugins may nest one level). */
export function mergeNestedFormFields(input: Record<string, unknown>, maxDepth = 5): FlatRow {
  const out: FlatRow = {};
  const walk = (obj: Record<string, unknown>, depth: number) => {
    if (depth > maxDepth) return;
    for (const [k, v] of Object.entries(obj)) {
      if (v == null) continue;
      if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
        out[k] = String(v);
      } else if (typeof v === "object" && !Array.isArray(v)) {
        walk(v as Record<string, unknown>, depth + 1);
      }
    }
  };
  walk(input, 0);
  return out;
}

export function parseFormId(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string" && /^\d+$/.test(raw.trim())) return parseInt(raw.trim(), 10);
  return null;
}

/** Resolve form id from root or common nested Fluent / webhook shapes. */
export function extractFormIdFromPayload(obj: Record<string, unknown>): number | null {
  const direct = parseFormId(obj.form_id ?? obj.formId ?? (obj as { "form.id"?: unknown })["form.id"]);
  if (direct != null) return direct;
  for (const key of ["response", "data", "payload", "entry"]) {
    const inner = obj[key];
    if (inner && typeof inner === "object" && !Array.isArray(inner)) {
      const n = parseFormId((inner as Record<string, unknown>).form_id ?? (inner as Record<string, unknown>).formId);
      if (n != null) return n;
    }
  }
  return null;
}

export function roleForFluentFormId(id: number): FluentFormRole | null {
  if (id === 1) return "local_leader";
  if (id === 4) return "member";
  return null;
}

export function parseFluentFlatRow(flat: FlatRow): {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  primaryChapterId: string;
} {
  const email = normalizeEmail(pickField(flat, EMAIL_EXCEL_KEYS));
  const password = pickField(flat, PASSWORD_KEYS).trim();
  let firstName = pickField(flat, FIRST_NAME_KEYS).trim();
  let lastName = pickField(flat, LAST_NAME_KEYS).trim();
  if (!firstName || !lastName) {
    const full = pickField(flat, FULL_NAME_KEYS).trim();
    const s = splitName(full);
    if (!firstName) firstName = s.firstName;
    if (!lastName) lastName = s.lastName;
  }
  const phone = pickField(flat, PHONE_EXCEL_KEYS).trim();
  const primaryChapterId = pickField(flat, CHAPTER_ID_KEYS).trim();
  return { email, password, firstName, lastName, phone, primaryChapterId };
}
