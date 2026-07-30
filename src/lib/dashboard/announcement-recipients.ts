import type { SupabaseClient } from "@supabase/supabase-js";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type AnnouncementTargetUser = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
};

export function normalizeTargetUserIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const x of raw) {
    const id = String(x ?? "").trim();
    if (UUID_RE.test(id) && !out.includes(id)) out.push(id);
  }
  return out;
}

export async function loadAnnouncementRecipientsByIds(
  admin: SupabaseClient,
  announcementIds: string[]
): Promise<Map<string, AnnouncementTargetUser[]>> {
  const map = new Map<string, AnnouncementTargetUser[]>();
  if (!announcementIds.length) return map;

  const { data: rows, error } = await admin
    .from("dashboard_announcement_recipients")
    .select("announcement_id, user_id")
    .in("announcement_id", announcementIds);

  if (error) throw new Error(error.message);

  const byAnnouncement = new Map<string, string[]>();
  const userIds = new Set<string>();
  for (const row of rows ?? []) {
    const aid = String((row as { announcement_id: string }).announcement_id);
    const uid = String((row as { user_id: string }).user_id);
    userIds.add(uid);
    const list = byAnnouncement.get(aid) ?? [];
    list.push(uid);
    byAnnouncement.set(aid, list);
  }

  if (!userIds.size) return map;

  const { data: users, error: userErr } = await admin
    .from("dashboard_users")
    .select("id, email, first_name, last_name, display_name")
    .in("id", [...userIds]);

  if (userErr) throw new Error(userErr.message);

  const userById = new Map<string, AnnouncementTargetUser>();
  for (const u of users ?? []) {
    const row = u as {
      id: string;
      email: string;
      first_name: string | null;
      last_name: string | null;
      display_name: string | null;
    };
    userById.set(row.id, {
      id: row.id,
      email: row.email,
      first_name: row.first_name,
      last_name: row.last_name,
      display_name: row.display_name,
    });
  }

  for (const [aid, ids] of byAnnouncement) {
    map.set(
      aid,
      ids.map((id) => userById.get(id)).filter(Boolean) as AnnouncementTargetUser[]
    );
  }

  return map;
}

export async function syncAnnouncementRecipients(
  admin: SupabaseClient,
  announcementId: string,
  userIds: string[]
): Promise<void> {
  const { error: delErr } = await admin
    .from("dashboard_announcement_recipients")
    .delete()
    .eq("announcement_id", announcementId);
  if (delErr) throw new Error(delErr.message);

  if (!userIds.length) return;

  const { error: insErr } = await admin.from("dashboard_announcement_recipients").insert(
    userIds.map((user_id) => ({
      announcement_id: announcementId,
      user_id,
    }))
  );
  if (insErr) throw new Error(insErr.message);
}

export function formatTargetUserLabel(user: AnnouncementTargetUser): string {
  const name =
    [user.first_name, user.last_name].filter(Boolean).join(" ").trim() ||
    user.display_name?.trim() ||
    user.email.split("@")[0];
  return `${name} (${user.email})`;
}
