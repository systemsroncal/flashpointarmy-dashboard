import { cookies } from "next/headers";
import { decryptEmailSecret, encryptEmailSecret } from "@/lib/mail/email-secrets-crypto";
import {
  SESSION_STARTED_COOKIE,
  sessionStartedCookieOptions,
} from "@/lib/auth/session-policy";

export const IMPERSONATION_META_COOKIE = "fp_impersonation_meta";
export const IMPERSONATION_BACKUP_COOKIE = "fp_impersonation_backup";

export type ImpersonationMeta = {
  adminUserId: string;
  targetUserId: string;
  adminDisplayName: string;
  targetDisplayName: string;
};

type ImpersonationBackupPayload = {
  v: 1;
  cookies: { name: string; value: string }[];
  sessionStartedAt: string | null;
};

function impersonationCryptoPassphrase(): string {
  const key =
    process.env.IMPERSONATION_BACKUP_KEY?.trim() ||
    process.env.EMAIL_SECRETS_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!key) {
    throw new Error(
      "Impersonation backup requires IMPERSONATION_BACKUP_KEY, EMAIL_SECRETS_KEY, or SUPABASE_SERVICE_ROLE_KEY."
    );
  }
  return key;
}

export function impersonationMetaCookieOptions() {
  return {
    ...sessionStartedCookieOptions(),
    maxAge: 60 * 60 * 8,
  };
}

export function readImpersonationMeta(raw: string | undefined): ImpersonationMeta | null {
  if (!raw?.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as ImpersonationMeta;
    if (
      !parsed.adminUserId?.trim() ||
      !parsed.targetUserId?.trim() ||
      !parsed.adminDisplayName?.trim() ||
      !parsed.targetDisplayName?.trim()
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function readImpersonationMetaFromStore(): Promise<ImpersonationMeta | null> {
  const cookieStore = await cookies();
  return readImpersonationMeta(cookieStore.get(IMPERSONATION_META_COOKIE)?.value);
}

export async function writeImpersonationSession(
  meta: ImpersonationMeta,
  backup: ImpersonationBackupPayload
): Promise<void> {
  const cookieStore = await cookies();
  const encrypted = encryptEmailSecret(JSON.stringify(backup), impersonationCryptoPassphrase());
  cookieStore.set(IMPERSONATION_META_COOKIE, JSON.stringify(meta), impersonationMetaCookieOptions());
  cookieStore.set(IMPERSONATION_BACKUP_COOKIE, encrypted, impersonationMetaCookieOptions());
}

export async function readImpersonationBackup(): Promise<ImpersonationBackupPayload | null> {
  const cookieStore = await cookies();
  const blob = cookieStore.get(IMPERSONATION_BACKUP_COOKIE)?.value;
  if (!blob) return null;
  try {
    const plain = decryptEmailSecret(blob, impersonationCryptoPassphrase());
    const parsed = JSON.parse(plain) as ImpersonationBackupPayload;
    if (parsed?.v !== 1 || !Array.isArray(parsed.cookies)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function snapshotAuthCookies(): Promise<ImpersonationBackupPayload> {
  const cookieStore = await cookies();
  const sessionStartedAt = cookieStore.get(SESSION_STARTED_COOKIE)?.value ?? null;
  return {
    v: 1,
    cookies: cookieStore.getAll().map((c) => ({ name: c.name, value: c.value })),
    sessionStartedAt,
  };
}

export async function restoreImpersonationBackup(backup: ImpersonationBackupPayload): Promise<void> {
  const cookieStore = await cookies();
  const clearOpts = { ...sessionStartedCookieOptions(), maxAge: 0 };
  const baseOpts = sessionStartedCookieOptions();
  for (const c of cookieStore.getAll()) {
    if (c.name.startsWith("sb-") || c.name === SESSION_STARTED_COOKIE) {
      cookieStore.set(c.name, "", clearOpts);
    }
  }
  for (const { name, value } of backup.cookies) {
    if (!value) continue;
    if (name.startsWith("sb-") || name === SESSION_STARTED_COOKIE) {
      cookieStore.set(name, value, baseOpts);
    }
  }
  if (backup.sessionStartedAt) {
    cookieStore.set(SESSION_STARTED_COOKIE, backup.sessionStartedAt, sessionStartedCookieOptions());
  }
}

export async function clearImpersonationCookies(): Promise<void> {
  const cookieStore = await cookies();
  const cleared = sessionStartedCookieOptions();
  cookieStore.set(IMPERSONATION_META_COOKIE, "", { ...cleared, maxAge: 0 });
  cookieStore.set(IMPERSONATION_BACKUP_COOKIE, "", { ...cleared, maxAge: 0 });
}

export async function loadProfileDisplayName(
  admin: import("@supabase/supabase-js").SupabaseClient,
  userId: string,
  emailFallback?: string | null
): Promise<string> {
  const { data } = await admin
    .from("profiles")
    .select("first_name, last_name, display_name, email")
    .eq("id", userId)
    .maybeSingle();
  const full = [data?.first_name, data?.last_name].filter(Boolean).join(" ").trim();
  return (
    full ||
    data?.display_name?.trim() ||
    data?.email?.trim() ||
    emailFallback?.trim() ||
    "User"
  );
}