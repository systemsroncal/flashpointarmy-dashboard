import { NextResponse } from "next/server";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";
import { resolveMobilizeAuthors } from "@/lib/mobilize/social/resolve-authors";

type ProfileRow = {
  id: string;
  display_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  verified_at?: string | null;
};

function profileSearchBlob(row: ProfileRow): string {
  const parts = [row.display_name, row.first_name, row.last_name]
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter(Boolean);
  return parts.join(" ").toLowerCase().replace(/\s+/g, " ");
}

function scoreProfileMatch(row: ProfileRow, tokens: string[]): number {
  const blob = profileSearchBlob(row);
  if (!tokens.every((t) => blob.includes(t))) return -1;
  const dn = (row.display_name ?? "").trim().toLowerCase();
  const fn = (row.first_name ?? "").trim().toLowerCase();
  let score = row.verified_at ? 1000 : 0;
  for (const t of tokens) {
    if (dn.startsWith(t) || fn.startsWith(t)) score += 80;
    else if (dn.includes(t)) score += 40;
    else if (fn.includes(t)) score += 30;
    else score += 10;
  }
  return score;
}

export async function GET(req: Request) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const raw = (url.searchParams.get("q") ?? "").trim();
  const cleaned = raw
    .toLowerCase()
    .replace(/\.{2,}/g, " ")
    .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
  const tokens = cleaned
    .split(/\s+/)
    .map((t) => t.replace(/^['-]+|['-]+$/g, "").trim())
    .filter((t) => t.length >= 2);
  const primaryToken = tokens[0] ?? cleaned.replace(/\s+/g, "").slice(0, 64);
  const groupQuery = tokens.length ? tokens.join(" ") : primaryToken;

  if (primaryToken.length < 2) {
    return NextResponse.json({ members: [], groups: [] });
  }

  const [{ data: profileRows }, { data: dashboardRows }, { data: groups }] = await Promise.all([
    auth.admin
      .from("profiles")
      .select("id, display_name, first_name, last_name, verified_at")
      .or(
        `display_name.ilike.%${primaryToken}%,first_name.ilike.%${primaryToken}%,last_name.ilike.%${primaryToken}%`
      )
      .limit(40),
    auth.admin
      .from("dashboard_users")
      .select("id, display_name, first_name, last_name")
      .or(
        `display_name.ilike.%${primaryToken}%,first_name.ilike.%${primaryToken}%,last_name.ilike.%${primaryToken}%`
      )
      .limit(40),
    auth.admin.from("mobilize_groups").select("id, name, group_type").ilike("name", `%${groupQuery}%`).limit(12),
  ]);

  const merged = new Map<string, ProfileRow>();
  for (const row of profileRows ?? []) {
    merged.set(row.id as string, row as ProfileRow);
  }
  for (const row of dashboardRows ?? []) {
    const id = row.id as string;
    if (!merged.has(id)) {
      merged.set(id, { id, ...(row as object) } as ProfileRow);
    }
  }

  const rankedIds = [...merged.values()]
    .map((row) => ({ id: row.id, score: scoreProfileMatch(row, tokens.length ? tokens : [primaryToken]) }))
    .filter((r) => r.score >= 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map((r) => r.id);

  const authors = await resolveMobilizeAuthors(auth.admin, rankedIds, { viewerId: auth.userId });

  const members = rankedIds
    .map((id) => authors.get(id))
    .filter(Boolean)
    .map((m) => ({
      id: m!.id,
      display_name: m!.display_name,
      handle: m!.handle,
      avatar_url: m!.avatar_url,
      href: `/dashboard/mobilize/profile/${m!.id}`,
    }));

  const groupRows = (groups ?? []).map((g) => ({
    id: g.id as string,
    name: g.name as string,
    group_type: g.group_type as string,
    href: `/dashboard/mobilize/groups/${g.id as string}`,
  }));

  return NextResponse.json({ members, groups: groupRows });
}