import { listRoleNamesByUserIds, preferNonEmptyAddr } from "@/lib/admin/dashboard-user-queries";
import { canEditPersonProfile, canViewPersonProfile } from "@/lib/people/person-profile-access";
import { createAdminClient } from "@/utils/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";

export type PersonProfileTab = "profile" | "activity" | "communication" | "notes";

export type PersonProfileData = {
  id: string;
  email: string;
  avatar_url: string | null;
  phone: string | null;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  address_line: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  date_of_birth: string | null;
  gender: string | null;
  primary_chapter_id: string | null;
  chapter: {
    id: string;
    name: string;
    city: string | null;
    state: string | null;
  } | null;
  role_names: string[];
  created_at: string | null;
  canEdit: boolean;
};

export type PersonActivityItem = {
  id: string;
  action: string;
  entity_type: string | null;
  title: string;
  body: string | null;
  created_at: string;
};

export type PersonMessageItem = {
  id: string;
  channel: "email" | "sms" | "system";
  direction: "received" | "sent";
  subject: string | null;
  preview: string | null;
  status: string | null;
  created_at: string;
};

export type PersonNoteItem = {
  id: string;
  body: string;
  created_at: string;
  updated_at: string;
  author_user_id: string;
  author_name: string;
};

function formatRoleAction(action: string): string {
  return action
    .split(/[._]/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

function personDisplayName(p: {
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  email: string;
}): string {
  const full = [p.first_name, p.last_name].filter(Boolean).join(" ").trim();
  return full || p.display_name?.trim() || p.email.split("@")[0] || "User";
}

export async function loadPersonProfilePage(
  supabase: SupabaseClient,
  viewerId: string,
  personUserId: string
): Promise<
  | { ok: true; person: PersonProfileData }
  | { ok: false; status: 403 | 404; error: string }
> {
  const admin = createAdminClient();
  const roleByUser = await listRoleNamesByUserIds(admin, [personUserId]);
  const targetRoles = roleByUser.get(personUserId) ?? [];

  const allowed = await canViewPersonProfile(supabase, viewerId, targetRoles);
  if (!allowed) {
    return { ok: false, status: 403, error: "Forbidden." };
  }

  const { data: profile } = await admin
    .from("profiles")
    .select(
      "id, first_name, last_name, display_name, avatar_url, phone, address_line, city, state, zip_code, date_of_birth, gender, primary_chapter_id, created_at"
    )
    .eq("id", personUserId)
    .maybeSingle();

  const { data: du } = await admin
    .from("dashboard_users")
    .select(
      "id, email, first_name, last_name, display_name, phone, address_line, city, state, zip_code, primary_chapter_id, created_at"
    )
    .eq("id", personUserId)
    .maybeSingle();

  if (!profile && !du) {
    return { ok: false, status: 404, error: "Person not found." };
  }

  const primaryChapterId =
    (profile?.primary_chapter_id as string | null) ??
    (du?.primary_chapter_id as string | null) ??
    null;

  let chapter: PersonProfileData["chapter"] = null;
  if (primaryChapterId) {
    const { data: ch } = await admin
      .from("chapters")
      .select("id, name, city, state")
      .eq("id", primaryChapterId)
      .maybeSingle();
    if (ch) {
      chapter = {
        id: ch.id as string,
        name: ch.name as string,
        city: (ch.city as string | null) ?? null,
        state: (ch.state as string | null) ?? null,
      };
    }
  }

  let resolvedEmail = ((du?.email as string | null) ?? "").trim();
  if (!resolvedEmail) {
    const { data: authData } = await admin.auth.admin.getUserById(personUserId);
    resolvedEmail = authData.user?.email?.trim() ?? "";
  }
  if (!resolvedEmail && !profile) {
    return { ok: false, status: 404, error: "Person not found." };
  }

  const canEdit = await canEditPersonProfile(supabase, viewerId, targetRoles);

  const person: PersonProfileData = {
    id: personUserId,
    email: resolvedEmail,
    avatar_url: (profile?.avatar_url as string | null) ?? null,
    phone: preferNonEmptyAddr(
      profile?.phone as string | null,
      du?.phone as string | null
    ),
    first_name: preferNonEmptyAddr(
      profile?.first_name as string | null,
      du?.first_name as string | null
    ),
    last_name: preferNonEmptyAddr(
      profile?.last_name as string | null,
      du?.last_name as string | null
    ),
    display_name: preferNonEmptyAddr(
      profile?.display_name as string | null,
      du?.display_name as string | null
    ),
    address_line: preferNonEmptyAddr(
      profile?.address_line as string | null,
      du?.address_line as string | null
    ),
    city: preferNonEmptyAddr(profile?.city as string | null, du?.city as string | null),
    state: preferNonEmptyAddr(profile?.state as string | null, du?.state as string | null),
    zip_code: preferNonEmptyAddr(
      profile?.zip_code as string | null,
      du?.zip_code as string | null
    ),
    date_of_birth: (profile?.date_of_birth as string | null) ?? null,
    gender: (profile?.gender as string | null) ?? null,
    primary_chapter_id: primaryChapterId,
    chapter,
    role_names: [...targetRoles].sort(),
    created_at:
      (profile?.created_at as string | null) ?? (du?.created_at as string | null) ?? null,
    canEdit,
  };

  return { ok: true, person };
}

export async function loadPersonActivity(
  personUserId: string,
  limit = 40
): Promise<PersonActivityItem[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("audit_logs")
    .select("id, action, entity_type, payload, created_at")
    .eq("user_id", personUserId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((row) => {
    const payload = (row.payload ?? {}) as Record<string, unknown>;
    const title =
      (typeof payload.title === "string" && payload.title.trim()) ||
      formatRoleAction(String(row.action ?? "activity"));
    const body =
      (typeof payload.text === "string" && payload.text) ||
      (typeof payload.body === "string" && payload.body) ||
      (typeof payload.summary === "string" && payload.summary) ||
      (typeof payload.name === "string" && payload.name) ||
      null;
    return {
      id: String(row.id),
      action: String(row.action ?? ""),
      entity_type: (row.entity_type as string | null) ?? null,
      title,
      body,
      created_at: String(row.created_at),
    };
  });
}

export async function loadPersonMessages(
  person: Pick<PersonProfileData, "id" | "email" | "phone">,
  direction: "received" | "sent" = "received",
  limit = 40
): Promise<PersonMessageItem[]> {
  const admin = createAdminClient();
  const items: PersonMessageItem[] = [];

  if (direction === "received") {
    const email = person.email.trim().toLowerCase();
    if (email) {
      const { data: systemMails } = await admin
        .from("email_send_logs")
        .select("id, subject, body_preview, status, created_at, to_address")
        .ilike("to_address", email)
        .order("created_at", { ascending: false })
        .limit(limit);
      for (const row of systemMails ?? []) {
        items.push({
          id: `sys-${row.id}`,
          channel: "system",
          direction: "received",
          subject: (row.subject as string | null) ?? null,
          preview: (row.body_preview as string | null) ?? null,
          status: (row.status as string | null) ?? null,
          created_at: String(row.created_at),
        });
      }
    }

    const { data: broadcast } = await admin
      .from("broadcast_send_logs")
      .select("id, channel, contact, status, error_message, created_at")
      .eq("user_id", person.id)
      .order("created_at", { ascending: false })
      .limit(limit);
    for (const row of broadcast ?? []) {
      items.push({
        id: `bc-${row.id}`,
        channel: row.channel === "sms" ? "sms" : "email",
        direction: "received",
        subject: row.channel === "sms" ? "SMS" : "Broadcast email",
        preview: (row.contact as string | null) ?? (row.error_message as string | null),
        status: (row.status as string | null) ?? null,
        created_at: String(row.created_at),
      });
    }
  } else {
    const { data: sent } = await admin
      .from("email_send_logs")
      .select("id, subject, body_preview, status, created_at, to_address")
      .eq("triggered_by_user_id", person.id)
      .order("created_at", { ascending: false })
      .limit(limit);
    for (const row of sent ?? []) {
      items.push({
        id: `sent-${row.id}`,
        channel: "email",
        direction: "sent",
        subject: (row.subject as string | null) ?? null,
        preview: (row.to_address as string | null) ?? (row.body_preview as string | null),
        status: (row.status as string | null) ?? null,
        created_at: String(row.created_at),
      });
    }
  }

  items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return items.slice(0, limit);
}

export async function loadPersonNotes(personUserId: string): Promise<PersonNoteItem[]> {
  const admin = createAdminClient();
  const { data: notes } = await admin
    .from("person_profile_notes")
    .select("id, body, created_at, updated_at, author_user_id")
    .eq("person_user_id", personUserId)
    .order("created_at", { ascending: false })
    .limit(100);

  const authorIds = [...new Set((notes ?? []).map((n) => n.author_user_id as string))];
  const nameById = new Map<string, string>();
  if (authorIds.length) {
    const { data: authors } = await admin
      .from("profiles")
      .select("id, first_name, last_name, display_name")
      .in("id", authorIds);
    for (const a of authors ?? []) {
      nameById.set(
        a.id as string,
        personDisplayName({
          first_name: (a.first_name as string | null) ?? null,
          last_name: (a.last_name as string | null) ?? null,
          display_name: (a.display_name as string | null) ?? null,
          email: "author",
        })
      );
    }
  }

  return (notes ?? []).map((n) => ({
    id: n.id as string,
    body: n.body as string,
    created_at: String(n.created_at),
    updated_at: String(n.updated_at),
    author_user_id: n.author_user_id as string,
    author_name: nameById.get(n.author_user_id as string) ?? "Staff",
  }));
}

export function personFullName(person: PersonProfileData): string {
  return personDisplayName(person);
}

export function personInitials(person: PersonProfileData): string {
  const name = personFullName(person);
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}
