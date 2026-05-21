import { MODULE_SLUGS } from "@/config/modules";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import {
  buildSeriesForTimestamps,
  parseRange,
  suggestBucket,
  type DateBucket,
} from "@/lib/reports/bucket-series";
import { fetchCreatedAtInRange } from "@/lib/reports/fetch-created-at-range";
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
    if (!can(permissions, MODULE_SLUGS.reports, "read")) {
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
      progressRes,
    ] = await Promise.all([
      fetchCreatedAtInRange(admin, "dashboard_users", fromIso, toIso),
      fetchCreatedAtInRange(admin, "chapters", fromIso, toIso),
      fetchCreatedAtInRange(admin, "gatherings", fromIso, toIso),
      admin.from("user_roles").select("roles(name)"),
      admin.from("chapters").select("status"),
      admin.from("courses").select("id, title, published").eq("published", true),
      admin.from("course_sessions").select("id, course_id"),
      admin.from("course_session_progress").select("user_id, session_id, completed_at"),
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
     * Per-course completion comparison: for each published course count users who
     * (a) started — have at least one progress row — and (b) completed every session.
     * Completion is defined as "distinct completed sessions == total sessions for
     * the course". This is the snapshot definition (not date-range filtered) so the
     * comparison reflects the current state of training.
     */
    const courseRows = (coursesRes.data ?? []) as { id: string; title: string }[];
    const sessionRows =
      (sessionsRes.data ?? []) as { id: string; course_id: string }[];
    const progressRows =
      (progressRes.data ?? []) as {
        user_id: string;
        session_id: string;
        completed_at: string | null;
      }[];

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
    for (const p of progressRows) {
      const courseId = courseBySession.get(p.session_id);
      if (!courseId) continue;
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

    const courseCompletion = courseRows
      .map((c) => {
        const total = sessionsByCourse.get(c.id)?.size ?? 0;
        const started = startedByCourseUser.get(c.id)?.size ?? 0;
        let completed = 0;
        const byUser = completedByCourseUser.get(c.id);
        if (byUser && total > 0) {
          for (const [, sessions] of byUser) {
            if (sessions.size >= total) completed += 1;
          }
        }
        const percent = started > 0 ? Math.round((completed / started) * 100) : 0;
        return {
          courseId: c.id,
          title: c.title,
          totalSessions: total,
          startedUsers: started,
          completedUsers: completed,
          percent,
        };
      })
      /** Sort by raw completed count desc so the most-finished courses lead the chart. */
      .sort((a, b) => b.completedUsers - a.completedUsers || b.startedUsers - a.startedUsers);

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
