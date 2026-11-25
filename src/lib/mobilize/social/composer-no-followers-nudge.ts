import {
  sortComposerGroupOptions,
  type ComposerGroupOption,
  type ComposerPostTarget,
} from "@/lib/mobilize/social/composer-post-target";

export const MOBILIZE_STARTER_GROUPS_LIMIT = 6;

export function shouldShowNoFollowersPostNudge(
  followersCount: number | null | undefined,
  target: ComposerPostTarget
): boolean {
  return target.type === "profile" && (followersCount ?? 0) < 1;
}

export type StarterGroupBrief = {
  id: string;
  name: string;
  cover_image_url?: string | null;
  my_membership_status?: string | null;
};

export async function fetchComposerJoinedGroups(): Promise<ComposerGroupOption[]> {
  const res = await fetch("/api/mobilize/my-groups");
  const json = (await res.json()) as {
    groups?: { id: string; name: string; is_featured?: boolean; my_membership_status?: string | null }[];
  };
  if (!res.ok) return [];
  const approved = (json.groups ?? []).filter(
    (g) => (g.my_membership_status ?? "approved") === "approved"
  );
  return sortComposerGroupOptions(
    approved.map((g) => ({
      id: String(g.id),
      name: String(g.name ?? "Group"),
      is_featured: Boolean(g.is_featured),
    }))
  );
}

export async function fetchComposerStarterGroups(): Promise<StarterGroupBrief[]> {
  const res = await fetch("/api/mobilize/groups?scope=subgroups&visibility=public");
  const json = (await res.json()) as {
    groups?: {
      id: string;
      name: string;
      is_featured?: boolean;
      cover_image_url?: string | null;
      my_membership_status?: string | null;
    }[];
  };
  if (!res.ok) return [];
  const featured = (json.groups ?? []).filter((g) => Boolean(g.is_featured));
  return featured.slice(0, MOBILIZE_STARTER_GROUPS_LIMIT).map((g) => ({
    id: String(g.id),
    name: String(g.name ?? "Group"),
    cover_image_url: g.cover_image_url ?? null,
    my_membership_status: g.my_membership_status ?? null,
  }));
}