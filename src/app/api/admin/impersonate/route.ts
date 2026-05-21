import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient as createServerClient } from "@/utils/supabase/server";
import { requireApiAuth } from "@/lib/auth/server-session";
import { isSuperAdminUser, loadUserRoleNames } from "@/lib/auth/user-roles";
import {
  SESSION_STARTED_COOKIE,
  sessionStartedCookieOptions,
} from "@/lib/auth/session-policy";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Impersonation endpoint (super_admin only).
 *
 * Mechanics:
 *  1. Generate a single-use magic-link token for the target via the Supabase
 *     admin API (`generateLink` returns a `hashed_token`).
 *  2. Immediately consume that token from the SAME request using the SSR
 *     server client (`verifyOtp({ type: "magiclink", token_hash })`). The
 *     server client's cookie writer replaces the caller's session cookies
 *     with the target user's session in the outgoing response.
 *  3. Reset the `fp_session_started_at` cookie so the impersonated session
 *     gets a full 24h policy window (otherwise middleware would still see the
 *     super_admin's older "session started at" and could mark it stale).
 *
 * The super_admin loses their own session on the same response. They can
 * return to their account by signing out and signing back in normally.
 */
export async function POST(req: Request) {
  const authResult = await requireApiAuth();
  if ("response" in authResult) return authResult.response;
  const { supabase: callerClient, user: caller } = authResult;

  const callerRoles = await loadUserRoleNames(callerClient, caller.id);
  if (!isSuperAdminUser(callerRoles)) {
    return NextResponse.json(
      { error: "Only a super administrator can impersonate other users." },
      { status: 403 }
    );
  }

  let body: { userId?: string } = {};
  try {
    body = (await req.json()) as { userId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const userId = String(body.userId ?? "").trim();
  if (!UUID_RE.test(userId)) {
    return NextResponse.json({ error: "Invalid user id." }, { status: 400 });
  }
  if (userId === caller.id) {
    return NextResponse.json(
      { error: "You are already signed in as this user." },
      { status: 400 }
    );
  }

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json(
      {
        error:
          "Server is not configured for impersonation (missing service role key).",
      },
      { status: 503 }
    );
  }

  const { data: targetUserData, error: getErr } =
    await admin.auth.admin.getUserById(userId);
  if (getErr || !targetUserData?.user?.email) {
    return NextResponse.json(
      { error: getErr?.message || "Target user not found." },
      { status: 404 }
    );
  }
  const targetEmail = targetUserData.user.email;

  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: targetEmail,
  });
  if (linkErr || !linkData?.properties?.hashed_token) {
    return NextResponse.json(
      { error: linkErr?.message || "Could not generate impersonation link." },
      { status: 500 }
    );
  }
  const tokenHash = linkData.properties.hashed_token;

  /** Consume the token via the SSR client so cookies are written on the response. */
  const ssrClient = await createServerClient();
  const { error: verifyErr } = await ssrClient.auth.verifyOtp({
    type: "magiclink",
    token_hash: tokenHash,
  });
  if (verifyErr) {
    return NextResponse.json(
      { error: verifyErr.message || "Could not start impersonated session." },
      { status: 500 }
    );
  }

  /**
   * Reset the session-policy cookie via the same Next.js cookie store the SSR
   * client just wrote to. Mixing `response.cookies.set` with cookieStore
   * mutations can lose updates depending on the framework version; routing
   * both through `cookieStore` keeps the outgoing Set-Cookie headers
   * consistent.
   */
  const cookieStore = await cookies();
  cookieStore.set(
    SESSION_STARTED_COOKIE,
    String(Date.now()),
    sessionStartedCookieOptions()
  );

  return NextResponse.json({
    ok: true,
    redirectTo: "/dashboard",
    targetEmail,
  });
}
