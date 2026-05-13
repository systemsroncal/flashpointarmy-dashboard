import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const KDF_SALT = "fp-email-delivery-v1";

function deriveKeyFromPassphrase(passphrase: string): Buffer {
  const pw = passphrase.trim();
  if (!pw) {
    throw new Error("La clave de cifrado no puede estar vacía.");
  }
  return scryptSync(pw, KDF_SALT, 32);
}

/** AES-256-GCM; output is base64(iv + tag + ciphertext). */
export function encryptEmailSecret(plain: string, passphrase: string): string {
  const iv = randomBytes(12);
  const key = deriveKeyFromPassphrase(passphrase);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decryptEmailSecret(blob: string, passphrase: string): string {
  const raw = Buffer.from(blob, "base64");
  if (raw.length < 28) throw new Error("Invalid encrypted secret.");
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const data = raw.subarray(28);
  const key = deriveKeyFromPassphrase(passphrase);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}
