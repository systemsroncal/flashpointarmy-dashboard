import { NextResponse } from "next/server";
import { loadUserRoleNames } from "@/lib/auth/user-roles";
import { applyMobilizeAutoCloseInactive } from "@/lib/mobilize/apply-auto-close";
import { enrichMobilizeGroupsBrowse } from "@/lib/mobilize/enrich-groups-browse";
import {
  canCreateMobilizeGroup,
  loadLocalLeaderVerified,
  loadMobilizeGroupCreatorPolicy,
} from "@/lib/mobilize/mobilize-roles";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";
import { syncEnrollmentWithListedVisibility } from "@/lib/mobilize/chapter-subgroup";
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
  const scope = (url.searchParams.get("scope") || "chapters").toLowerCase();

  if (parentId || scope === "subgroups") {
    await applyMobilizeAutoCloseInactive(auth.admin);
  }

  let query = auth.admin
    .from("mobilize_groups")
    .select(
      "id, name, group_type, description, address, latitude, longitude, visibility, event_create_policy, wall_post_policy, resources_post_policy, cover_image_url, profile_image_url, created_by, created_at, parent_group_id, schedule_meeting, enrollment_mode, last_activity_at, public_slug, is_featured, publish_status"
    )
    .order("created_at", { ascending: false });

  if (parentId) {
    // Own subgroups + featured groups (same row shown under every chapter).
    query = query.or(
      `parent_group_id.eq.${parentId},and(is_featured.eq.true,parent_group_id.not.is.null)`
    );
  } else if (scope === "subgroups") {
    query = query.not("parent_group_id", "is", null);
  } else {
    query = query.is("parent_group_id", null);
  }

  if (visibility === "public" || visibility === "private") {
    query = query.eq("visibility", visibility);
  }

  // Public browse/map: hide drafts. Dashboard lists use visibility=all and still see drafts.
  if (visibility !== "all") {
    query = query.eq("publish_status", "published");
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
  const parentInfoById = new Map<
    string,
    { name: string; latitude: number | null; longitude: number | null; address: string | null }
  >();
  if (scope === "subgroups" && rows.length) {
    const parentIds = [
      ...new Set(
        rows
          .map((g: { parent_group_id?: string | null }) => g.parent_group_id)
          .filter((id): id is string => typeof id === "string" && id.length > 0)
      ),
    ];
    if (parentIds.length) {
      const { data: parents } = await auth.admin
        .from("mobilize_groups")
        .select("id, name, latitude, longitude, address")
        .in("id", parentIds);
      for (const p of parents ?? []) {
        parentInfoById.set(p.id, {
          name: p.name,
          latitude: p.latitude,
          longitude: p.longitude,
          address: p.address,
        });
      }
    }
  }

  const extras = await enrichMobilizeGroupsBrowse(
    auth.admin,
    rows.map((g: { id: string }) => ({ id: g.id })),
    auth.userId
  );

  // Featured subgroups appear in every chapter's circle row, as if they were
  // created in all of them (browse list + map circles).
  let featuredBriefs: { id: string; name: string; cover_image_url: string | null; enrollment_mode: string }[] = [];
  if (scope === "chapters") {
    const { data: featuredRows } = await auth.admin
      .from("mobilize_groups")
      .select("id, name, cover_image_url, enrollment_mode, parent_group_id, created_at")
      .eq("is_featured", true)
      .eq("publish_status", "published")
      .not("parent_group_id", "is", null)
      .order("created_at", { ascending: true });
    featuredBriefs = (featuredRows ?? []).map((f) => ({
      id: f.id as string,
      name: f.name as string,
      cover_image_url: (f.cover_image_url as string | null) ?? null,
      enrollment_mode: String((f as { enrollment_mode?: string }).enrollment_mode ?? "request_to_join"),
    }));
  }

  const groups = rows.map((g: {
    id: string;
    parent_group_id?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    address?: string | null;
  }) => {
    const e = extras.get(g.id);
    const parentIdForRow = g.parent_group_id ?? null;
    const parent = parentIdForRow ? parentInfoById.get(parentIdForRow) : undefined;
    const effectiveLat = g.latitude ?? parent?.latitude ?? null;
    const effectiveLng = g.longitude ?? parent?.longitude ?? null;
    const ownSubgroups = e?.subgroups ?? [];
    return {
      ...g,
      latitude: effectiveLat,
      longitude: effectiveLng,
      address: g.address ?? parent?.address ?? null,
      parent_chapter_name: parent?.name ?? null,
      member_count: e?.member_count ?? 0,
      leader_names: e?.leader_names ?? [],
      leaders: e?.leaders ?? [],
      upcoming_activity_count: e?.upcoming_activity_count ?? 0,
      my_membership_status: e?.my_membership_status ?? null,
      subgroups:
        scope === "chapters" && featuredBriefs.length
          ? [...featuredBriefs, ...ownSubgroups].slice(0, 5)
          : ownSubgroups,
      subgroup_count:
        scope === "chapters" && featuredBriefs.length
          ? (e?.subgroup_count ?? ownSubgroups.length) + featuredBriefs.length
          : e?.subgroup_count ?? 0,
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
    is_featured?: boolean;
    profile_image_url?: string | null;
    publish_status?: string;
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

  const creatingChapter = parent_group_id == null;
  const localLeaderVerified = roleNames.includes("local_leader")
    ? await loadLocalLeaderVerified(auth.admin, auth.userId)
    : false;

  if (
    !canCreateMobilizeGroup(roleNames, policy, {
      creatingChapter,
      localLeaderVerified,
    })
  ) {
    return NextResponse.json(
      {
        error: creatingChapter
          ? "Only administrators can create Mobilize chapters."
          : "You are not allowed to create a Mobilize group. Ask a super admin to enable Local leaders or Verified Local leaders in Mobilize settings.",
      },
      { status: 403 }
    );
  }

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
  const profileImage =
    body.profile_image_url != null && String(body.profile_image_url).trim()
      ? String(body.profile_image_url).trim()
      : null;

  const enrollmentRaw = String(body.enrollment_mode ?? "").trim();
  let enrollment_mode =
    enrollmentRaw === "open_signup" ||
    enrollmentRaw === "closed" ||
    enrollmentRaw === "request_to_join"
      ? enrollmentRaw
      : visibility === "public"
        ? "open_signup"
        : "request_to_join";
  enrollment_mode = syncEnrollmentWithListedVisibility(visibility, enrollment_mode);

  const schedule_meeting =
    body.schedule_meeting != null && String(body.schedule_meeting).trim()
      ? String(body.schedule_meeting).trim()
      : null;

  const is_featured =
    parent_group_id && roleNames.includes("super_admin") && body.is_featured === true;
  const publish_status = body.publish_status === "draft" ? "draft" : "published";

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
    profile_image_url: profileImage,
    created_by: auth.userId,
    parent_group_id,
    schedule_meeting: parent_group_id ? schedule_meeting : null,
    enrollment_mode: parent_group_id ? enrollment_mode : "request_to_join",
    is_featured,
    publish_status,
    last_activity_at: new Date().toISOString(),
  };

  const { data, error } = await auth.admin.from("mobilize_groups").insert(row).select("*").single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ group: data });
}
