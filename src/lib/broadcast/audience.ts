import type { SupabaseClient } from "@supabase/supabase-js";
import {
  BROADCAST_AUDIENCES,
  type BroadcastAudience,
  type BroadcastAudienceFilter,
  type BroadcastRecipient,
} from "@/lib/broadcast/types";

const ADMIN_ROLES = new Set(["admin", "super_admin"]);
const ALL_ADMIN_ROLES = new Set(["admin", "super_admin", "sub_admin"]);
const STAFF_ROLES = new Set(["admin", "super_admin", "sub_admin", "local_leader"]);

export function normalizeBroadcastAudience(raw: unknown): BroadcastAudience {
  const s = String(raw ?? "all_users").trim().toLowerCase();
  if ((BROADCAST_AUDIENCES as readonly string[]).includes(s)) {
    return s as BroadcastAudience;
  }
  return "all_users";
}

export function normalizeAudienceFilter(raw: unknown): BroadcastAudienceFilter {
  if (!raw || typeof raw !== "object") {
    return { audience: "all_users", chapterId: null };
  }
  const o = raw as Record<string, unknown>;
  const chapterRaw = o.chapterId ?? o.chapter_id;
  const chapterId =
    chapterRaw == null || String(chapterRaw).trim() === "" || String(chapterRaw) === "all"
      ? null
      : String(chapterRaw).trim();
  return {
    audience: normalizeBroadcastAudience(o.audience),
    chapterId,
  };
}

function isPureMember(roleNames: string[]): boolean {
  const set = new Set(roleNames);
  if (!set.has("member")) return false;
  if (set.has("local_leader")) return false;
  for (const r of ALL_ADMIN_ROLES) {
    if (set.has(r)) return false;
  }
  return true;
}

function matchesAudience(roleNames: string[], audience: BroadcastAudience): boolean {
  switch (audience) {
    case "all_users":
      return true;
    case "members":
      return isPureMember(roleNames);
    case "local_leaders":
      return roleNames.includes("local_leader");
    case "admins":
      return roleNames.some((r) => ADMIN_ROLES.has(r));
    case "sub_admins":
      return roleNames.includes("sub_admin");
    case "all_admins":
      return roleNames.some((r) => ALL_ADMIN_ROLES.has(r));
    case "all_staff":
      return roleNames.some((r) => STAFF_ROLES.has(r));
    default:
      return false;
  }
}

export async function resolveBroadcastRecipients(
  admin: SupabaseClient,
  filter: BroadcastAudienceFilter,
  channel: "email" | "sms"
): Promise<BroadcastRecipient[]> {
  const [{ data: users }, { data: profiles }, { data: roles }, { data: chapters }] =
    await Promise.all([
      admin.from("dashboard_users").select("id, email, phone"),
      admin.from("profiles").select("id, first_name, last_name, display_name, phone, primary_chapter_id"),
      admin.from("user_roles").select("user_id, roles(name)"),
      admin.from("chapters").select("id, name"),
    ]);

  const chapterNameById = new Map<string, string>();
  for (const ch of chapters ?? []) {
    chapterNameById.set(ch.id as string, ch.name as string);
  }

  const profileById = new Map<string, Record<string, unknown>>();
  for (const p of profiles ?? []) {
    profileById.set(p.id as string, p as Record<string, unknown>);
  }

  const rolesByUser = new Map<string, string[]>();
  for (const row of roles ?? []) {
    const uid = row.user_id as string;
    const roleName = (row.roles as { name?: string } | null)?.name;
    if (!roleName) continue;
    const list = rolesByUser.get(uid) ?? [];
    list.push(roleName);
    rolesByUser.set(uid, list);
  }

  const out: BroadcastRecipient[] = [];
  const seenContact = new Set<string>();

  for (const u of users ?? []) {
    const userId = u.id as string;
    const roleNames = rolesByUser.get(userId) ?? [];
    if (!matchesAudience(roleNames, filter.audience)) continue;

    const prof = profileById.get(userId);
    const chapterId = prof?.primary_chapter_id as string | null | undefined;
    if (filter.chapterId && chapterId !== filter.chapterId) continue;

    const email = (u.email as string | null)?.trim().toLowerCase() || null;
    const profilePhone = (prof?.phone as string | null)?.trim() || null;
    const dashPhone = (u.phone as string | null)?.trim() || null;
    const phone = profilePhone || dashPhone || null;

    const contact = channel === "email" ? email : phone;
    if (!contact) continue;
    const dedupeKey = `${channel}:${contact}`;
    if (seenContact.has(dedupeKey)) continue;
    seenContact.add(dedupeKey);

    out.push({
      userId,
      email,
      phone,
      firstName: (prof?.first_name as string | null) ?? null,
      lastName: (prof?.last_name as string | null) ?? null,
      displayName: (prof?.display_name as string | null) ?? null,
      chapterName: chapterId ? chapterNameById.get(chapterId) ?? null : null,
      roleNames,
    });
  }

  return out;
}
