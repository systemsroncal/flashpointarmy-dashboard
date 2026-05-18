import type { NextRequest, NextResponse } from "next/server";

/** Maximum logged-in time per sign-in (sliding window resets on each new login). */
export const SESSION_MAX_AGE_HOURS = 24;
export const SESSION_MAX_AGE_SECONDS = SESSION_MAX_AGE_HOURS * 60 * 60;
export const SESSION_MAX_AGE_MS = SESSION_MAX_AGE_SECONDS * 1000;

export const SESSION_STARTED_COOKIE = "fp_session_started_at";

export function sessionStartedCookieOptions(): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax";
  path: string;
  maxAge: number;
} {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

export function readSessionStartedAt(request: NextRequest): number | null {
  const raw = request.cookies.get(SESSION_STARTED_COOKIE)?.value;
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

export function isAppSessionExpired(
  startedAt: number | null,
  now = Date.now()
): boolean {
  if (startedAt === null) return false;
  return now - startedAt >= SESSION_MAX_AGE_MS;
}

export function setSessionStartedCookie(
  response: NextResponse,
  startedAt = Date.now()
): void {
  response.cookies.set(
    SESSION_STARTED_COOKIE,
    String(startedAt),
    sessionStartedCookieOptions()
  );
}

export function clearSessionStartedCookie(response: NextResponse): void {
  response.cookies.set(SESSION_STARTED_COOKIE, "", {
    ...sessionStartedCookieOptions(),
    maxAge: 0,
  });
}
