import { NextResponse } from "next/server";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";
import { resolveMobilizeAuthors } from "@/lib/mobilize/social/resolve-authors";

export async function GET(req: Request) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();
  if (q.length < 2) {
    return NextResponse.json({ members: [], groups: [] });
  }

  const [{ data: profiles }, { data: groups }] = await Promise.all([
    auth.admin
      .from("profiles")
      .select("id, display_name, first_name, last_name")
      .or(`display_name.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%`)
      .limit(12),
    auth.admin
      .from("mobilize_groups")
      .select("id, name, group_type")
      .ilike("name", `%${q}%`)
      .limit(12),
  ]);

  const memberIds = (profiles ?? []).map((p) => p.id as string);
  const authors = await resolveMobilizeAuthors(auth.admin, memberIds);

  const members = memberIds
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
