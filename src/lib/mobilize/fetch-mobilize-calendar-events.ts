import type { SupabaseClient } from "@supabase/supabase-js";

export type MobilizeCalendarEventRow = {
  id: string;
  group_id: string;
  title: string;
  description: string | null;
  date_time: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  event_type: string;
  is_public: boolean;
  created_by: string;
  group_name?: string | null;
};

async function attachGroupNames(
  admin: SupabaseClient,
  events: MobilizeCalendarEventRow[]
): Promise<MobilizeCalendarEventRow[]> {
  const ids = [...new Set(events.map((e) => e.group_id))];
  if (!ids.length) return events;
  const { data: groups, error } = await admin.from("mobilize_groups").select("id, name").in("id", ids);
  if (error) return events;
  const nameById = new Map((groups ?? []).map((g: { id: string; name: string }) => [g.id, g.name]));
  return events.map((e) => ({ ...e, group_name: nameById.get(e.group_id) ?? null }));
}

/**
 * Same visibility rules as GET /api/mobilize/calendar: `my` = events in approved member groups;
 * `all` = public events plus events in member groups (deduped).
 */
export async function fetchMobilizeEventsInRange(
  admin: SupabaseClient,
  userId: string,
  from: string,
  to: string,
  scope: "all" | "my"
): Promise<MobilizeCalendarEventRow[]> {
  const { data: memberships } = await admin
    .from("mobilize_group_members")
    .select("group_id")
    .eq("user_id", userId)
    .eq("membership_status", "approved");

  const groupIds = (memberships ?? []).map((m: { group_id: string }) => m.group_id);

  if (scope === "my") {
    if (!groupIds.length) return [];
    const { data: gEv, error: gErr } = await admin
      .from("mobilize_events")
      .select("id, group_id, title, description, date_time, address, latitude, longitude, event_type, is_public, created_by")
      .in("group_id", groupIds)
      .gte("date_time", from)
      .lte("date_time", to);
    if (gErr) throw new Error(gErr.message);
    const sorted = [...((gEv ?? []) as MobilizeCalendarEventRow[])].sort(
      (a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime()
    );
    return attachGroupNames(admin, sorted);
  }

  const { data: publicEv, error: pErr } = await admin
    .from("mobilize_events")
    .select("id, group_id, title, description, date_time, address, latitude, longitude, event_type, is_public, created_by")
    .eq("is_public", true)
    .gte("date_time", from)
    .lte("date_time", to);

  if (pErr) throw new Error(pErr.message);

  let groupEv: MobilizeCalendarEventRow[] = [];
  if (groupIds.length) {
    const { data: gEv, error: gErr } = await admin
      .from("mobilize_events")
      .select("id, group_id, title, description, date_time, address, latitude, longitude, event_type, is_public, created_by")
      .in("group_id", groupIds)
      .gte("date_time", from)
      .lte("date_time", to);
    if (gErr) throw new Error(gErr.message);
    groupEv = (gEv ?? []) as MobilizeCalendarEventRow[];
  }

  const byId = new Map<string, MobilizeCalendarEventRow>();
  for (const e of (publicEv ?? []) as MobilizeCalendarEventRow[]) byId.set(e.id, e);
  for (const e of groupEv) byId.set(e.id, e);

  const merged = [...byId.values()].sort(
    (a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime()
  );
  return attachGroupNames(admin, merged);
}
