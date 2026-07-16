import type { SupabaseClient } from "@supabase/supabase-js";

export type HubTopic = {
  label: string;
  post_count: number;
};

export type SuggestedGroupRow = {
  id: string;
  name: string;
  member_count: number;
  profile_image_url: string | null;
  cover_image_url: string | null;
};

export type HubSidebarPayload = {
  topics: HubTopic[];
  suggested_groups: SuggestedGroupRow[];
};

const HASHTAG_RE = /#([\w]{2,40})/g;

function extractTopicsFromText(text: string, counts: Map<string, number>) {
  for (const match of text.matchAll(HASHTAG_RE)) {
    const tag = match[1]?.toLowerCase();
    if (!tag) continue;
    counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
}

export async function loadMobilizeHubSidebar(
  admin: SupabaseClient,
  viewerId: string
): Promise<HubSidebarPayload> {
  const { data: memberships } = await admin
    .from("mobilize_group_members")
    .select("group_id")
    .eq("user_id", viewerId)
    .eq("membership_status", "approved");

  const memberGroupIds = new Set((memberships ?? []).map((m) => m.group_id as string));

  const [{ data: recentPosts }, { data: publicGroups }] = await Promise.all([
    admin
      .from("mobilize_group_messages")
      .select("content")
      .order("created_at", { ascending: false })
      .limit(80),
    admin
      .from("mobilize_groups")
      .select("id, name, profile_image_url, cover_image_url")
      .eq("visibility", "public")
      .not("parent_group_id", "is", null)
      .order("last_activity_at", { ascending: false, nullsFirst: false })
      .limit(24),
  ]);

  const tagCounts = new Map<string, number>();
  for (const row of recentPosts ?? []) {
    extractTopicsFromText(String(row.content ?? ""), tagCounts);
  }
  const topics: HubTopic[] = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, post_count]) => ({ label: `#${label}`, post_count }));

  const candidateGroups = (publicGroups ?? []).filter((g) => !memberGroupIds.has(g.id as string)).slice(0, 5);
  const suggested_groups: SuggestedGroupRow[] = [];

  for (const g of candidateGroups) {
    const { count } = await admin
      .from("mobilize_group_members")
      .select("id", { count: "exact", head: true })
      .eq("group_id", g.id as string)
      .eq("membership_status", "approved");
    suggested_groups.push({
      id: g.id as string,
      name: g.name as string,
      member_count: count ?? 0,
      profile_image_url: (g.profile_image_url as string | null) ?? null,
      cover_image_url: (g.cover_image_url as string | null) ?? null,
    });
  }

  return { topics, suggested_groups };
}
