import { createAdminClient } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/server-session";
import { isSuperAdminUser, loadUserRoleNames } from "@/lib/auth/user-roles";
import { sendAccountVerifiedEmail } from "@/lib/mail/send-account-verified-email";

const BATCH_LIMIT = 200;

export async function POST(req: Request) {
  const authResult = await requireApiAuth();
  if ("response" in authResult) return authResult.response;

  const roleNames = await loadUserRoleNames(authResult.supabase, authResult.user.id);
  if (!isSuperAdminUser(roleNames)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const body = (await req.json()) as { userId?: string; allVerified?: boolean };
  const admin = createAdminClient();
  const triggeredBy = authResult.user.id;

  if (body.allVerified) {
    const { data: rows, error } = await admin
      .from("profiles")
      .select("id")
      .not("verified_at", "is", null)
      .limit(BATCH_LIMIT);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const ids = (rows ?? []).map((r) => r.id as string);
    let sent = 0;
    const failures: { userId: string; error: string }[] = [];
    for (const id of ids) {
      try {
        await sendAccountVerifiedEmail(admin, id, { triggeredByUserId: triggeredBy });
        sent += 1;
      } catch (e) {
        failures.push({
          userId: id,
          error: e instanceof Error ? e.message : "Send failed.",
        });
      }
    }
    return NextResponse.json({
      sent,
      failed: failures.length,
      failures: failures.slice(0, 20),
      cappedAt: BATCH_LIMIT,
    });
  }

  const userId = (body.userId ?? "").trim();
  if (!userId) {
    return NextResponse.json({ error: "userId or allVerified is required." }, { status: 400 });
  }

  try {
    await sendAccountVerifiedEmail(admin, userId, { triggeredByUserId: triggeredBy });
    return NextResponse.json({ sent: 1 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Send failed." },
      { status: 400 }
    );
  }
}