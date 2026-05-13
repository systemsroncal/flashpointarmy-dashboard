import { createHmac, randomBytes, timingSafeEqual } from "crypto";

function stateSecret(): string {
  return (
    process.env.EMAIL_OAUTH_STATE_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.EMAIL_OTP_SECRET?.trim() ||
    ""
  );
}

export function createGmailOAuthState(userId: string): string {
  const secret = stateSecret();
  if (!secret) {
    throw new Error("Set EMAIL_OAUTH_STATE_SECRET or rely on SUPABASE_SERVICE_ROLE_KEY for OAuth CSRF signing.");
  }
  const exp = Date.now() + 10 * 60 * 1000;
  const nonce = randomBytes(12).toString("hex");
  const payload = Buffer.from(JSON.stringify({ sub: userId, exp, nonce }), "utf8").toString("base64url");
  const sig = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyGmailOAuthState(state: string): { userId: string } | null {
  const secret = stateSecret();
  if (!secret) return null;
  const dot = state.lastIndexOf(".");
  if (dot <= 0) return null;
  const payload = state.slice(0, dot);
  const sig = state.slice(dot + 1);
  const expected = createHmac("sha256", secret).update(payload).digest("base64url");
  try {
    if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
      return null;
    }
  } catch {
    return null;
  }
  let parsed: { sub?: string; exp?: number };
  try {
    parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { sub?: string; exp?: number };
  } catch {
    return null;
  }
  if (!parsed.sub || typeof parsed.exp !== "number" || parsed.exp < Date.now()) return null;
  return { userId: parsed.sub };
}
