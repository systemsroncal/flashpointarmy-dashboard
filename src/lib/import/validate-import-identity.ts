import { normalizeEmail } from "@/lib/auth/email-otp";

/**
 * Minimum bar for bulk / webhook / sync: real mailbox shape (local@domain.tld).
 */
export function isValidImportEmail(raw: string): boolean {
  const e = normalizeEmail(raw);
  if (!e) return false;
  const parts = e.split("@");
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  if (!local || !domain) return false;
  if (local.startsWith(".") || local.endsWith(".") || local.includes("..")) return false;
  if (domain.startsWith(".") || domain.endsWith(".") || domain.includes("..")) return false;
  if (!domain.includes(".")) return false;
  const tld = domain.split(".").pop() ?? "";
  if (tld.length < 2) return false;
  return true;
}

export type ImportIdentityOk = { ok: true; email: string; firstName: string; lastName: string };
export type ImportIdentityErr = { ok: false; reason: string };

export function validateImportIdentity(
  emailRaw: string,
  firstNameRaw: string,
  lastNameRaw: string
): ImportIdentityOk | ImportIdentityErr {
  if (!isValidImportEmail(emailRaw)) {
    return { ok: false, reason: "Invalid or missing email." };
  }
  const email = normalizeEmail(emailRaw);
  const firstName = firstNameRaw.trim();
  const lastName = lastNameRaw.trim();
  if (!firstName || !lastName) {
    return { ok: false, reason: "First and last name are required." };
  }
  return { ok: true, email, firstName, lastName };
}
