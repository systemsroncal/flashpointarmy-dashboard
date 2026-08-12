import { NextResponse } from "next/server";
import { loadTrainingGraduateBadgesForUsers } from "@/lib/courses/course-completion";
import { canManageMobilizeGroupMembers, isMobilizeSuperAdmin } from "@/lib/mobilize/mobilize-content-access";
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

  if (!isMobilizeSuperAdmin(auth.roleNames) && (!me || me.membership_status !== "approved")) {
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

  const graduateBadges = await loadTrainingGraduateBadgesForUsers(auth.admin, userIds);

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
      training_graduate_badge: graduateBadges.get(m.user_id) ?? null,
    };
  });

  return NextResponse.json({ members });
}

/**
 * POST /api/mobilize/groups/[id]/members
 * Body: { userId: string, member_role?: "member" | "leader" }
 *
 * Group leaders, the group owner, the parent chapter owner, and site staff
 * (admin / super_admin) may add a dashboard user directly. The added row is
 * inserted (or upgraded) with membership_status = "approved", avoiding the
 * self-join RLS path which only allows pending self-inserts.
 */
export async function POST(req: Request, ctx: Ctx) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;
  const { id } = await ctx.params;

  const body = (await req.json().catch(() => null)) as
    | { userId?: unknown; member_role?: unknown }
    | null;
  const userId = typeof body?.userId === "string" ? body.userId.trim() : "";
  if (!userId) {
    return NextResponse.json({ error: "userId is required." }, { status: 400 });
  }
  const requestedRole =
    body?.member_role === "leader"
      ? "leader"
      : body?.member_role === "member"
        ? "member"
        : "member";

  const { data: group, error: gErr } = await auth.admin
    .from("mobilize_groups")
    .select("id, created_by, parent_group_id")
    .eq("id", id)
    .maybeSingle();
  if (gErr || !group) {
    return NextResponse.json({ error: "Group not found." }, { status: 404 });
  }

  const { data: meMember } = await auth.admin
    .from("mobilize_group_members")
    .select("member_role, membership_status")
    .eq("group_id", id)
    .eq("user_id", auth.userId)
    .maybeSingle();
  const isApprovedLeader =
    meMember?.membership_status === "approved" && meMember?.member_role === "leader";
  const isGroupOwner = group.created_by === auth.userId;

  let isChapterOwner = false;
  if (group.parent_group_id) {
    const { data: chapter } = await auth.admin
      .from("mobilize_groups")
      .select("created_by")
      .eq("id", group.parent_group_id)
      .maybeSingle();
    isChapterOwner = chapter?.created_by === auth.userId;
  }

  const allowed = canManageMobilizeGroupMembers({
    roleNames: auth.roleNames,
    isLeader: isApprovedLeader,
    isGroupOwner,
    isChapterOwner,
  });
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const targetRole = requestedRole === "leader" ? "leader" : "member";

  const { data: existing } = await auth.admin
    .from("mobilize_group_members")
    .select("id, membership_status, member_role")
    .eq("group_id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    if (existing.membership_status === "approved" && existing.member_role === targetRole) {
      return NextResponse.json(
        { error: "User is already a member of this group." },
        { status: 400 }
      );
    }
    const { data, error } = await auth.admin
      .from("mobilize_group_members")
      .update({ membership_status: "approved", member_role: targetRole })
      .eq("id", existing.id)
      .select("*")
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Member row not found." }, { status: 404 });

    // Avoid downgrading an approved leader to member if they're the primary group owner.
    if (targetRole === "member" && userId === group.created_by) {
      return NextResponse.json(
        {
          membership: data,
          warning: "Primary owner role kept as leader.",
        },
        { status: 200 }
      );
    }

    await auth.admin
      .from("mobilize_groups")
      .update({ last_activity_at: new Date().toISOString() })
      .eq("id", id);
    return NextResponse.json({ membership: data });
  }

  const { data: inserted, error: insErr } = await auth.admin
    .from("mobilize_group_members")
    .insert({
      group_id: id,
      user_id: userId,
      member_role: userId === group.created_by ? "leader" : targetRole,
      membership_status: "approved",
    })
    .select("*")
    .maybeSingle();
  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
  if (!inserted) return NextResponse.json({ error: "Insert failed." }, { status: 500 });

  await auth.admin
    .from("mobilize_groups")
    .update({ last_activity_at: new Date().toISOString() })
    .eq("id", id);

  return NextResponse.json({ membership: inserted });
}
