/** Client-side sign-in via server route (default-password retry stays server-only). */
export async function signInViaApi(
  email: string,
  password: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const res = await fetch("/api/auth/sign-in", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    credentials: "include",
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string; code?: string };
  if (res.ok) return { ok: true };

  const message = (data.error || "").trim();
  if (data.code === "invalid_credentials" || /invalid login credentials/i.test(message)) {
    return {
      ok: false,
      message:
        "That email or password did not match our records. Check your email, turn off Caps Lock if needed, and use the temporary password from your welcome message (any letter case is fine). If you already chose your own password, use Reset password below.",
    };
  }
  if (/failed to fetch|network/i.test(message)) {
    return {
      ok: false,
      message:
        "Could not reach the sign-in service. Check your connection and try again.",
    };
  }
  return { ok: false, message: message || "Could not sign in." };
}
