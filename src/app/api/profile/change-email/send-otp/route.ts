import { NextResponse } from "next/server";
import { sendChangeEmailOtp } from "@/lib/auth/send-change-email-otp";
import { normalizeEmail } from "@/lib/auth/email-otp";
import { requireApiAuth } from "@/lib/auth/server-session";
import { createAdminClient } from "@/utils/supabase/admin";

export async function POST(req: Request) {
  try {
    const authResult = await requireApiAuth();
    if ("response" in authResult) return authResult.response;
    const { user } = authResult;

    const body = (await req.json()) as { newEmail?: string };
    const newEmail = normalizeEmail(body.newEmail || "");

    const admin = createAdminClient();
    const meta = user.user_metadata as Record<string, unknown> | undefined;
    const fullname =
      [meta?.first_name, meta?.last_name].filter((v) => typeof v === "string" && v.trim()).join(" ").trim() ||
      user.email?.split("@")[0] ||
      "there";

    const result = await sendChangeEmailOtp(admin, {
      currentEmail: user.email || "",
      newEmail,
      excludeUserId: user.id,
      userFullname: fullname,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      ok: true,
      sentTo: result.sentTo,
      message: result.message,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to send verification code." },
      { status: 500 }
    );
  }
}
