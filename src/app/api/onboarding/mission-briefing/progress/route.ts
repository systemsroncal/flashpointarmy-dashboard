import { loadUserRoleNames } from "@/lib/auth/user-roles";
import { requireServerUser } from "@/lib/auth/server-session";
import { NextResponse } from "next/server";

function isMemberOnly(roleNames: string[]): boolean {
  return roleNames.includes("member") && !roleNames.includes("local_leader");
}

type Body = {
  video_position_seconds?: number;
  video_duration_seconds?: number | null;
};

export async function PATCH(req: Request) {
  const { supabase, user } = await requireServerUser();
  const roleNames = await loadUserRoleNames(supabase, user.id);
  if (!isMemberOnly(roleNames)) {
    return NextResponse.json({ error: "Mission Briefing is for members only." }, { status: 403 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const position = Number(body.video_position_seconds ?? 0);
  const durationRaw = body.video_duration_seconds;
  const duration =
    durationRaw === null || durationRaw === undefined ? null : Number(durationRaw);

  if (!Number.isFinite(position) || position < 0) {
    return NextResponse.json({ error: "Invalid video position." }, { status: 400 });
  }
  if (duration !== null && (!Number.isFinite(duration) || duration <= 0)) {
    return NextResponse.json({ error: "Invalid video duration." }, { status: 400 });
  }

  const now = new Date().toISOString();
  const { error } = await supabase.from("member_mission_briefing_progress").upsert(
    {
      user_id: user.id,
      video_position_seconds: position,
      video_duration_seconds: duration,
      updated_at: now,
    },
    { onConflict: "user_id" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
