import {
  SESSION_MAX_AGE_HOURS,
  setSessionStartedCookie,
} from "@/lib/auth/session-policy";
import { getServerAuth } from "@/lib/auth/server-session";
import { NextResponse } from "next/server";

/** Called after a successful sign-in to start the 24h app session clock. */
export async function POST() {
  const { user } = await getServerAuth();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const res = NextResponse.json({
    ok: true,
    maxAgeHours: SESSION_MAX_AGE_HOURS,
  });
  setSessionStartedCookie(res);
  return res;
}
