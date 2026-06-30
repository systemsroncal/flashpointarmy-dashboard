import {
  COACH_MEETING_DURATION_MINUTES,
  occupiedSlotLabelsForDate,
} from "@/lib/coach-meeting/booking";
import { createAdminClient } from "@/utils/supabase/admin";
import { requireApiAuth } from "@/lib/auth/server-session";
import { NextResponse } from "next/server";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(req: Request) {
  const authResult = await requireApiAuth();
  if ("response" in authResult) return authResult.response;

  const url = new URL(req.url);
  const date = url.searchParams.get("date")?.trim() ?? "";
  if (!DATE_RE.test(date)) {
    return NextResponse.json({ error: "Invalid date." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("member_coach_meetings")
    .select("user_id, coaching_at, ends_at, duration_minutes")
    .not("coaching_at", "is", null)
    .in("status", ["pending", "in_progress", "completed"]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const occupied = occupiedSlotLabelsForDate(
    date,
    (data ?? []).map((row) => ({
      user_id: row.user_id as string,
      coaching_at: row.coaching_at as string,
      ends_at: (row.ends_at as string | null) ?? null,
      duration_minutes: (row.duration_minutes as number | null) ?? COACH_MEETING_DURATION_MINUTES,
    })),
    authResult.user.id
  );

  return NextResponse.json({
    ok: true,
    date,
    occupiedSlots: [...occupied],
    durationMinutes: COACH_MEETING_DURATION_MINUTES,
  });
}
