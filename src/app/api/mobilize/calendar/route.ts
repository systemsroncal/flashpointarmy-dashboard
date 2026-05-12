import { NextResponse } from "next/server";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";

export async function GET(req: Request) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;
  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const scope = (url.searchParams.get("scope") || "all").toLowerCase();

  if (!from || !to) {
    return NextResponse.json({ error: "from and to ISO date query params are required." }, { status: 400 });
  }

  const { data: memberships } = await auth.admin
    .from("mobilize_group_members")
    .select("group_id")
    .eq("user_id", auth.userId)
    .eq("membership_status", "approved");

  const groupIds = (memberships ?? []).map((m: { group_id: string }) => m.group_id);

  if (scope === "my") {
    if (!groupIds.length) {
      return NextResponse.json({ events: [] });
    }
    const { data: gEv, error: gErr } = await auth.admin
      .from("mobilize_events")
      .select("*")
      .in("group_id", groupIds)
      .gte("date_time", from)
      .lte("date_time", to);
    if (gErr) {
      return NextResponse.json({ error: gErr.message }, { status: 500 });
    }
    const events = [...(gEv ?? [])].sort(
      (a, b) =>
        new Date((a as { date_time: string }).date_time).getTime() -
        new Date((b as { date_time: string }).date_time).getTime()
    );
    return NextResponse.json({ events });
  }

  const { data: publicEv, error: pErr } = await auth.admin
    .from("mobilize_events")
    .select("*")
    .eq("is_public", true)
    .gte("date_time", from)
    .lte("date_time", to);

  if (pErr) {
    return NextResponse.json({ error: pErr.message }, { status: 500 });
  }

  let groupEv: unknown[] = [];
  if (groupIds.length) {
    const { data: gEv, error: gErr } = await auth.admin
      .from("mobilize_events")
      .select("*")
      .in("group_id", groupIds)
      .gte("date_time", from)
      .lte("date_time", to);
    if (gErr) {
      return NextResponse.json({ error: gErr.message }, { status: 500 });
    }
    groupEv = gEv ?? [];
  }

  const byId = new Map<string, unknown>();
  for (const e of publicEv ?? []) byId.set((e as { id: string }).id, e);
  for (const e of groupEv) byId.set((e as { id: string }).id, e);

  const events = [...byId.values()].sort(
    (a, b) =>
      new Date((a as { date_time: string }).date_time).getTime() -
      new Date((b as { date_time: string }).date_time).getTime()
  );

  return NextResponse.json({ events });
}
