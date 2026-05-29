import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/server-session";
import { loadUserRoleNames, isChapterStaffRole } from "@/lib/auth/user-roles";
import { sendTemplatedEmail } from "@/lib/mail/send-templated-email";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function POST(req: Request) {
  try {
    const authResult = await requireApiAuth();
  if ("response" in authResult) return authResult.response;
  const { supabase, user } = authResult;

    const body = (await req.json()) as { targetUserId?: string; chapterId?: string };
    const targetUserId = (body.targetUserId || "").trim();
    const chapterIdFromBody = (body.chapterId || "").trim();
    if (!targetUserId) {
      return NextResponse.json({ error: "targetUserId required" }, { status: 400 });
    }

    const callerRoles = await loadUserRoleNames(supabase, user.id);
    const chapterStaff = isChapterStaffRole(callerRoles);
    const isLeader = callerRoles.includes("local_leader");

    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("primary_chapter_id, first_name, last_name")
      .eq("id", targetUserId)
      .maybeSingle();

    if (!chapterStaff && isLeader) {
      let allowed = false;
      if (chapterIdFromBody) {
        const { data: link } = await supabase
          .from("chapter_leaders")
          .select("chapter_id")
          .eq("user_id", user.id)
          .eq("chapter_id", chapterIdFromBody)
          .limit(1);
        allowed = Boolean(link?.length);
      }
      if (!allowed) {
        const chapterId = targetProfile?.primary_chapter_id;
        if (!chapterId) {
          return NextResponse.json({ error: "Not allowed" }, { status: 403 });
        }
        const { data: links } = await supabase
          .from("chapter_leaders")
          .select("chapter_id")
          .eq("user_id", user.id)
          .eq("chapter_id", chapterId)
          .limit(1);
        allowed = Boolean(links?.length);
      }
      if (!allowed) {
        return NextResponse.json({ error: "Not allowed" }, { status: 403 });
      }
    } else if (!chapterStaff) {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    const admin = createAdminClient();
    const { data: authUser, error: guErr } = await admin.auth.admin.getUserById(targetUserId);
    if (guErr || !authUser.user?.email) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const email = authUser.user.email;
    const meta = authUser.user.user_metadata as Record<string, string | undefined> | undefined;
    const full =
      meta?.first_name || meta?.last_name
        ? `${meta?.first_name ?? ""} ${meta?.last_name ?? ""}`.trim()
        : email;

    await sendTemplatedEmail(
      "local_leader_assigned",
      email,
      {
        user_fullname: full,
        user_email: email,
        resetpassword_url: "",
        validateemail_url: "",
        gathering_title: "",
        gathering_url: "",
        app_name: "Flashpoint Dashboard",
      },
      { triggeredByUserId: user.id }
    );

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to send email" },
      { status: 500 }
    );
  }
}
