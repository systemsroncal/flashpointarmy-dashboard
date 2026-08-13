import { NextResponse } from "next/server";
import { isEmailInUse } from "@/lib/auth/email-in-use";
import { findNearestChapterByZip } from "@/lib/chapters/find-nearest-chapter-by-zip";
import {
  ensureDashboardUserMirror,
  ensureMemberRoleIfUserHasNoRoles,
} from "@/lib/import/dashboard-user-mirror";
import { applyMobilizeAutoFollowForUser } from "@/lib/mobilize/auto-follow";
import { joinMobilizeGroupAsMember } from "@/lib/mobilize/join-group-membership";
import { createAdminClient } from "@/utils/supabase/admin";
import { hashOtp, normalizeEmail, OTP_PURPOSE_REGISTER } from "@/lib/auth/email-otp";

type RegisterPayload = {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  primaryChapterId?: string;
  /** When primaryChapterId is omitted, resolve nearest church by ZIP. */
  zipCode?: string;
  /** After account creation, auto-join this Mobilize group. */
  joinGroupId?: string;
  otp?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RegisterPayload;
    const email = normalizeEmail(body.email || "");
    const password = (body.password || "").trim();
    const firstName = (body.firstName || "").trim();
    const lastName = (body.lastName || "").trim();
    const phone = (body.phone || "").trim() || null;
    const zipCode = (body.zipCode || "").trim();
    const joinGroupId = (body.joinGroupId || "").trim() || null;
    let primaryChapterId = (body.primaryChapterId || "").trim();
    const otp = (body.otp || "").trim();

    if (!email || !password || !firstName || !lastName || !otp) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    const supabase = createAdminClient();

    if (!primaryChapterId) {
      if (!zipCode) {
        return NextResponse.json(
          { error: "ZIP code is required to assign your church." },
          { status: 400 }
        );
      }
      const nearest = await findNearestChapterByZip(supabase, zipCode);
      if (!nearest?.id) {
        return NextResponse.json(
          { error: "Could not find a church near that ZIP code. Please check your ZIP and try again." },
          { status: 400 }
        );
      }
      primaryChapterId = nearest.id;
    } else {
      const { data: chapterOk } = await supabase
        .from("chapters")
        .select("id")
        .eq("id", primaryChapterId)
        .maybeSingle();
      if (!chapterOk?.id) {
        return NextResponse.json({ error: "Chapter not found." }, { status: 400 });
      }
    }

    const nowIso = new Date().toISOString();
    const { data: otpRow, error: otpErr } = await supabase
      .from("email_otp_codes")
      .select("id, otp_hash, attempts, max_attempts, expires_at")
      .eq("email", email)
      .eq("purpose", OTP_PURPOSE_REGISTER)
      .is("consumed_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (otpErr || !otpRow) {
      return NextResponse.json({ error: "No active verification code found." }, { status: 400 });
    }
    if (otpRow.expires_at < nowIso) {
      return NextResponse.json({ error: "Verification code expired. Request a new one." }, { status: 400 });
    }
    if (otpRow.attempts >= otpRow.max_attempts) {
      return NextResponse.json({ error: "Too many attempts. Request a new code." }, { status: 429 });
    }

    const expectedHash = hashOtp(email, OTP_PURPOSE_REGISTER, otp);
    if (expectedHash !== otpRow.otp_hash) {
      await supabase
        .from("email_otp_codes")
        .update({ attempts: otpRow.attempts + 1 })
        .eq("id", otpRow.id);
      return NextResponse.json({ error: "Invalid verification code." }, { status: 400 });
    }

    if (await isEmailInUse(supabase, email)) {
      return NextResponse.json({ error: "This email is already registered." }, { status: 409 });
    }

    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        primary_chapter_id: primaryChapterId,
        phone,
        zip_code: zipCode || null,
      },
    });
    if (createErr || !created.user) {
      return NextResponse.json({ error: createErr?.message || "Could not create account." }, { status: 500 });
    }

    const roleFix = await ensureMemberRoleIfUserHasNoRoles(supabase, created.user.id);
    if (roleFix.error) {
      console.error("[register-with-otp] ensureMemberRoleIfUserHasNoRoles:", roleFix.error);
    }

    const displayName = `${firstName} ${lastName}`.trim();
    const mirror = await ensureDashboardUserMirror(supabase, {
      id: created.user.id,
      email,
      firstName,
      lastName,
      displayName,
      primaryChapterId,
      phone,
      mailing: zipCode
        ? { address_line: null, city: null, state: null, zip_code: zipCode }
        : undefined,
    });
    if (mirror.error) {
      console.error("[register-with-otp] ensureDashboardUserMirror:", mirror.error);
    }

    await applyMobilizeAutoFollowForUser(supabase, created.user.id);

    let joinMembership: Record<string, unknown> | null = null;
    if (joinGroupId) {
      const joinResult = await joinMobilizeGroupAsMember(supabase, {
        groupId: joinGroupId,
        userId: created.user.id,
      });
      if (!joinResult.ok) {
        console.error("[register-with-otp] joinMobilizeGroupAsMember:", joinResult.error);
      } else {
        joinMembership = joinResult.membership;
      }
    }

    await supabase
      .from("email_otp_codes")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", otpRow.id);

    return NextResponse.json({
      ok: true,
      primaryChapterId,
      membership: joinMembership,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not complete registration." },
      { status: 500 }
    );
  }
}
