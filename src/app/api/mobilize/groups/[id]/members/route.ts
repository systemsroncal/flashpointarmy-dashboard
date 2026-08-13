import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { insertGroupJoinActivity } from "@/lib/community/group-activity-feed";
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
 * Body: { userIds?: string[], emails?: string[], userId?: string, member_role?: "member" | "leader" }
 *
 * Group leaders, the group owner, the parent chapter owner, and site staff
 * (admin / super_admin) may add dashboard users directly — one at a time or in
 * bulk, by user id and/or comma-separated emails. Added rows are inserted (or
 * upgraded) with membership_status = "approved", avoiding the self-join RLS
 * path which only allows pending self-inserts. Users who are already approved
 * members and emails that match no dashboard user are skipped and reported.
 */
export async function POST(req: Request, ctx: Ctx) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;
  const { id } = await ctx.params;

  const body = (await req.json().catch(() => null)) as
    | {
        userId?: unknown;
        userIds?: unknown;
        emails?: unknown;
        member_role?: unknown;
      }
    | null;

  const requestedRole = body?.member_role === "leader" ? "leader" : "member";

  const userIds = [
    ...(typeof body?.userId === "string" && body.userId.trim()
      ? [body.userId.trim()]
      : []),
    ...(Array.isArray(body?.userIds)
      ? body.userIds
          .filter((x): x is string => typeof x === "string")
          .map((x) => x.trim())
          .filter(Boolean)
      : []),
  ];

  const emails = [
    ...new Set(
      (Array.isArray(body?.emails)
        ? body.emails
        : typeof body?.emails === "string"
          ? body.emails.split(",")
          : []
      )
        .map((e) => String(e).trim().toLowerCase())
        .filter((e) => e.length > 0)
    ),
  ];

  if (!userIds.length && !emails.length) {
    return NextResponse.json(
      { error: "Provide at least one userId or email." },
      { status: 400 }
    );
  }

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

  // Resolve emails to dashboard user ids (case-insensitive, trimmed).
  const emailToId = new Map<string, string>();
  if (emails.length) {
    const { data: duRows } = await auth.admin
      .from("dashboard_users")
      .select("id, email")
      .in("email", emails);
    for (const row of duRows ?? []) {
      const em = String((row as { email: string }).email ?? "").trim().toLowerCase();
      if (em) emailToId.set(em, (row as { id: string }).id);
    }
  }
  const notFoundEmails = emails.filter((e) => !emailToId.has(e));
  const resolvedUserIds = [
    ...new Set([
      ...userIds,
      ...emails
        .map((e) => emailToId.get(e))
        .filter((x): x is string => typeof x === "string"),
    ]),
  ];

  const addedRows: Record<string, unknown>[] = [];
  const alreadyMember: string[] = [];
  const failed: { id: string; error: string }[] = [];

  for (const uid of resolvedUserIds) {
    const result = await upsertApprovedGroupMember(
      auth.admin,
      id,
      group.created_by,
      uid,
      requestedRole
    );
    if (result.status === "added" && result.row) {
      addedRows.push(result.row);
    } else if (result.status === "already_member") {
      alreadyMember.push(uid);
    } else if (result.status === "error") {
      failed.push({ id: uid, error: result.error });
    }
  }

  if (addedRows.length) {
    await auth.admin
      .from("mobilize_groups")
      .update({ last_activity_at: new Date().toISOString() })
      .eq("id", id);
    await Promise.all(
      addedRows.map((row) => {
        const uid = String((row as { user_id?: string }).user_id ?? "");
        if (!uid) return Promise.resolve();
        return insertGroupJoinActivity({
          supabase: auth.admin,
          userId: uid,
          groupId: id,
        });
      })
    );
  }

  return NextResponse.json({
    added: addedRows.length,
    members: addedRows,
    alreadyMember,
    notFound: notFoundEmails,
    failed,
  });
}

/** Insert (or upgrade to approved) one member row. */
async function upsertApprovedGroupMember(
  admin: SupabaseClient,
  groupId: string,
  groupOwnerId: string,
  userId: string,
  requestedRole: "member" | "leader"
): Promise<
  | { status: "added"; row: Record<string, unknown> | null }
  | { status: "already_member" }
  | { status: "error"; error: string }
> {
  // The primary owner always stays a leader.
  const targetRole = userId === groupOwnerId ? "leader" : requestedRole;

  const { data: existing } = await admin
    .from("mobilize_group_members")
    .select("id, membership_status, member_role")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    if (existing.membership_status === "approved" && existing.member_role === targetRole) {
      return { status: "already_member" };
    }
    const { data, error } = await admin
      .from("mobilize_group_members")
      .update({ membership_status: "approved", member_role: targetRole })
      .eq("id", existing.id)
      .select("*")
      .maybeSingle();
    if (error) return { status: "error", error: error.message };
    return { status: "added", row: data };
  }

  const { data: inserted, error: insErr } = await admin
    .from("mobilize_group_members")
    .insert({
      group_id: groupId,
      user_id: userId,
      member_role: targetRole,
      membership_status: "approved",
    })
    .select("*")
    .maybeSingle();
  if (insErr) return { status: "error", error: insErr.message };
  return { status: "added", row: inserted };
}
