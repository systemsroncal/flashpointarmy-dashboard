import { createAdminClient } from "@/utils/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";

export type PersonNoteAdminRow = {
  id: string;
  body: string;
  created_at: string;
  updated_at: string;
  author_user_id: string;
  author_name: string;
  person_user_id: string;
  person_name: string;
  person_email: string;
};

function personDisplayName(p: {
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  email: string;
}): string {
  const full = [p.first_name, p.last_name].filter(Boolean).join(" ").trim();
  return full || p.display_name?.trim() || p.email.split("@")[0] || "User";
}

async function searchPersonUserIds(admin: SupabaseClient, q: string): Promise<string[]> {
  const term = q.trim();
  if (!term) return [];

  const ids = new Set<string>();
  const pattern = `%${term.replace(/[%_\\]/g, "\\$&")}%`;

  const [{ data: profiles }, { data: dashboardUsers }] = await Promise.all([
    admin
      .from("profiles")
      .select("id, first_name, last_name, display_name")
      .or(
        `first_name.ilike.${pattern},last_name.ilike.${pattern},display_name.ilike.${pattern}`
      )
      .limit(80),
    admin
      .from("dashboard_users")
      .select("id, email, first_name, last_name, display_name")
      .or(
        `email.ilike.${pattern},first_name.ilike.${pattern},last_name.ilike.${pattern},display_name.ilike.${pattern}`
      )
      .limit(80),
  ]);

  for (const row of profiles ?? []) ids.add(row.id as string);
  for (const row of dashboardUsers ?? []) ids.add(row.id as string);
  return [...ids];
}

async function enrichPersonNames(
  admin: SupabaseClient,
  userIds: string[]
): Promise<Map<string, { name: string; email: string }>> {
  const map = new Map<string, { name: string; email: string }>();
  if (!userIds.length) return map;

  const [{ data: profiles }, { data: dashboardUsers }] = await Promise.all([
    admin
      .from("profiles")
      .select("id, first_name, last_name, display_name")
      .in("id", userIds),
    admin
      .from("dashboard_users")
      .select("id, email, first_name, last_name, display_name")
      .in("id", userIds),
  ]);

  const duById = new Map((dashboardUsers ?? []).map((u) => [u.id as string, u]));

  for (const id of userIds) {
    const profile = (profiles ?? []).find((p) => p.id === id);
    const du = duById.get(id);
    const email = String(du?.email ?? "").trim() || "—";
    const name = personDisplayName({
      first_name: (profile?.first_name as string | null) ?? (du?.first_name as string | null) ?? null,
      last_name: (profile?.last_name as string | null) ?? (du?.last_name as string | null) ?? null,
      display_name:
        (profile?.display_name as string | null) ?? (du?.display_name as string | null) ?? null,
      email,
    });
    map.set(id, { name, email });
  }

  return map;
}

export async function loadPersonNotesAdminList(options: {
  page: number;
  perPage: number;
  q?: string;
}): Promise<{ rows: PersonNoteAdminRow[]; total: number }> {
  const admin = createAdminClient();
  const { page, perPage } = options;
  const q = (options.q ?? "").trim();

  let query = admin
    .from("person_profile_notes")
    .select("id, body, created_at, updated_at, author_user_id, person_user_id", { count: "exact" })
    .order("created_at", { ascending: false });

  if (q) {
    const personIds = await searchPersonUserIds(admin, q);
    const escaped = q.replace(/[%_\\]/g, "\\$&");
    if (personIds.length) {
      query = query.or(`body.ilike.%${escaped}%,person_user_id.in.(${personIds.join(",")})`);
    } else {
      query = query.ilike("body", `%${escaped}%`);
    }
  }

  const from = page * perPage;
  const to = from + perPage - 1;
  const { data, count, error } = await query.range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  const notes = data ?? [];
  const authorIds = [...new Set(notes.map((n) => n.author_user_id as string))];
  const personIds = [...new Set(notes.map((n) => n.person_user_id as string))];
  const allIds = [...new Set([...authorIds, ...personIds])];
  const namesById = await enrichPersonNames(admin, allIds);

  const rows: PersonNoteAdminRow[] = notes.map((n) => {
    const author = namesById.get(n.author_user_id as string);
    const person = namesById.get(n.person_user_id as string);
    return {
      id: n.id as string,
      body: n.body as string,
      created_at: String(n.created_at),
      updated_at: String(n.updated_at),
      author_user_id: n.author_user_id as string,
      author_name: author?.name ?? "Staff",
      person_user_id: n.person_user_id as string,
      person_name: person?.name ?? "User",
      person_email: person?.email ?? "—",
    };
  });

  return { rows, total: count ?? 0 };
}

export async function updatePersonProfileNote(
  noteId: string,
  body: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createAdminClient();
  const text = body.trim();
  if (!text) return { ok: false, error: "Note text is required." };
  if (text.length > 8000) return { ok: false, error: "Note is too long." };

  const { error } = await admin
    .from("person_profile_notes")
    .update({ body: text, updated_at: new Date().toISOString() })
    .eq("id", noteId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function getPersonProfileNoteById(
  noteId: string
): Promise<PersonNoteAdminRow | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("person_profile_notes")
    .select("id, body, created_at, updated_at, author_user_id, person_user_id")
    .eq("id", noteId)
    .maybeSingle();

  if (!data) return null;

  const namesById = await enrichPersonNames(admin, [
    data.author_user_id as string,
    data.person_user_id as string,
  ]);
  const author = namesById.get(data.author_user_id as string);
  const person = namesById.get(data.person_user_id as string);

  return {
    id: data.id as string,
    body: data.body as string,
    created_at: String(data.created_at),
    updated_at: String(data.updated_at),
    author_user_id: data.author_user_id as string,
    author_name: author?.name ?? "Staff",
    person_user_id: data.person_user_id as string,
    person_name: person?.name ?? "User",
    person_email: person?.email ?? "—",
  };
}
