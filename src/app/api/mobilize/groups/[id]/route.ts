import { loadUserRoleNames } from "@/lib/auth/user-roles";
import { applyMobilizeGroupOwnerAndLeaders } from "@/lib/mobilize/sync-group-leaders";
import { NextResponse } from "next/server";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;
  const { id } = await ctx.params;

  const { data: group, error: gErr } = await auth.admin
    .from("mobilize_groups")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (gErr || !group) {
    return NextResponse.json({ error: "Group not found." }, { status: 404 });
  }

  if (group.visibility !== "public") {
    const { data: m } = await auth.admin
      .from("mobilize_group_members")
      .select("membership_status")
      .eq("group_id", id)
      .eq("user_id", auth.userId)
      .maybeSingle();
    const allowed =
      group.created_by === auth.userId || m?.membership_status === "approved";
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }
  }

  const { data: myMembership } = await auth.admin
    .from("mobilize_group_members")
    .select("*")
    .eq("group_id", id)
    .eq("user_id", auth.userId)
    .maybeSingle();

  return NextResponse.json({ group, membership: myMembership ?? null });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;
  const { id } = await ctx.params;

  const { data: group } = await auth.admin.from("mobilize_groups").select("created_by").eq("id", id).maybeSingle();
  if (!group) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const roleNames = await loadUserRoleNames(auth.admin, auth.userId);
  const isSuperAdmin = roleNames.includes("super_admin");

  const { data: leader } = await auth.admin
    .from("mobilize_group_members")
    .select("member_role")
    .eq("group_id", id)
    .eq("user_id", auth.userId)
    .eq("membership_status", "approved")
    .maybeSingle();

  const isLeader = leader?.member_role === "leader";
  const isCreator = group.created_by === auth.userId;
  if (!isLeader && !isCreator && !isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const body = (await req.json()) as Record<string, unknown>;
  const patch: Record<string, unknown> = {};
  const allowed = [
    "name",
    "group_type",
    "description",
    "address",
    "latitude",
    "longitude",
    "visibility",
    "event_create_policy",
    "cover_image_url",
    "wall_post_policy",
  ] as const;
  for (const k of allowed) {
    if (k in body) patch[k] = body[k];
  }

  const leaderUserIdsRaw = body.leader_user_ids;
  const leaderUserIds = Array.isArray(leaderUserIdsRaw)
    ? leaderUserIdsRaw.filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    : undefined;

  const newOwnerId =
    isSuperAdmin && typeof body.created_by === "string" && body.created_by.trim()
      ? body.created_by.trim()
      : undefined;

  let ownershipSynced = false;
  if (isSuperAdmin && (newOwnerId || leaderUserIds?.length)) {
    if (newOwnerId) patch.created_by = newOwnerId;
    const withPrimary = new Set(leaderUserIds ?? []);
    if (newOwnerId) withPrimary.add(newOwnerId);
    try {
      await applyMobilizeGroupOwnerAndLeaders(auth.admin, id, {
        previousCreatedBy: String(group.created_by),
        newCreatedBy: newOwnerId,
        leaderUserIds: [...withPrimary],
      });
      ownershipSynced = true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to sync group administrators.";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  }
  if ("wall_post_policy" in patch) {
    patch.wall_post_policy =
      patch.wall_post_policy === "leaders_only" ? "leaders_only" : "all_approved";
  }
  if ("cover_image_url" in patch) {
    const u = patch.cover_image_url;
    patch.cover_image_url =
      u == null || String(u).trim() === "" ? null : String(u).trim();
  }
  if (Object.keys(patch).length === 0) {
    if (!ownershipSynced) {
      return NextResponse.json({ error: "No valid fields." }, { status: 400 });
    }
    const { data, error: fetchErr } = await auth.admin
      .from("mobilize_groups")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (fetchErr || !data) {
      return NextResponse.json({ error: fetchErr?.message ?? "Not found." }, { status: 500 });
    }
    return NextResponse.json({ group: data });
  }

  const { data, error } = await auth.admin.from("mobilize_groups").update(patch).eq("id", id).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ group: data });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;
  const { id } = await ctx.params;

  const { data: group } = await auth.admin.from("mobilize_groups").select("created_by").eq("id", id).maybeSingle();
  if (!group) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (group.created_by !== auth.userId) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { error } = await auth.admin.from("mobilize_groups").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
