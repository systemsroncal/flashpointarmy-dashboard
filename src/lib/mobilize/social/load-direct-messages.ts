import type { SupabaseClient } from "@supabase/supabase-js";
import type { MobilizeAuthorSummary } from "@/lib/mobilize/social/resolve-authors";
import { resolveMobilizeAuthors } from "@/lib/mobilize/social/resolve-authors";
import { loadProfileVisibility } from "@/lib/mobilize/social/profile-access";

export type DirectMessageRow = {
  id: string;
  body: string;
  created_at: string;
  read_at: string | null;
  sender: MobilizeAuthorSummary;
  recipient: MobilizeAuthorSummary;
  is_outgoing: boolean;
};

export async function loadMobilizeDirectMessages(
  admin: SupabaseClient,
  viewerId: string,
  limit = 60
): Promise<DirectMessageRow[]> {
  const { data: rows } = await admin
    .from("mobilize_direct_messages")
    .select("id, sender_id, recipient_id, body, read_at, created_at")
    .or(`sender_id.eq.${viewerId},recipient_id.eq.${viewerId}`)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!rows?.length) return [];

  const userIds = new Set<string>();
  for (const row of rows) {
    userIds.add(row.sender_id as string);
    userIds.add(row.recipient_id as string);
  }
  const authors = await resolveMobilizeAuthors(admin, [...userIds]);

  return rows.map((row) => {
    const senderId = row.sender_id as string;
    const recipientId = row.recipient_id as string;
    return {
      id: row.id as string,
      body: row.body as string,
      created_at: row.created_at as string,
      read_at: (row.read_at as string | null) ?? null,
      sender: authors.get(senderId)!,
      recipient: authors.get(recipientId)!,
      is_outgoing: senderId === viewerId,
    };
  });
}

export async function canSendDirectMessage(
  admin: SupabaseClient,
  senderId: string,
  recipientId: string
): Promise<{ ok: boolean; reason?: string }> {
  if (senderId === recipientId) return { ok: false, reason: "Cannot message yourself." };
  const visibility = await loadProfileVisibility(admin, recipientId);
  if (visibility === "private") {
    return { ok: false, reason: "This member has a private profile and cannot receive messages." };
  }
  return { ok: true };
}
