import {
  listDashboardUsersByIdsWithAuthFallback,
  listProfilesByIds,
  listRoleNamesByUserIds,
} from "@/lib/admin/dashboard-user-queries";
import { loadUserRoleNames, isElevatedRole } from "@/lib/auth/user-roles";
import { requireApiAuth } from "@/lib/auth/server-session";
import { BIBLICAL_CITIZENSHIP_COURSE_SLUG } from "@/lib/courses/course-completion";
import {
  markAllCourseSessionsCompleteForUser,
  type CertificateRequestRow,
} from "@/lib/training/certificate-requests";
import { notifyCertificateRequestReviewed } from "@/lib/notifications/certificate-request-notification";
import { createAdminClient } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";

type PatchBody = {
  action?: "approve" | "reject" | "resend_notification";
  admin_note?: string | null;
  confirmText?: string;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const authResult = await requireApiAuth();
  if ("response" in authResult) return authResult.response;
  const { supabase, user } = authResult;

  const { id } = await ctx.params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "Invalid id." }, { status: 400 });

  const roleNames = await loadUserRoleNames(supabase, user.id);
  const elevated = isElevatedRole(roleNames);

  const client = elevated ? createAdminClient() : supabase;
  const { data: row, error } = await client
    .from("course_certificate_requests")
    .select(
      "id, user_id, course_id, completed_training_confirmed, completion_date, organization_name, certificate_url, certificate_file_name, certificate_mime, status, admin_note, reviewed_by, reviewed_at, notification_resend_count, created_at, updated_at, courses(slug, title)"
    )
    .eq("id", id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!row) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const request = row as CertificateRequestRow & {
    courses: { slug: string; title: string } | { slug: string; title: string }[] | null;
  };

  if (!elevated && request.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  if (!elevated) {
    return NextResponse.json({ ok: true, request });
  }

  const admin = createAdminClient();
  const users = await listDashboardUsersByIdsWithAuthFallback(admin, [request.user_id]);
  const profiles = await listProfilesByIds(admin, [request.user_id]);
  const roleMap = await listRoleNamesByUserIds(admin, [request.user_id]);
  const du = users[0];
  const prof = profiles[0];
  const roles = roleMap.get(request.user_id) ?? [];

  type ChapterDetail = {
    id: string;
    name: string;
    city: string | null;
    state: string | null;
    address_line: string | null;
    zip_code: string | null;
  };
  let chapter: ChapterDetail | null = null;
  const chapterId = du?.primary_chapter_id ?? prof?.primary_chapter_id ?? null;
  if (chapterId) {
    const { data: ch } = await admin
      .from("chapters")
      .select("id, name, city, state, address_line, zip_code")
      .eq("id", chapterId)
      .maybeSingle();
    if (ch) chapter = ch as ChapterDetail;
  }

  const courseJoin = request.courses;
  const courseMeta = Array.isArray(courseJoin) ? courseJoin[0] : courseJoin;

  const name =
    [du?.first_name, du?.last_name].filter(Boolean).join(" ").trim() ||
    du?.display_name?.trim() ||
    du?.email?.split("@")[0] ||
    "—";

  let reviewedByName: string | null = null;
  if (request.reviewed_by) {
    const reviewers = await listDashboardUsersByIdsWithAuthFallback(admin, [request.reviewed_by]);
    const reviewer = reviewers[0];
    if (reviewer) {
      reviewedByName =
        [reviewer.first_name, reviewer.last_name].filter(Boolean).join(" ").trim() ||
        reviewer.display_name?.trim() ||
        reviewer.email?.split("@")[0] ||
        "—";
    }
  }

  return NextResponse.json({
    ok: true,
    request: {
      ...request,
      course_slug: courseMeta?.slug ?? null,
      course_title: courseMeta?.title ?? null,
      reviewed_by_name: reviewedByName,
      user: {
        id: request.user_id,
        name,
        email: du?.email ?? "",
        phone: prof?.phone ?? du?.phone ?? null,
        address_line: prof?.address_line ?? du?.address_line ?? null,
        city: prof?.city ?? du?.city ?? null,
        state: prof?.state ?? du?.state ?? null,
        zip_code: prof?.zip_code ?? du?.zip_code ?? null,
        roles,
        chapter,
      },
    },
  });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const authResult = await requireApiAuth();
  if ("response" in authResult) return authResult.response;
  const { supabase, user } = authResult;

  const roleNames = await loadUserRoleNames(supabase, user.id);
  if (!isElevatedRole(roleNames)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { id } = await ctx.params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "Invalid id." }, { status: 400 });

  let body: PatchBody;
  try {
    body = (await req.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const action = body.action;
  if (action !== "approve" && action !== "reject" && action !== "resend_notification") {
    return NextResponse.json(
      { error: "action must be approve, reject, or resend_notification." },
      { status: 400 }
    );
  }

  if (action === "approve" && body.confirmText?.trim() !== "CONFIRM") {
    return NextResponse.json({ error: 'Type CONFIRM to approve this request.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: existing, error: fetchErr } = await admin
    .from("course_certificate_requests")
    .select("id, user_id, course_id, status, admin_note, notification_resend_count, courses(slug, title)")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const courseJoin = existing.courses as
    | { slug: string; title: string }
    | { slug: string; title: string }[]
    | null;
  const courseMeta = Array.isArray(courseJoin) ? courseJoin[0] : courseJoin;
  const courseSlug = courseMeta?.slug ?? BIBLICAL_CITIZENSHIP_COURSE_SLUG;
  const courseTitle = courseMeta?.title?.trim() || "Biblical Citizenship";

  if (action === "resend_notification") {
    if (existing.status !== "approved" && existing.status !== "rejected") {
      return NextResponse.json(
        { error: "Only reviewed requests can resend a notification." },
        { status: 409 }
      );
    }

    try {
      await notifyCertificateRequestReviewed(admin, {
        userId: existing.user_id as string,
        courseTitle,
        status: existing.status as "approved" | "rejected",
        adminNote: (existing.admin_note as string | null) ?? null,
        reviewedBy: user.id,
      });
    } catch (e) {
      return NextResponse.json(
        {
          error:
            e instanceof Error
              ? `Failed to resend notification: ${e.message}`
              : "Failed to resend notification.",
        },
        { status: 500 }
      );
    }

    const currentCount = Number(
      (existing as { notification_resend_count?: number | null }).notification_resend_count ?? 0
    );
    const nextCount = (Number.isFinite(currentCount) ? currentCount : 0) + 1;
    const now = new Date().toISOString();
    const { error: countErr } = await admin
      .from("course_certificate_requests")
      .update({ notification_resend_count: nextCount, updated_at: now })
      .eq("id", id);
    if (countErr) {
      return NextResponse.json(
        { error: countErr.message || "Notification sent but failed to update resend count." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      resent: true,
      status: existing.status,
      notification_resend_count: nextCount,
    });
  }

  if (existing.status !== "pending") {
    return NextResponse.json({ error: "This request has already been reviewed." }, { status: 409 });
  }

  const reviewedAt = new Date().toISOString();
  const newStatus = action === "approve" ? "approved" : "rejected";
  const adminNote = body.admin_note?.trim() || null;

  const { error: updateErr } = await admin
    .from("course_certificate_requests")
    .update({
      status: newStatus,
      admin_note: adminNote,
      reviewed_by: user.id,
      reviewed_at: reviewedAt,
      updated_at: reviewedAt,
    })
    .eq("id", id);

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  let sessionCount = 0;
  if (action === "approve") {
    try {
      const result = await markAllCourseSessionsCompleteForUser(
        admin,
        existing.user_id as string,
        courseSlug
      );
      sessionCount = result.sessionCount;
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Failed to mark sessions complete." },
        { status: 500 }
      );
    }
  }

  try {
    await notifyCertificateRequestReviewed(admin, {
      userId: existing.user_id as string,
      courseTitle,
      status: newStatus,
      adminNote: adminNote,
      reviewedBy: user.id,
    });
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof Error
            ? `Request ${newStatus} but notification failed: ${e.message}`
            : "Request reviewed but notification failed.",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    status: newStatus,
    reviewed_at: reviewedAt,
    sessions_marked_complete: sessionCount,
  });
}
