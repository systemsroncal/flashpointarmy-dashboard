import { NextResponse } from "next/server";
import { assertCommunityMemberEditAccess } from "@/lib/auth/community-member-edit-access";
import { normalizeEmail } from "@/lib/auth/email-otp";
import { sendChangeEmailOtp } from "@/lib/auth/send-change-email-otp";
import { getApiSessionWithPermissions } from "@/lib/auth/server-session";
import { createAdminClient } from "@/utils/supabase/admin";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(
  req: Request,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;
    if (!UUID_RE.test(userId)) {
      return NextResponse.json({ error: "Invalid user id." }, { status: 400 });
    }

    const session = await getApiSessionWithPermissions();
    if ("error" in session) return session.error;
    const { user, permissions, supabase } = session;

    const admin = createAdminClient();
    const access = await assertCommunityMemberEditAccess(admin, supabase, user, permissions, userId);
    if (!access.ok) return access.response;

    const { data: targetAuth, error: authErr } = await admin.auth.admin.getUserById(userId);
    if (authErr || !targetAuth.user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const body = (await req.json()) as { newEmail?: string };
    const newEmail = normalizeEmail(body.newEmail || "");
    const currentEmail = targetAuth.user.email || "";

    const meta = targetAuth.user.user_metadata as Record<string, unknown> | undefined;
    const fullname =
      [meta?.first_name, meta?.last_name].filter((v) => typeof v === "string" && v.trim()).join(" ").trim() ||
      currentEmail.split("@")[0] ||
      "there";

    const result = await sendChangeEmailOtp(admin, {
      currentEmail,
      newEmail,
      excludeUserId: userId,
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
