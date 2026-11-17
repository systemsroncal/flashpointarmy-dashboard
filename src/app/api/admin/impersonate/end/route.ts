import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/server-session";
import {
  clearImpersonationCookies,
  readImpersonationBackup,
  readImpersonationMetaFromStore,
  restoreImpersonationBackup,
} from "@/lib/auth/impersonation-session";

export async function POST() {
  const authResult = await requireApiAuth();
  if ("response" in authResult) return authResult.response;

  const meta = await readImpersonationMetaFromStore();
  if (!meta || meta.targetUserId !== authResult.user.id) {
    return NextResponse.json({ error: "Not in an impersonated session." }, { status: 400 });
  }

  const backup = await readImpersonationBackup();
  if (!backup) {
    await clearImpersonationCookies();
    return NextResponse.json(
      { error: "Impersonation backup missing or expired. Sign in as administrator again." },
      { status: 409 }
    );
  }

  try {
    await restoreImpersonationBackup(backup);
    await clearImpersonationCookies();
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not restore administrator session." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, redirectTo: "/dashboard/community" });
}