import { loadUserRoleNames, isElevatedRole } from "@/lib/auth/user-roles";
import { requireApiAuth } from "@/lib/auth/server-session";
import { BIBLICAL_CITIZENSHIP_COURSE_SLUG } from "@/lib/courses/course-completion";
import { insertCertificateRequestFeed } from "@/lib/community/training-feed";
import { notifyCertificateRequestSubmitted } from "@/lib/notifications/certificate-request-submitted";
import { approveCertificateRequestRecord } from "@/lib/training/certificate-request-approval";
import {
  isExternalCertificateSubmissionEnabled,
  resolveCourseIdBySlug,
  type CertificateRequestRow,
} from "@/lib/training/certificate-requests";
import {
  listCertificateRequestsAdminPage,
  loadCertificateRequestStatsRows,
  parseCertSortKey,
  type CertListStatus,
} from "@/lib/training/certificate-requests-admin-list";
import type { ChapterSearchRow } from "@/lib/chapters/chapter-search";
import { createAdminClient } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";

type PostBody = {
  courseSlug?: string;
  completed_training_confirmed?: boolean;
  completion_date?: string;
  organization_name?: string;
  certificate_url?: string;
  certificate_file_name?: string | null;
  certificate_mime?: string | null;
};

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export async function GET(req: Request) {
  const authResult = await requireApiAuth();
  if ("response" in authResult) return authResult.response;
  const { supabase, user } = authResult;

  const url = new URL(req.url);
  const adminMode = url.searchParams.get("admin") === "1";
  const statusFilter = url.searchParams.get("status")?.trim() || "";
  const courseSlug = url.searchParams.get("courseSlug")?.trim() || BIBLICAL_CITIZENSHIP_COURSE_SLUG;

  if (adminMode) {
    const roleNames = await loadUserRoleNames(supabase, user.id);
    if (!isElevatedRole(roleNames)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const admin = createAdminClient();
    const courseId = await resolveCourseIdBySlug(admin, courseSlug);
    if (!courseId) return NextResponse.json({ error: "Course not found." }, { status: 404 });

    const view = url.searchParams.get("view")?.trim() || "";
    if (view === "stats") {
      try {
        const statsRows = await loadCertificateRequestStatsRows(admin, courseId);
        return NextResponse.json({ ok: true, statsRows });
      } catch (e) {
        return NextResponse.json(
          { error: e instanceof Error ? e.message : "Failed to load stats." },
          { status: 500 }
        );
      }
    }

    const tabRaw = url.searchParams.get("tab")?.trim() || "";
    const tab: CertListStatus =
      tabRaw === "responded" || statusFilter === "approved" || statusFilter === "rejected"
        ? "responded"
        : "pending";
    const page = Math.max(0, Number(url.searchParams.get("page") || 0) || 0);
    const perPage = Math.min(100, Math.max(1, Number(url.searchParams.get("perPage") || 25) || 25));
    const sort = parseCertSortKey(url.searchParams.get("sort"), tab);
    const ascending = url.searchParams.get("dir") === "asc";
    const q = (url.searchParams.get("q") || "").trim();
    const filterState = url.searchParams.get("state") || "all";
    const filterChapterId = url.searchParams.get("chapterId") || "all";

    const { data: chapters } = await admin.from("chapters").select("id, name, city, state").order("name");
    const chapterOptions: ChapterSearchRow[] = (chapters ?? []).map((c) => ({
      id: c.id as string,
      name: c.name as string,
      city: (c.city as string | null) ?? null,
      state: String(c.state ?? "").trim(),
    }));

    try {
      const result = await listCertificateRequestsAdminPage(admin, {
        courseId,
        tab,
        page,
        perPage,
        sort,
        ascending,
        q,
        filterState,
        filterChapterId,
        chapterOptions,
      });
      return NextResponse.json({
        ok: true,
        requests: result.requests,
        total: result.total,
        pendingCount: result.pendingCount,
        respondedCount: result.respondedCount,
        page,
        perPage,
        sort,
        dir: ascending ? "asc" : "desc",
      });
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Failed to load requests." },
        { status: 500 }
      );
    }
  }

  const courseId = await resolveCourseIdBySlug(supabase, courseSlug);
  if (!courseId) return NextResponse.json({ error: "Course not found." }, { status: 404 });

  const { data, error } = await supabase
    .from("course_certificate_requests")
    .select(
      "id, user_id, course_id, completed_training_confirmed, completion_date, organization_name, certificate_url, certificate_file_name, certificate_mime, status, admin_note, reviewed_by, reviewed_at, created_at, updated_at"
    )
    .eq("user_id", user.id)
    .eq("course_id", courseId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, requests: (data ?? []) as CertificateRequestRow[] });
}

export async function POST(req: Request) {
  const authResult = await requireApiAuth();
  if ("response" in authResult) return authResult.response;
  const { supabase, user } = authResult;

  const roleNames = await loadUserRoleNames(supabase, user.id);
  if (!isExternalCertificateSubmissionEnabled(roleNames)) {
    return NextResponse.json(
      { error: "Certificate submission is not available at this time." },
      { status: 403 }
    );
  }

  let body: PostBody;
  try {
    body = (await req.json()) as PostBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const courseSlug = body.courseSlug?.trim() || BIBLICAL_CITIZENSHIP_COURSE_SLUG;
  const completionDate = body.completion_date?.trim() ?? "";
  const organizationName = body.organization_name?.trim() ?? "";
  const certificateUrl = body.certificate_url?.trim() ?? "";

  if (!body.completed_training_confirmed) {
    return NextResponse.json({ error: "You must confirm you completed this training." }, { status: 400 });
  }
  if (!isIsoDate(completionDate)) {
    return NextResponse.json({ error: "Valid completion date is required (YYYY-MM-DD)." }, { status: 400 });
  }
  if (!organizationName) {
    return NextResponse.json({ error: "Organization / chapter is required." }, { status: 400 });
  }

  const courseId = await resolveCourseIdBySlug(supabase, courseSlug);
  if (!courseId) return NextResponse.json({ error: "Course not found." }, { status: 404 });

  const { data: existing } = await supabase
    .from("course_certificate_requests")
    .select("id, status")
    .eq("user_id", user.id)
    .eq("course_id", courseId)
    .in("status", ["pending", "approved"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing?.status === "approved") {
    return NextResponse.json({ error: "You already have an approved request for this course." }, { status: 409 });
  }
  if (existing?.status === "pending") {
    return NextResponse.json({ error: "You already have a pending request for this course." }, { status: 409 });
  }

  const { data, error } = await supabase
    .from("course_certificate_requests")
    .insert({
      user_id: user.id,
      course_id: courseId,
      completed_training_confirmed: true,
      completion_date: completionDate,
      organization_name: organizationName,
      certificate_url: certificateUrl,
      certificate_file_name: body.certificate_file_name?.trim() || null,
      certificate_mime: body.certificate_mime?.trim() || null,
      status: "pending",
    })
    .select("id, status, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const admin = createAdminClient();
  const { data: course } = await admin.from("courses").select("title").eq("id", courseId).maybeSingle();
  const courseTitle = (course?.title as string | undefined)?.trim() || "Biblical Citizenship";

  try {
    await approveCertificateRequestRecord(admin, {
      requestId: data.id as string,
      userId: user.id,
      courseSlug,
      courseTitle,
      reviewedBy: user.id,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not approve certificate request." },
      { status: 500 }
    );
  }

  try {
    const { data: du } = await admin
      .from("dashboard_users")
      .select("first_name, last_name, email")
      .eq("id", user.id)
      .maybeSingle();
    const { data: prof } = await admin
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", user.id)
      .maybeSingle();

    await notifyCertificateRequestSubmitted(admin, {
      userId: user.id,
      courseTitle,
      organizationName,
    });
    await insertCertificateRequestFeed({
      supabase: admin,
      userId: user.id,
      email: (du?.email as string | undefined) ?? user.email ?? "",
      first_name: (prof?.first_name as string | null) ?? (du?.first_name as string | null) ?? null,
      last_name: (prof?.last_name as string | null) ?? (du?.last_name as string | null) ?? null,
      courseTitle,
      organizationName,
    });
  } catch {
    /* non-blocking admin feed after successful approval */
  }

  return NextResponse.json({ ok: true, request: { ...data, status: "approved" } });
}
