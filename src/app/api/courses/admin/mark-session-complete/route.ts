import { listDashboardUsersByIdsWithAuthFallback } from "@/lib/admin/dashboard-user-queries";
import { loadUserRoleNames } from "@/lib/auth/user-roles";
import { requireApiAuth } from "@/lib/auth/server-session";
import { createAdminClient } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";

type Body = {
  email?: string;
  userId?: string;
  courseSlug?: string;
  sessionSlug?: string;
  /** Mark this session and every earlier session in the course complete (by sort_order). */
  throughSessionSlug?: string;
};

export async function POST(req: Request) {
  const authResult = await requireApiAuth();
  if ("response" in authResult) return authResult.response;
  const { supabase, user } = authResult;

  const roleNames = await loadUserRoleNames(supabase, user.id);
  if (!roleNames.includes("super_admin")) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const body = (await req.json()) as Body;
  const courseSlug = body.courseSlug?.trim();
  const sessionSlug = body.sessionSlug?.trim();
  const throughSessionSlug = body.throughSessionSlug?.trim();
  const email = body.email?.trim().toLowerCase();
  const userId = body.userId?.trim();

  if (!courseSlug || (!sessionSlug && !throughSessionSlug)) {
    return NextResponse.json(
      { error: "courseSlug and sessionSlug (or throughSessionSlug) are required." },
      { status: 400 }
    );
  }
  if (!email && !userId) {
    return NextResponse.json({ error: "email or userId is required." }, { status: 400 });
  }

  const admin = createAdminClient();

  let targetUserId = userId ?? "";
  if (!targetUserId && email) {
    const { data: rows } = await admin.from("dashboard_users").select("id").ilike("email", email).limit(2);
    if (!rows?.length) {
      return NextResponse.json({ error: "User not found for that email." }, { status: 404 });
    }
    if (rows.length > 1) {
      return NextResponse.json({ error: "Multiple users match that email." }, { status: 400 });
    }
    targetUserId = rows[0].id as string;
  }

  const users = await listDashboardUsersByIdsWithAuthFallback(admin, [targetUserId]);
  if (!users.length) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const { data: course } = await admin.from("courses").select("id").eq("slug", courseSlug).maybeSingle();
  if (!course) return NextResponse.json({ error: "Course not found." }, { status: 404 });

  const { data: allSessions } = await admin
    .from("course_sessions")
    .select("id, title, slug, sort_order")
    .eq("course_id", course.id)
    .order("sort_order", { ascending: true });

  const sessions = allSessions ?? [];
  const targetSlug = throughSessionSlug || sessionSlug;
  const targetIdx = sessions.findIndex((s) => s.slug === targetSlug);
  if (targetIdx < 0) return NextResponse.json({ error: "Session not found." }, { status: 404 });

  const toComplete = throughSessionSlug ? sessions.slice(0, targetIdx + 1) : [sessions[targetIdx]];
  const completedAt = new Date().toISOString();

  for (const s of toComplete) {
    const { error } = await admin.from("course_session_progress").upsert(
      {
        user_id: targetUserId,
        session_id: s.id,
        completed_at: completedAt,
      },
      { onConflict: "user_id,session_id" }
    );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    userId: targetUserId,
    completedSessionIds: toComplete.map((s) => s.id),
    completedSessionSlugs: toComplete.map((s) => s.slug),
    completedAt,
  });
}
