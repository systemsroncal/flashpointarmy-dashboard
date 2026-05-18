import { clearSessionStartedCookie } from "@/lib/auth/session-policy";
import { NextResponse } from "next/server";

/** Clears the 24h session clock (e.g. on sign-out). */
export async function POST() {
  const res = NextResponse.json({ ok: true });
  clearSessionStartedCookie(res);
  return res;
}
