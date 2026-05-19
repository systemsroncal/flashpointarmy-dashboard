import { NextResponse } from "next/server";
import { assertCommunityMemberEditAccess } from "@/lib/auth/community-member-edit-access";
import { confirmChangeEmailForUser } from "@/lib/auth/confirm-change-email";
import { normalizeEmail } from "@/lib/auth/email-otp";
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

    const body = (await req.json()) as { newEmail?: string; otp?: string };
    const newEmail = normalizeEmail(body.newEmail || "");
    const otp = (body.otp || "").trim();

    const result = await confirmChangeEmailForUser(
      admin,
      userId,
      targetAuth.user.email || "",
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
