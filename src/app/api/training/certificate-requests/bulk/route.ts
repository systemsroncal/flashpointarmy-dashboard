import { loadUserRoleNames, isElevatedRole } from "@/lib/auth/user-roles";
import { requireApiAuth } from "@/lib/auth/server-session";
import { BIBLICAL_CITIZENSHIP_COURSE_SLUG } from "@/lib/courses/course-completion";
import { notifyCertificateRequestReviewed } from "@/lib/notifications/certificate-request-notification";
import { createAdminClient } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const MAX_BULK = 50;

type Body = {
  action?: "resend_notification";
  ids?: string[];
};

export async function POST(req: Request) {
  const authResult = await requireApiAuth();
  if ("response" in authResult) return authResult.response;
  const { supabase, user } = authResult;

  const roleNames = await loadUserRoleNames(supabase, user.id);
  if (!isElevatedRole(roleNames)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  if (body.action !== "resend_notification") {
    return NextResponse.json({ error: "Unsupported bulk action." }, { status: 400 });
  }

  const ids = [...new Set((body.ids ?? []).map((id) => String(id).trim()).filter(Boolean))];
  if (!ids.length) {
    return NextResponse.json({ error: "Select at least one request." }, { status: 400 });
  }
  if (ids.length > MAX_BULK) {
    return NextResponse.json(
      { error: `You can resend at most ${MAX_BULK} notifications at once.` },
      { status: 400 }
    );
  }
  if (ids.some((id) => !UUID_RE.test(id))) {
    return NextResponse.json({ error: "One or more ids are invalid." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: rows, error } = await admin
    .from("course_certificate_requests")
    .select("id, user_id, status, admin_note, notification_resend_count, courses(slug, title)")
    .in("id", ids);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const byId = new Map((rows ?? []).map((r) => [r.id as string, r]));
  const results: Array<{
    id: string;
    ok: boolean;
    error?: string;
    notification_resend_count?: number;
  }> = [];

  for (const id of ids) {
    const existing = byId.get(id);
    if (!existing) {
      results.push({ id, ok: false, error: "Not found." });
      continue;
    }
    if (existing.status !== "approved" && existing.status !== "rejected") {
      results.push({ id, ok: false, error: "Only reviewed requests can resend." });
      continue;
    }

    const courseJoin = existing.courses as
      | { slug: string; title: string }
      | { slug: string; title: string }[]
      | null;
    const courseMeta = Array.isArray(courseJoin) ? courseJoin[0] : courseJoin;
    const courseTitle = courseMeta?.title?.trim() || "Biblical Citizenship";

    try {
      await notifyCertificateRequestReviewed(admin, {
        userId: existing.user_id as string,
        courseTitle,
        status: existing.status as "approved" | "rejected",
        adminNote: (existing.admin_note as string | null) ?? null,
        reviewedBy: user.id,
      });

      const currentCount = Number(existing.notification_resend_count ?? 0);
      const nextCount = (Number.isFinite(currentCount) ? currentCount : 0) + 1;
      const now = new Date().toISOString();
      const { error: countErr } = await admin
        .from("course_certificate_requests")
        .update({ notification_resend_count: nextCount, updated_at: now })
        .eq("id", id);
      if (countErr) {
        results.push({
          id,
          ok: false,
          error: countErr.message || "Sent but failed to update resend count.",
        });
        continue;
      }
      results.push({ id, ok: true, notification_resend_count: nextCount });
    } catch (e) {
      results.push({
        id,
        ok: false,
        error: e instanceof Error ? e.message : "Failed to resend.",
      });
    }
  }

  const sent = results.filter((r) => r.ok).length;
  const failed = results.length - sent;
  return NextResponse.json({
    ok: failed === 0,
    sent,
    failed,
    results,
    courseSlugHint: BIBLICAL_CITIZENSHIP_COURSE_SLUG,
  });
}
