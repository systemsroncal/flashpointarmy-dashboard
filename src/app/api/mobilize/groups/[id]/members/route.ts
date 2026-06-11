import { NextResponse } from "next/server";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";

type Ctx = { params: Promise<{ id: string }> };

function normalizeStateCode(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  if (/^[A-Za-z]{2}$/.test(t)) return t.toUpperCase();
  return t;
}

export async function GET(_req: Request, ctx: Ctx) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;
  const { id } = await ctx.params;

  const { data: me } = await auth.admin
    .from("mobilize_group_members")
    .select("membership_status")
    .eq("group_id", id)
    .eq("user_id", auth.userId)
    .maybeSingle();

  if (!me || me.membership_status !== "approved") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { data: rows, error } = await auth.admin
    .from("mobilize_group_members")
    .select("id, user_id, member_role, membership_status, created_at")
    .eq("group_id", id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const userIds = [...new Set((rows ?? []).map((r: { user_id: string }) => r.user_id))];
  const duById = new Map<
    string,
    {
      display_name: string | null;
      email: string | null;
      phone: string | null;
      state: string | null;
      primary_chapter_id: string | null;
    }
  >();
  const prById = new Map<string, { avatar_url: string | null; state: string | null; phone: string | null }>();

  if (userIds.length) {
    const { data: du } = await auth.admin
      .from("dashboard_users")
      .select("id, display_name, email, phone, state, primary_chapter_id")
      .in("id", userIds);
    for (const u of du ?? []) {
      duById.set(u.id as string, {
        display_name: (u as { display_name?: string | null }).display_name ?? null,
        email: (u as { email?: string | null }).email ?? null,
        phone: (u as { phone?: string | null }).phone ?? null,
        state: (u as { state?: string | null }).state ?? null,
        primary_chapter_id: (u as { primary_chapter_id?: string | null }).primary_chapter_id ?? null,
      });
    }
    const { data: pr } = await auth.admin
      .from("profiles")
      .select("id, avatar_url, state, phone")
      .in("id", userIds);
    for (const p of pr ?? []) {
      prById.set(p.id as string, {
        avatar_url: (p as { avatar_url?: string | null }).avatar_url ?? null,
        state: (p as { state?: string | null }).state ?? null,
        phone: (p as { phone?: string | null }).phone ?? null,
      });
    }
  }

  const chapterIds = [
    ...new Set(
      [...duById.values()]
        .map((d) => d.primary_chapter_id)
        .filter((cid): cid is string => typeof cid === "string" && cid.length > 0)
    ),
  ];
  const chapterStateById = new Map<string, string | null>();
  if (chapterIds.length) {
    const { data: chapters } = await auth.admin.from("chapters").select("id, state").in("id", chapterIds);
    for (const c of chapters ?? []) {
      const st = (c as { state?: string | null }).state;
      chapterStateById.set(c.id as string, st != null ? String(st).trim() || null : null);
    }
  }

  const members = (rows ?? []).map((m: { user_id: string; id: string; member_role: string; membership_status: string; created_at: string }) => {
    const du = duById.get(m.user_id);
    const pr = prById.get(m.user_id);
    const fromProfile = normalizeStateCode(pr?.state ?? "") ?? "";
    const fromUser = normalizeStateCode(du?.state ?? "") ?? "";
    const chapId = du?.primary_chapter_id;
    const fromChapter =
      chapId != null ? normalizeStateCode(chapterStateById.get(chapId) ?? "") ?? "" : "";
    const st = (fromProfile || fromUser || fromChapter || "").trim() || null;
    const dn = (du?.display_name ?? "").trim();
    const em = (du?.email ?? "").trim();
    const ph = (pr?.phone ?? du?.phone ?? "").trim();
    return {
      ...m,
      display_name: dn || em || m.user_id.slice(0, 8),
      email: em || null,
      phone: ph || null,
      member_since: m.created_at,
      avatar_url: pr?.avatar_url ?? null,
      state: st,
    };
  });

  return NextResponse.json({ members });
}
