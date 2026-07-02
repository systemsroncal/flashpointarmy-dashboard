import {
  listDashboardUsersByIdsWithAuthFallback,
  listProfilesByIds,
} from "@/lib/admin/dashboard-user-queries";
import { loadUserRoleNames, isElevatedRole } from "@/lib/auth/user-roles";
import { requireApiAuth } from "@/lib/auth/server-session";
import { BIBLICAL_CITIZENSHIP_COURSE_SLUG } from "@/lib/courses/course-completion";
import {
  isExternalCertificateSubmissionEnabled,
  resolveCourseIdBySlug,
  type CertificateRequestRow,
} from "@/lib/training/certificate-requests";
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

    let query = admin
      .from("course_certificate_requests")
      .select(
        "id, user_id, course_id, completed_training_confirmed, completion_date, organization_name, certificate_url, certificate_file_name, certificate_mime, status, admin_note, reviewed_by, reviewed_at, created_at, updated_at"
      )
      .eq("course_id", courseId)
      .order("created_at", { ascending: false });

    if (statusFilter && ["pending", "approved", "rejected"].includes(statusFilter)) {
      query = query.eq("status", statusFilter);
    }

    const { data: rows, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const list = (rows ?? []) as CertificateRequestRow[];
    const userIds = [...new Set(list.map((r) => r.user_id))];
    const users = await listDashboardUsersByIdsWithAuthFallback(admin, userIds);
    const profiles = await listProfilesByIds(admin, userIds);
    const profileById = new Map(profiles.map((p) => [p.id, p]));
    const userById = new Map(users.map((u) => [u.id, u]));

    const { data: chapters } = await admin.from("chapters").select("id, name, city, state");
    const chapterById = new Map(
      (chapters ?? []).map((c) => [c.id as string, c as { id: string; name: string; city: string | null; state: string | null }])
    );

    const enriched = list.map((row) => {
      const du = userById.get(row.user_id);
      const prof = profileById.get(row.user_id);
      const chapterId = du?.primary_chapter_id ?? prof?.primary_chapter_id ?? null;
      const chapter = chapterId ? chapterById.get(chapterId) : null;
      const name =
        [du?.first_name, du?.last_name].filter(Boolean).join(" ").trim() ||
        du?.display_name?.trim() ||
        du?.email?.split("@")[0] ||
        "—";
      return {
        ...row,
        user: {
          id: row.user_id,
          name,
          email: du?.email ?? "",
          phone: prof?.phone ?? du?.phone ?? null,
          address_line: prof?.address_line ?? du?.address_line ?? null,
          city: prof?.city ?? du?.city ?? null,
          state: prof?.state ?? du?.state ?? null,
          zip_code: prof?.zip_code ?? du?.zip_code ?? null,
          chapter_id: chapterId,
          chapter_name: chapter?.name ?? null,
          chapter_city: chapter?.city ?? null,
          chapter_state: chapter?.state ?? null,
        },
      };
    });

    return NextResponse.json({ ok: true, requests: enriched });
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
  if (!certificateUrl) {
    return NextResponse.json({ error: "Certificate upload is required." }, { status: 400 });
  }

  const courseId = await resolveCourseIdBySlug(supabase, courseSlug);
  if (!courseId) return NextResponse.json({ error: "Course not found." }, { status: 404 });

  const { data: existing } = await supabase
    .from("course_certificate_requests")
    .select("id")
    .eq("user_id", user.id)
    .eq("course_id", courseId)
    .eq("status", "pending")
    .limit(1)
    .maybeSingle();

  if (existing?.id) {
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
  return NextResponse.json({ ok: true, request: data });
}
