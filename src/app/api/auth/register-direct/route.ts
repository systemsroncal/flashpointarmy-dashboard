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

type RegisterPayload = {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  zipCode?: string;
  gender?: string;
  dateOfBirth?: string;
  joinGroupId?: string;
};

function normalizeGender(raw: string | undefined): "male" | "female" | null {
  const g = (raw || "").trim().toLowerCase();
  if (g === "male" || g === "female") return g;
  return null;
}

function normalizeDateOfBirth(raw: string | undefined): string | null {
  const v = (raw || "").trim();
  if (!v) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  const d = new Date(`${v}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  const year = d.getFullYear();
  if (year < 1900 || year > new Date().getFullYear()) return null;
  return v;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RegisterPayload;
    const email = (body.email || "").trim().toLowerCase();
    const password = (body.password || "").trim();
    const firstName = (body.firstName || "").trim();
    const lastName = (body.lastName || "").trim();
    const phone = (body.phone || "").trim() || null;
    const zipCode = (body.zipCode || "").trim();
    const joinGroupId = (body.joinGroupId || "").trim() || null;
    const gender = normalizeGender(body.gender);
    const dateOfBirth = normalizeDateOfBirth(body.dateOfBirth);

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }
    if (!zipCode || zipCode.replace(/\D/g, "").length < 5) {
      return NextResponse.json(
        { error: "Enter a valid 5-digit ZIP code so we can assign your nearest chapter." },
        { status: 400 }
      );
    }
    if (body.dateOfBirth?.trim() && !dateOfBirth) {
      return NextResponse.json({ error: "Enter a valid date of birth." }, { status: 400 });
    }
    if (body.gender?.trim() && !gender) {
      return NextResponse.json({ error: "Gender must be male or female." }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Chapter is always auto-assigned from ZIP (clients cannot pick a chapter).
    const nearest = await findNearestChapterByZip(supabase, zipCode);
    if (!nearest?.id) {
      return NextResponse.json(
        {
          error:
            "Could not find a chapter near that ZIP code. Please check your ZIP and try again.",
        },
        { status: 400 }
      );
    }
    const primaryChapterId = nearest.id;

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
        zip_code: zipCode,
        gender,
        date_of_birth: dateOfBirth,
      },
    });
    if (createErr || !created.user) {
      return NextResponse.json({ error: createErr?.message || "Could not create account." }, { status: 500 });
    }

    const roleFix = await ensureMemberRoleIfUserHasNoRoles(supabase, created.user.id);
    if (roleFix.error) {
      console.error("[register-direct] ensureMemberRoleIfUserHasNoRoles:", roleFix.error);
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
      mailing: { address_line: null, city: null, state: null, zip_code: zipCode },
    });
    if (mirror.error) {
      console.error("[register-direct] ensureDashboardUserMirror:", mirror.error);
    }

    const { error: profileErr } = await supabase
      .from("profiles")
      .update({
        first_name: firstName,
        last_name: lastName,
        display_name: displayName,
        primary_chapter_id: primaryChapterId,
        phone,
        zip_code: zipCode,
        gender,
        date_of_birth: dateOfBirth,
      })
      .eq("id", created.user.id);
    if (profileErr) {
      console.error("[register-direct] profiles update:", profileErr.message);
    }

    await applyMobilizeAutoFollowForUser(supabase, created.user.id);

    let joinMembership: Record<string, unknown> | null = null;
    if (joinGroupId) {
      const joinResult = await joinMobilizeGroupAsMember(supabase, {
        groupId: joinGroupId,
        userId: created.user.id,
      });
      if (!joinResult.ok) {
        console.error("[register-direct] joinMobilizeGroupAsMember:", joinResult.error);
      } else {
        joinMembership = joinResult.membership;
      }
    }

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
