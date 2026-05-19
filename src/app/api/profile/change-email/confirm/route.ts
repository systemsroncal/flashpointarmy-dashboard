import { NextResponse } from "next/server";
import { confirmChangeEmailForUser } from "@/lib/auth/confirm-change-email";
import { normalizeEmail } from "@/lib/auth/email-otp";
import { requireApiAuth } from "@/lib/auth/server-session";
import { createAdminClient } from "@/utils/supabase/admin";

export async function POST(req: Request) {
  try {
    const authResult = await requireApiAuth();
    if ("response" in authResult) return authResult.response;
    const { user } = authResult;

    const body = (await req.json()) as { newEmail?: string; otp?: string };
    const newEmail = normalizeEmail(body.newEmail || "");
    const otp = (body.otp || "").trim();

    const admin = createAdminClient();
    const result = await confirmChangeEmailForUser(
      admin,
      user.id,
      user.email || "",
      newEmail,
      otp
    );

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ ok: true, email: result.email });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to change email." },
      { status: 500 }
    );
  }
}
