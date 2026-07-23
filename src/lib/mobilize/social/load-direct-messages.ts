import type { SupabaseClient } from "@supabase/supabase-js";
import type { MobilizeAuthorSummary } from "@/lib/mobilize/social/resolve-authors";
import { resolveMobilizeAuthors } from "@/lib/mobilize/social/resolve-authors";
import { isMutualFollow, loadProfileVisibility } from "@/lib/mobilize/social/profile-access";

export type DirectMessageRow = {
  id: string;
  body: string;
  created_at: string;
  read_at: string | null;
  sender: MobilizeAuthorSummary;
  recipient: MobilizeAuthorSummary;
  is_outgoing: boolean;
};

export type ConversationSummary = {
  peer: MobilizeAuthorSummary;
  last_message: {
    body: string;
    created_at: string;
    is_outgoing: boolean;
  };
};

export type MutualFollowRecipient = MobilizeAuthorSummary;

function mapMessageRows(
  rows: Array<Record<string, unknown>>,
  viewerId: string,
  authors: Map<string, MobilizeAuthorSummary>
): DirectMessageRow[] {
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

export function buildConversationSummaries(messages: DirectMessageRow[]): ConversationSummary[] {
  const byPeer = new Map<string, DirectMessageRow[]>();

  for (const message of messages) {
    const peerId = message.is_outgoing ? message.recipient.id : message.sender.id;
    const bucket = byPeer.get(peerId) ?? [];
    bucket.push(message);
    byPeer.set(peerId, bucket);
  }

  const summaries: ConversationSummary[] = [];
  for (const [, msgs] of byPeer) {
    msgs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const latest = msgs[0];
    summaries.push({
      peer: latest.is_outgoing ? latest.recipient : latest.sender,
      last_message: {
        body: latest.body,
        created_at: latest.created_at,
        is_outgoing: latest.is_outgoing,
      },
    });
  }

  summaries.sort(
    (a, b) => new Date(b.last_message.created_at).getTime() - new Date(a.last_message.created_at).getTime()
  );
  return summaries;
}

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
  return mapMessageRows(rows, viewerId, authors);
}

export async function loadDirectMessageThread(
  admin: SupabaseClient,
  viewerId: string,
  peerId: string,
  limit = 120
): Promise<DirectMessageRow[]> {
  const { data: rows } = await admin
    .from("mobilize_direct_messages")
    .select("id, sender_id, recipient_id, body, read_at, created_at")
    .or(
      `and(sender_id.eq.${viewerId},recipient_id.eq.${peerId}),and(sender_id.eq.${peerId},recipient_id.eq.${viewerId})`
    )
    .order("created_at", { ascending: true })
    .limit(limit);

  if (!rows?.length) return [];

  const authors = await resolveMobilizeAuthors(admin, [viewerId, peerId]);
  return mapMessageRows(rows, viewerId, authors);
}

export async function loadMutualFollowRecipients(
  admin: SupabaseClient,
  viewerId: string,
  query?: string
): Promise<MutualFollowRecipient[]> {
  const { data: followingRows } = await admin
    .from("mobilize_user_follows")
    .select("following_id")
    .eq("follower_id", viewerId);

  const followingIds = [...new Set((followingRows ?? []).map((row) => row.following_id as string))];
  if (!followingIds.length) return [];

  const { data: followerRows } = await admin
    .from("mobilize_user_follows")
    .select("follower_id")
    .eq("following_id", viewerId)
    .in("follower_id", followingIds);

  const mutualIds = [...new Set((followerRows ?? []).map((row) => row.follower_id as string))];
  if (!mutualIds.length) return [];

  const authors = await resolveMobilizeAuthors(admin, mutualIds);
  let recipients = mutualIds
    .map((id) => authors.get(id))
    .filter((author): author is MobilizeAuthorSummary => Boolean(author));

  const q = query?.trim().toLowerCase();
  if (q) {
    recipients = recipients.filter((author) => {
      const haystack = `${author.display_name} ${author.handle}`.toLowerCase();
      return haystack.includes(q);
    });
  }

  return recipients.sort((a, b) => a.display_name.localeCompare(b.display_name));
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

  const mutual = await isMutualFollow(admin, senderId, recipientId);
  if (!mutual) {
    return {
      ok: false,
      reason: "You can only message members who follow you and whom you follow.",
    };
  }

  return { ok: true };
}
