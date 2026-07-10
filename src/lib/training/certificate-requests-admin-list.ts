import {
  listDashboardUsersByIdsWithAuthFallback,
  listProfilesByIds,
} from "@/lib/admin/dashboard-user-queries";
import {
  chaptersForStateFilter,
  type ChapterSearchRow,
} from "@/lib/chapters/chapter-search";
import type { CertificateRequestRow } from "@/lib/training/certificate-requests";
import type { SupabaseClient } from "@supabase/supabase-js";

export type CertSortKey =
  | "created_at"
  | "reviewed_at"
  | "completion_date"
  | "organization_name"
  | "status"
  | "person"
  | "chapter"
  | "reviewed_by"
  | "notification_resend_count";

export type CertListStatus = "pending" | "responded";

export type EnrichedCertificateRequest = CertificateRequestRow & {
  reviewed_by_name: string | null;
  notification_resend_count: number;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    address_line: string | null;
    city: string | null;
    state: string | null;
    zip_code: string | null;
    chapter_id: string | null;
    chapter_name: string | null;
    chapter_city: string | null;
    chapter_state: string | null;
  };
};

const SELECT_COLS =
  "id, user_id, course_id, completed_training_confirmed, completion_date, organization_name, certificate_url, certificate_file_name, certificate_mime, status, admin_note, reviewed_by, reviewed_at, notification_resend_count, created_at, updated_at";

const DB_SORTABLE = new Set<CertSortKey>([
  "created_at",
  "reviewed_at",
  "completion_date",
  "organization_name",
  "status",
  "notification_resend_count",
]);

export function parseCertSortKey(raw: string | null, tab: CertListStatus): CertSortKey {
  const allowed: CertSortKey[] = [
    "created_at",
    "reviewed_at",
    "completion_date",
    "organization_name",
    "status",
    "person",
    "chapter",
    "reviewed_by",
    "notification_resend_count",
  ];
  if (raw && (allowed as string[]).includes(raw)) {
    if (tab === "pending" && (raw === "reviewed_at" || raw === "reviewed_by" || raw === "notification_resend_count")) {
      return "created_at";
    }
    return raw as CertSortKey;
  }
  return tab === "responded" ? "reviewed_at" : "created_at";
}

async function resolveChapterUserIds(
  admin: SupabaseClient,
  chapterOptions: ChapterSearchRow[],
  filterState: string,
  filterChapterId: string
): Promise<string[] | null> {
  if (filterChapterId === "all" && filterState === "all") return null;

  const chapterIds =
    filterChapterId !== "all"
      ? [filterChapterId]
      : chaptersForStateFilter(chapterOptions, filterState).map((c) => c.id);

  if (!chapterIds.length) return [];

  const userIds = new Set<string>();
  for (let i = 0; i < chapterIds.length; i += 150) {
    const chunk = chapterIds.slice(i, i + 150);
    const [{ data: profiles }, { data: dus }] = await Promise.all([
      admin.from("profiles").select("id").in("primary_chapter_id", chunk),
      admin.from("dashboard_users").select("id").in("primary_chapter_id", chunk),
    ]);
    for (const p of profiles ?? []) userIds.add(p.id as string);
    for (const u of dus ?? []) userIds.add(u.id as string);
  }
  return [...userIds];
}

export async function enrichCertificateRequests(
  admin: SupabaseClient,
  list: CertificateRequestRow[]
): Promise<EnrichedCertificateRequest[]> {
  if (!list.length) return [];

  const userIds = [...new Set(list.map((r) => r.user_id))];
  const [users, profiles, chaptersRes] = await Promise.all([
    listDashboardUsersByIdsWithAuthFallback(admin, userIds),
    listProfilesByIds(admin, userIds),
    admin.from("chapters").select("id, name, city, state"),
  ]);
  const profileById = new Map(profiles.map((p) => [p.id, p]));
  const userById = new Map(users.map((u) => [u.id, u]));
  const chapterById = new Map(
    (chaptersRes.data ?? []).map((c) => [
      c.id as string,
      c as { id: string; name: string; city: string | null; state: string | null },
    ])
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
      notification_resend_count: Number(row.notification_resend_count ?? 0) || 0,
      reviewed_by_name: null as string | null,
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

  const reviewerIds = [
    ...new Set(enriched.map((r) => r.reviewed_by).filter((id): id is string => Boolean(id))),
  ];
  if (reviewerIds.length) {
    const reviewers = await listDashboardUsersByIdsWithAuthFallback(admin, reviewerIds);
    const reviewerNameById = new Map(
      reviewers.map((u) => {
        const reviewerName =
          [u.first_name, u.last_name].filter(Boolean).join(" ").trim() ||
          u.display_name?.trim() ||
          u.email?.split("@")[0] ||
          "—";
        return [u.id, reviewerName] as const;
      })
    );
    for (const row of enriched) {
      row.reviewed_by_name = row.reviewed_by
        ? reviewerNameById.get(row.reviewed_by) ?? null
        : null;
    }
  }

  return enriched;
}

function sortEnriched(
  rows: EnrichedCertificateRequest[],
  sort: CertSortKey,
  ascending: boolean
): EnrichedCertificateRequest[] {
  const dir = ascending ? 1 : -1;
  return [...rows].sort((a, b) => {
    let cmp = 0;
    switch (sort) {
      case "person":
        cmp = a.user.name.localeCompare(b.user.name);
        break;
      case "chapter":
        cmp = (a.user.chapter_name ?? "").localeCompare(b.user.chapter_name ?? "");
        break;
      case "reviewed_by":
        cmp = (a.reviewed_by_name ?? "").localeCompare(b.reviewed_by_name ?? "");
        break;
      case "organization_name":
        cmp = a.organization_name.localeCompare(b.organization_name);
        break;
      case "status":
        cmp = a.status.localeCompare(b.status);
        break;
      case "completion_date":
        cmp = a.completion_date.localeCompare(b.completion_date);
        break;
      case "reviewed_at":
        cmp = (a.reviewed_at ?? "").localeCompare(b.reviewed_at ?? "");
        break;
      case "notification_resend_count":
        cmp = (a.notification_resend_count ?? 0) - (b.notification_resend_count ?? 0);
        break;
      case "created_at":
      default:
        cmp = a.created_at.localeCompare(b.created_at);
        break;
    }
    return cmp * dir;
  });
}

function matchesSearch(row: EnrichedCertificateRequest, q: string): boolean {
  if (!q) return true;
  const blob = [
    row.user.name,
    row.user.email,
    row.organization_name,
    row.user.chapter_name ?? "",
    row.admin_note ?? "",
    row.reviewed_by_name ?? "",
  ]
    .join(" ")
    .toLowerCase();
  return blob.includes(q);
}

export async function listCertificateRequestsAdminPage(
  admin: SupabaseClient,
  args: {
    courseId: string;
    tab: CertListStatus;
    page: number;
    perPage: number;
    sort: CertSortKey;
    ascending: boolean;
    q: string;
    filterState: string;
    filterChapterId: string;
    chapterOptions: ChapterSearchRow[];
  }
): Promise<{
  requests: EnrichedCertificateRequest[];
  total: number;
  pendingCount: number;
  respondedCount: number;
}> {
  const {
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
  } = args;

  const qTrim = q.trim().toLowerCase();
  const hasTextSearch = qTrim.length >= 2;
  const needsMemoryPath =
    hasTextSearch || !DB_SORTABLE.has(sort) || filterChapterId !== "all" || filterState !== "all";

  const [{ count: pendingCount }, { count: approvedCount }, { count: rejectedCount }] =
    await Promise.all([
      admin
        .from("course_certificate_requests")
        .select("id", { count: "exact", head: true })
        .eq("course_id", courseId)
        .eq("status", "pending"),
      admin
        .from("course_certificate_requests")
        .select("id", { count: "exact", head: true })
        .eq("course_id", courseId)
        .eq("status", "approved"),
      admin
        .from("course_certificate_requests")
        .select("id", { count: "exact", head: true })
        .eq("course_id", courseId)
        .eq("status", "rejected"),
    ]);

  const counts = {
    pendingCount: pendingCount ?? 0,
    respondedCount: (approvedCount ?? 0) + (rejectedCount ?? 0),
  };

  if (needsMemoryPath) {
    const chapterUserIds = await resolveChapterUserIds(
      admin,
      chapterOptions,
      filterState,
      filterChapterId
    );
    if (chapterUserIds && chapterUserIds.length === 0) {
      return { requests: [], total: 0, ...counts };
    }

    let query = admin
      .from("course_certificate_requests")
      .select(SELECT_COLS)
      .eq("course_id", courseId)
      .order("created_at", { ascending: false })
      .limit(4000);

    if (tab === "pending") query = query.eq("status", "pending");
    else query = query.in("status", ["approved", "rejected"]);

    if (chapterUserIds) {
      // Cap .in() size; if larger, filter after fetch
      if (chapterUserIds.length <= 400) {
        query = query.in("user_id", chapterUserIds);
      }
    }

    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);

    let list = (rows ?? []) as CertificateRequestRow[];
    if (chapterUserIds && chapterUserIds.length > 400) {
      const allow = new Set(chapterUserIds);
      list = list.filter((r) => allow.has(r.user_id));
    }

    let enriched = await enrichCertificateRequests(admin, list);
    if (hasTextSearch) {
      enriched = enriched.filter((r) => matchesSearch(r, qTrim));
    }
    enriched = sortEnriched(enriched, sort, ascending);
    const total = enriched.length;
    const start = page * perPage;
    return {
      requests: enriched.slice(start, start + perPage),
      total,
      ...counts,
    };
  }

  // Fast path: DB range + DB order, enrich only current page
  const from = page * perPage;
  const to = from + perPage - 1;
  const orderCol = sort as
    | "created_at"
    | "reviewed_at"
    | "completion_date"
    | "organization_name"
    | "status"
    | "notification_resend_count";

  let countQuery = admin
    .from("course_certificate_requests")
    .select("id", { count: "exact", head: true })
    .eq("course_id", courseId);
  let dataQuery = admin
    .from("course_certificate_requests")
    .select(SELECT_COLS)
    .eq("course_id", courseId)
    .order(orderCol, { ascending, nullsFirst: false })
    .range(from, to);

  if (tab === "pending") {
    countQuery = countQuery.eq("status", "pending");
    dataQuery = dataQuery.eq("status", "pending");
  } else {
    countQuery = countQuery.in("status", ["approved", "rejected"]);
    dataQuery = dataQuery.in("status", ["approved", "rejected"]);
  }

  const [{ count, error: countErr }, { data: rows, error: dataErr }] = await Promise.all([
    countQuery,
    dataQuery,
  ]);
  if (countErr) throw new Error(countErr.message);
  if (dataErr) throw new Error(dataErr.message);

  const enriched = await enrichCertificateRequests(admin, (rows ?? []) as CertificateRequestRow[]);
  return {
    requests: enriched,
    total: count ?? 0,
    ...counts,
  };
}

export async function loadCertificateRequestStatsRows(
  admin: SupabaseClient,
  courseId: string
): Promise<Array<{ status: string; created_at: string; reviewed_at: string | null }>> {
  const { data, error } = await admin
    .from("course_certificate_requests")
    .select("status, created_at, reviewed_at")
    .eq("course_id", courseId)
    .order("created_at", { ascending: false })
    .limit(5000);
  if (error) throw new Error(error.message);
  return (data ?? []) as Array<{ status: string; created_at: string; reviewed_at: string | null }>;
}
