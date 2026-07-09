import { insertJourneyActivity } from "@/lib/community/journey-feed";
import { requireApiAuth } from "@/lib/auth/server-session";
import { createAdminClient } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";

type Body = {
  kind?: "mission_briefing" | "missions";
};

export async function POST(req: Request) {
  const authResult = await requireApiAuth();
  if ("response" in authResult) return authResult.response;
  const { user } = authResult;

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  if (body.kind !== "mission_briefing" && body.kind !== "missions") {
    return NextResponse.json({ error: "Invalid kind." }, { status: 400 });
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { data: existing } = await admin
    .from("member_journey_milestones")
    .select(
      "mission_briefing_welcome_seen_at, missions_welcome_seen_at, mission_briefing_started_notified_at, missions_started_notified_at"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (body.kind === "mission_briefing") {
    const alreadySeen = Boolean(existing?.mission_briefing_welcome_seen_at);
    const alreadyNotified = Boolean(existing?.mission_briefing_started_notified_at);

    await admin.from("member_journey_milestones").upsert(
      {
        user_id: user.id,
        mission_briefing_welcome_seen_at: existing?.mission_briefing_welcome_seen_at ?? now,
        missions_welcome_seen_at: existing?.missions_welcome_seen_at ?? null,
        mission_briefing_started_notified_at: alreadyNotified
          ? existing?.mission_briefing_started_notified_at
          : now,
        missions_started_notified_at: existing?.missions_started_notified_at ?? null,
        updated_at: now,
      },
      { onConflict: "user_id" }
    );

    if (!alreadyNotified) {
      try {
        await insertJourneyActivity({
          supabase: admin,
          userId: user.id,
          kind: "mission_briefing_started",
        });
      } catch {
        /* non-blocking */
      }
    }

    return NextResponse.json({ ok: true, alreadySeen });
  }

  const alreadySeen = Boolean(existing?.missions_welcome_seen_at);
  const alreadyNotified = Boolean(existing?.missions_started_notified_at);

  await admin.from("member_journey_milestones").upsert(
    {
      user_id: user.id,
      mission_briefing_welcome_seen_at: existing?.mission_briefing_welcome_seen_at ?? null,
      missions_welcome_seen_at: existing?.missions_welcome_seen_at ?? now,
      mission_briefing_started_notified_at: existing?.mission_briefing_started_notified_at ?? null,
      missions_started_notified_at: alreadyNotified
        ? existing?.missions_started_notified_at
        : now,
      updated_at: now,
    },
    { onConflict: "user_id" }
  );

  if (!alreadyNotified) {
    try {
      await insertJourneyActivity({
        supabase: admin,
        userId: user.id,
        kind: "missions_started",
      });
    } catch {
      /* non-blocking */
    }
  }

  return NextResponse.json({ ok: true, alreadySeen });
}
