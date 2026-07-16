import { notFound } from "next/navigation";
import {
  PublicGroupProfileView,
  type PublicGroupProfileData,
} from "@/components/mobilize/public/PublicGroupProfileView";
import { applyMobilizeAutoCloseInactive } from "@/lib/mobilize/apply-auto-close";
import { createAdminClient } from "@/utils/supabase/admin";

type Props = { params: Promise<{ id: string }> };

export default async function PublicMobilizeGroupPage({ params }: Props) {
  const { id } = await params;
  const admin = createAdminClient();

  await applyMobilizeAutoCloseInactive(admin, [id]);

  const groupSelect =
    "id, name, description, address, schedule_meeting, enrollment_mode, cover_image_url, parent_group_id, public_slug, visibility, created_by, region_code";

  let { data: group } = await admin.from("mobilize_groups").select(groupSelect).eq("id", id).maybeSingle();

  if (!group) {
    const bySlug = await admin.from("mobilize_groups").select(groupSelect).eq("public_slug", id).maybeSingle();
    group = bySlug.data;
  }

  if (!group || group.parent_group_id == null) {
    notFound();
  }

  let parentChapterName: string | null = null;
  if (group.parent_group_id) {
    const { data: parent } = await admin
      .from("mobilize_groups")
      .select("name")
      .eq("id", group.parent_group_id)
      .maybeSingle();
    parentChapterName = parent?.name ?? null;
  }

  const { data: leaderRows } = await admin
    .from("mobilize_group_members")
    .select("user_id")
    .eq("group_id", group.id)
    .eq("member_role", "leader")
    .eq("membership_status", "approved")
    .limit(5);

  const leaderIds = [
    ...new Set(
      [
        ...(leaderRows ?? []).map((r) => r.user_id as string),
        group.created_by ? String(group.created_by) : null,
      ].filter((x): x is string => Boolean(x))
    ),
  ];

  let leaderName: string | null = null;
  let leaderEmail: string | null = null;
  if (leaderIds.length) {
    const [{ data: duRows }, { data: profRows }] = await Promise.all([
      admin
        .from("dashboard_users")
        .select("id, first_name, last_name, display_name, email")
        .in("id", leaderIds),
      admin.from("profiles").select("id, first_name, last_name, display_name").in("id", leaderIds),
    ]);
    const primaryId = leaderIds[0]!;
    const du = (duRows ?? []).find((r) => r.id === primaryId) as
      | {
          first_name?: string | null;
          last_name?: string | null;
          display_name?: string | null;
          email?: string | null;
        }
      | undefined;
    const pr = (profRows ?? []).find((r) => r.id === primaryId) as
      | {
          first_name?: string | null;
          last_name?: string | null;
          display_name?: string | null;
        }
      | undefined;
    const first = (du?.first_name ?? pr?.first_name ?? "").trim();
    const last = (du?.last_name ?? pr?.last_name ?? "").trim();
    const both = [first, last].filter(Boolean).join(" ");
    leaderName = both || (du?.display_name ?? pr?.display_name ?? null);
    leaderEmail = du?.email ?? null;
  }

  const nowIso = new Date().toISOString();
  const [{ data: upcoming }, { data: past }] = await Promise.all([
    admin
      .from("mobilize_events")
      .select("id, title, description, date_time, event_type, is_public, address")
      .eq("group_id", group.id)
      .eq("is_public", true)
      .gte("date_time", nowIso)
      .order("date_time", { ascending: true })
      .limit(8),
    admin
      .from("mobilize_events")
      .select("id, title, description, date_time, event_type, is_public, address")
      .eq("group_id", group.id)
      .eq("is_public", true)
      .lt("date_time", nowIso)
      .order("date_time", { ascending: false })
      .limit(8),
  ]);

  const profile: PublicGroupProfileData = {
    id: group.id,
    name: group.name,
    description: group.description,
    address: group.address,
    schedule_meeting: group.schedule_meeting,
    enrollment_mode: group.enrollment_mode,
    cover_image_url: group.cover_image_url,
    parent_chapter_name: parentChapterName,
    region_code: group.region_code ?? null,
    leaderName,
    leaderEmail,
    upcoming: (upcoming ?? []) as PublicGroupProfileData["upcoming"],
    past: (past ?? []) as PublicGroupProfileData["past"],
  };

  return <PublicGroupProfileView group={profile} />;
}
