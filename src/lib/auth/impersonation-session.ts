import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/utils/supabase/server";
import { decryptEmailSecret, encryptEmailSecret } from "@/lib/mail/email-secrets-crypto";
import {
  SESSION_STARTED_COOKIE,
  sessionStartedCookieOptions,
} from "@/lib/auth/session-policy";

export const IMPERSONATION_META_COOKIE = "fp_impersonation_meta";
export const IMPERSONATION_BACKUP_COOKIE = "fp_impersonation_backup";

const BACKUP_COOKIE_CHUNK_BYTES = 3500;

export type ImpersonationMeta = {
  adminUserId: string;
  targetUserId: string;
  adminDisplayName: string;
  targetDisplayName: string;
};

type ImpersonationBackupPayloadV2 = {
  v: 2;
  access_token: string;
  refresh_token: string;
  sessionStartedAt: string | null;
};

type ImpersonationBackupPayloadV1 = {
  v: 1;
  cookies: { name: string; value: string }[];
  sessionStartedAt: string | null;
};

export type ImpersonationBackupPayload = ImpersonationBackupPayloadV2 | ImpersonationBackupPayloadV1;

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

function backupCookieOptions() {
  return impersonationMetaCookieOptions();
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

function encryptBackupPayload(backup: ImpersonationBackupPayload): string[] {
  const encrypted = encryptEmailSecret(JSON.stringify(backup), impersonationCryptoPassphrase());
  if (encrypted.length <= BACKUP_COOKIE_CHUNK_BYTES) return [encrypted];
  const chunks: string[] = [];
  for (let i = 0; i < encrypted.length; i += BACKUP_COOKIE_CHUNK_BYTES) {
    chunks.push(encrypted.slice(i, i + BACKUP_COOKIE_CHUNK_BYTES));
  }
  return chunks;
}

function readEncryptedBackupBlob(cookieStore: Awaited<ReturnType<typeof cookies>>): string | null {
  const multi = cookieStore.get("fp_impersonation_backup_n")?.value;
  if (multi) {
    const count = Number(multi);
    if (Number.isFinite(count) && count > 0) {
      let blob = "";
      for (let i = 0; i < count; i += 1) {
        const part = cookieStore.get(`fp_impersonation_backup_${i}`)?.value;
        if (!part) return null;
        blob += part;
      }
      return blob;
    }
  }
  return cookieStore.get(IMPERSONATION_BACKUP_COOKIE)?.value ?? null;
}

export async function writeImpersonationSession(
  meta: ImpersonationMeta,
  backup: ImpersonationBackupPayload
): Promise<void> {
  const cookieStore = await cookies();
  const chunks = encryptBackupPayload(backup);
  const opts = backupCookieOptions();
  const clear = { ...opts, maxAge: 0 };

  for (const c of cookieStore.getAll()) {
    if (
      c.name === IMPERSONATION_BACKUP_COOKIE ||
      c.name === "fp_impersonation_backup_n" ||
      c.name.startsWith("fp_impersonation_backup_")
    ) {
      cookieStore.set(c.name, "", clear);
    }
  }

  cookieStore.set(IMPERSONATION_META_COOKIE, JSON.stringify(meta), opts);

  if (chunks.length === 1) {
    cookieStore.set(IMPERSONATION_BACKUP_COOKIE, chunks[0], opts);
    return;
  }

  cookieStore.set("fp_impersonation_backup_n", String(chunks.length), opts);
  chunks.forEach((chunk, i) => {
    cookieStore.set(`fp_impersonation_backup_${i}`, chunk, opts);
  });
}

export async function readImpersonationBackup(): Promise<ImpersonationBackupPayload | null> {
  const cookieStore = await cookies();
  const blob = readEncryptedBackupBlob(cookieStore);
  if (!blob) return null;
  try {
    const plain = decryptEmailSecret(blob, impersonationCryptoPassphrase());
    const parsed = JSON.parse(plain) as ImpersonationBackupPayload;
    if (parsed?.v === 2) {
      if (!parsed.refresh_token?.trim() || !parsed.access_token?.trim()) return null;
      return parsed;
    }
    if (parsed?.v === 1 && Array.isArray(parsed.cookies)) return parsed;
    return null;
  } catch {
    return null;
  }
}

/** Compact admin session snapshot (avoids oversized cookie blobs from full cookie dumps). */
export async function snapshotAdminSession(supabase: SupabaseClient): Promise<ImpersonationBackupPayloadV2> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error || !session?.refresh_token || !session.access_token) {
    throw new Error("No active administrator session to back up for impersonation.");
  }
  const cookieStore = await cookies();
  const sessionStartedAt = cookieStore.get(SESSION_STARTED_COOKIE)?.value ?? null;
  return {
    v: 2,
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    sessionStartedAt,
  };
}

async function restoreLegacyCookieBackup(backup: ImpersonationBackupPayloadV1): Promise<void> {
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

export async function restoreImpersonationBackup(backup: ImpersonationBackupPayload): Promise<void> {
  if (backup.v === 2) {
    const ssrClient = await createServerClient();
    const { error } = await ssrClient.auth.setSession({
      access_token: backup.access_token,
      refresh_token: backup.refresh_token,
    });
    if (error) {
      throw new Error(error.message || "Could not restore administrator session.");
    }
    const cookieStore = await cookies();
    if (backup.sessionStartedAt) {
      cookieStore.set(SESSION_STARTED_COOKIE, backup.sessionStartedAt, sessionStartedCookieOptions());
    } else {
      cookieStore.set(SESSION_STARTED_COOKIE, String(Date.now()), sessionStartedCookieOptions());
    }
    return;
  }
  await restoreLegacyCookieBackup(backup);
}

export async function clearImpersonationCookies(): Promise<void> {
  const cookieStore = await cookies();
  const cleared = sessionStartedCookieOptions();
  cookieStore.set(IMPERSONATION_META_COOKIE, "", { ...cleared, maxAge: 0 });
  cookieStore.set(IMPERSONATION_BACKUP_COOKIE, "", { ...cleared, maxAge: 0 });
  cookieStore.set("fp_impersonation_backup_n", "", { ...cleared, maxAge: 0 });
  for (const c of cookieStore.getAll()) {
    if (c.name.startsWith("fp_impersonation_backup_")) {
      cookieStore.set(c.name, "", { ...cleared, maxAge: 0 });
    }
  }
}

export async function loadProfileDisplayName(
  admin: SupabaseClient,
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