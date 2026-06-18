import { MODULE_SLUGS } from "@/config/modules";
import { loadUserRoleNames } from "@/lib/auth/user-roles";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { listRoleNamesByUserIds } from "@/lib/admin/dashboard-user-queries";
import {
  buildSeriesForTimestamps,
  parseRange,
  suggestBucket,
  type DateBucket,
} from "@/lib/reports/bucket-series";
import { fetchCreatedAtInRange } from "@/lib/reports/fetch-created-at-range";
import { fetchAllCourseSessionProgress } from "@/lib/courses/fetch-course-session-progress";
import { can } from "@/types/permissions";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/server-session";

function isBucket(v: string | null): v is DateBucket {
  return v === "day" || v === "month" || v === "year";
}

export async function GET(req: Request) {
  try {
    const authResult = await requireApiAuth();
  if ("response" in authResult) return authResult.response;
  const { supabase, user } = authResult;

    const permissions = await loadModulePermissions(supabase, user.id);
    const roleNames = await loadUserRoleNames(supabase, user.id);
    if (!roleNames.includes("super_admin") || !can(permissions, MODULE_SLUGS.reports, "read")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(req.url);
    const { from, to } = parseRange(url.searchParams.get("from"), url.searchParams.get("to"));
    const bucketParam = url.searchParams.get("bucket");
    const bucket: DateBucket = isBucket(bucketParam) ? bucketParam : suggestBucket(from, to);

    const admin = createAdminClient();
    const fromIso = from.toISOString();
    const toIso = to.toISOString();

    const [
      userDates,
      chapterDates,
      gatheringDates,
      roleRes,
      chapterStatusRes,
      coursesRes,
      sessionsRes,
      progressRows,
    ] = await Promise.all([
      fetchCreatedAtInRange(admin, "dashboard_users", fromIso, toIso),
      fetchCreatedAtInRange(admin, "chapters", fromIso, toIso),
      fetchCreatedAtInRange(admin, "gatherings", fromIso, toIso),
      admin.from("user_roles").select("roles(name)"),
      admin.from("chapters").select("status"),
      admin.from("courses").select("id, title, published").eq("published", true),
      admin.from("course_sessions").select("id, course_id"),
      fetchAllCourseSessionProgress(admin),
    ]);

    const firstErr = roleRes.error || chapterStatusRes.error;
    if (firstErr) {
      return NextResponse.json({ error: firstErr.message }, { status: 400 });
    }

    const usersByBucket = buildSeriesForTimestamps(userDates, from, to, bucket);
    const chaptersByBucket = buildSeriesForTimestamps(chapterDates, from, to, bucket);
    const gatheringsByBucket = buildSeriesForTimestamps(gatheringDates, from, to, bucket);

    const roleCounts = new Map<string, number>();
    for (const row of roleRes.data ?? []) {
      const rel = (row as { roles: { name: string } | { name: string }[] | null }).roles;
      const name = Array.isArray(rel) ? rel[0]?.name : rel?.name;
      if (!name) continue;
      roleCounts.set(name, (roleCounts.get(name) ?? 0) + 1);
    }

    const chapterStatusCounts = new Map<string, number>();
    for (const row of chapterStatusRes.data ?? []) {
      const st = (row as { status: string }).status || "unknown";
      chapterStatusCounts.set(st, (chapterStatusCounts.get(st) ?? 0) + 1);
    }

    /**
     * Per-course completion comparison broken down by role bucket
     * (Local leaders vs. Members). For each published course we count:
     *   - started   = users with at least one progress row in any session
     *   - completed = users whose distinct completed sessions == totalSessions
     * Each user is classified once: anyone with `local_leader` counts as a
     * leader, otherwise anyone with `member` counts as a member, otherwise
     * `other` (excluded from the comparison so admins/staff don't skew it).
     * This is a current-state snapshot, not date-range filtered.
     */
    const courseRows = (coursesRes.data ?? []) as { id: string; title: string }[];
    const sessionRows =
      (sessionsRes.data ?? []) as { id: string; course_id: string }[];

    const sessionsByCourse = new Map<string, Set<string>>();
    for (const s of sessionRows) {
      const set = sessionsByCourse.get(s.course_id) ?? new Set<string>();
      set.add(s.id);
      sessionsByCourse.set(s.course_id, set);
    }
    const courseBySession = new Map<string, string>();
    for (const s of sessionRows) courseBySession.set(s.id, s.course_id);

    /** courseId -> userId -> set of completed sessionIds. */
    const completedByCourseUser = new Map<string, Map<string, Set<string>>>();
    const startedByCourseUser = new Map<string, Set<string>>();
    const allProgressUsers = new Set<string>();
    for (const p of progressRows) {
      const courseId = courseBySession.get(p.session_id);
      if (!courseId) continue;
      allProgressUsers.add(p.user_id);
      const startedSet = startedByCourseUser.get(courseId) ?? new Set<string>();
      startedSet.add(p.user_id);
      startedByCourseUser.set(courseId, startedSet);
      if (!p.completed_at) continue;
      const byUser =
        completedByCourseUser.get(courseId) ?? new Map<string, Set<string>>();
      const seenSessions = byUser.get(p.user_id) ?? new Set<string>();
      seenSessions.add(p.session_id);
      byUser.set(p.user_id, seenSessions);
      completedByCourseUser.set(courseId, byUser);
    }

    /** Single-pass role classification (leader > member > other). */
    type RoleBucket = "leader" | "member" | "other";
    const roleBucketByUser = new Map<string, RoleBucket>();
    if (allProgressUsers.size > 0) {
      const roleMap = await listRoleNamesByUserIds(admin, [...allProgressUsers]);
      for (const uid of allProgressUsers) {
        const slugs = roleMap.get(uid) ?? [];
        const set = new Set(slugs);
        if (set.has("local_leader")) roleBucketByUser.set(uid, "leader");
        else if (set.has("member")) roleBucketByUser.set(uid, "member");
        else roleBucketByUser.set(uid, "other");
      }
    }

    const courseCompletion = courseRows
      .map((c) => {
        const total = sessionsByCourse.get(c.id)?.size ?? 0;
        const startedSet = startedByCourseUser.get(c.id) ?? new Set<string>();
        const byUser = completedByCourseUser.get(c.id);

        let leaderStarted = 0;
        let memberStarted = 0;
        let leaderCompleted = 0;
        let memberCompleted = 0;

        for (const uid of startedSet) {
          const bucket = roleBucketByUser.get(uid) ?? "other";
          if (bucket === "leader") leaderStarted += 1;
          else if (bucket === "member") memberStarted += 1;
        }

        if (byUser && total > 0) {
          for (const [uid, sessions] of byUser) {
            if (sessions.size < total) continue;
            const bucket = roleBucketByUser.get(uid) ?? "other";
            if (bucket === "leader") leaderCompleted += 1;
            else if (bucket === "member") memberCompleted += 1;
          }
        }

        const leaderPercent =
          leaderStarted > 0 ? Math.round((leaderCompleted / leaderStarted) * 100) : 0;
        const memberPercent =
          memberStarted > 0 ? Math.round((memberCompleted / memberStarted) * 100) : 0;

        return {
          courseId: c.id,
          title: c.title,
          totalSessions: total,
          leaderStarted,
          leaderCompleted,
          memberStarted,
          memberCompleted,
          leaderPercent,
          memberPercent,
        };
      })
      /** Most finished first (sum across both buckets) so the default-selected course is meaningful. */
      .sort(
        (a, b) =>
          b.leaderCompleted + b.memberCompleted - (a.leaderCompleted + a.memberCompleted) ||
          b.leaderStarted + b.memberStarted - (a.leaderStarted + a.memberStarted)
      );

    return NextResponse.json({
      range: { from: fromIso, to: toIso },
      bucket,
      usersByBucket,
      chaptersByBucket,
      gatheringsByBucket,
      rolesPie: {
        labels: [...roleCounts.keys()],
        series: [...roleCounts.values()],
      },
      chapterStatusPie: {
        labels: [...chapterStatusCounts.keys()],
        series: [...chapterStatusCounts.values()],
      },
      courseCompletion,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
