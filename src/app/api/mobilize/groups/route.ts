import { NextResponse } from "next/server";
import { loadUserRoleNames } from "@/lib/auth/user-roles";
import { applyMobilizeAutoCloseInactive } from "@/lib/mobilize/apply-auto-close";
import { enrichMobilizeGroupsBrowse } from "@/lib/mobilize/enrich-groups-browse";
import { canCreateMobilizeGroup, loadMobilizeGroupCreatorPolicy } from "@/lib/mobilize/mobilize-roles";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";
import { createClient } from "@/utils/supabase/server";

export async function GET(req: Request) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;
  const url = new URL(req.url);
  const visibility = (url.searchParams.get("visibility") || "public").toLowerCase();
  const q = (url.searchParams.get("q") || "").trim();
  const types = (url.searchParams.get("types") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const parentId = (url.searchParams.get("parent_id") || "").trim();

  if (parentId) {
    await applyMobilizeAutoCloseInactive(auth.admin);
  }

  let query = auth.admin
    .from("mobilize_groups")
    .select(
      "id, name, group_type, description, address, latitude, longitude, visibility, event_create_policy, wall_post_policy, resources_post_policy, cover_image_url, created_by, created_at, parent_group_id, schedule_meeting, enrollment_mode, last_activity_at, public_slug"
    )
    .order("created_at", { ascending: false });

  if (parentId) {
    query = query.eq("parent_group_id", parentId);
  } else {
    query = query.is("parent_group_id", null);
  }

  if (visibility === "public" || visibility === "private") {
    query = query.eq("visibility", visibility);
  }

  if (q) {
    query = query.ilike("name", `%${q}%`);
  }
  if (types.length) {
    query = query.in("group_type", types);
  }

  const { data, error } = await query.limit(200);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const rows = data ?? [];
  const extras = await enrichMobilizeGroupsBrowse(
    auth.admin,
    rows.map((g: { id: string }) => ({ id: g.id })),
    auth.userId
  );
  const groups = rows.map((g: { id: string }) => {
    const e = extras.get(g.id);
    return {
      ...g,
      member_count: e?.member_count ?? 0,
      leader_names: e?.leader_names ?? [],
      leaders: e?.leaders ?? [],
      upcoming_activity_count: e?.upcoming_activity_count ?? 0,
      my_membership_status: e?.my_membership_status ?? null,
      subgroups: e?.subgroups ?? [],
      subgroup_count: e?.subgroup_count ?? 0,
    };
  });
  return NextResponse.json({ groups });
}

export async function POST(req: Request) {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;

  const supabase = await createClient();
  const roleNames = await loadUserRoleNames(supabase, auth.userId);
  const policy = await loadMobilizeGroupCreatorPolicy(auth.admin);
  if (!canCreateMobilizeGroup(roleNames, policy)) {
    return NextResponse.json(
      {
        error:
          "You are not allowed to create a Mobilize group. Ask a super admin to enable your role in Mobilize settings.",
      },
      { status: 403 }
    );
  }

  const body = (await req.json()) as {
    name?: string;
    group_type?: string;
    description?: string | null;
    address?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    visibility?: string;
    event_create_policy?: string;
    cover_image_url?: string | null;
    wall_post_policy?: string;
    resources_post_policy?: string;
    parent_group_id?: string | null;
    schedule_meeting?: string | null;
    enrollment_mode?: string;
  };

  const name = String(body.name ?? "").trim();
  const group_type = String(body.group_type ?? "").trim() || "other";
  if (!name) {
    return NextResponse.json({ error: "name is required." }, { status: 400 });
  }

  const parent_group_id =
    body.parent_group_id != null && String(body.parent_group_id).trim()
      ? String(body.parent_group_id).trim()
      : null;

  if (parent_group_id) {
    const { data: parent } = await auth.admin
      .from("mobilize_groups")
      .select("id, parent_group_id")
      .eq("id", parent_group_id)
      .maybeSingle();
    if (!parent || parent.parent_group_id != null) {
      return NextResponse.json(
        { error: "parent_group_id must be a chapter (top-level group)." },
        { status: 400 }
      );
    }
  }

  const visibility =
    body.visibility === "private" ? "private" : "public";
  const event_create_policy =
    body.event_create_policy === "leader_only" ? "leader_only" : "any_member";
  const wall_post_policy =
    body.wall_post_policy === "leaders_only" ? "leaders_only" : "all_approved";
  const resources_post_policy =
    body.resources_post_policy === "leaders_only" ? "leaders_only" : "all_approved";
  const cover =
    body.cover_image_url != null && String(body.cover_image_url).trim()
      ? String(body.cover_image_url).trim()
      : null;

  const enrollmentRaw = String(body.enrollment_mode ?? "").trim();
  const enrollment_mode =
    enrollmentRaw === "open_signup" ||
    enrollmentRaw === "closed" ||
    enrollmentRaw === "request_to_join"
      ? enrollmentRaw
      : visibility === "public"
        ? "open_signup"
        : "request_to_join";

  const schedule_meeting =
    body.schedule_meeting != null && String(body.schedule_meeting).trim()
      ? String(body.schedule_meeting).trim()
      : null;

  const row = {
    name,
    group_type,
    description: body.description ?? null,
    address: body.address ?? null,
    latitude: body.latitude ?? null,
    longitude: body.longitude ?? null,
    visibility,
    event_create_policy,
    wall_post_policy,
    resources_post_policy,
    cover_image_url: cover,
    created_by: auth.userId,
    parent_group_id,
    schedule_meeting: parent_group_id ? schedule_meeting : null,
    enrollment_mode: parent_group_id ? enrollment_mode : "request_to_join",
    last_activity_at: new Date().toISOString(),
  };

  const { data, error } = await auth.admin.from("mobilize_groups").insert(row).select("*").single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ group: data });
}
