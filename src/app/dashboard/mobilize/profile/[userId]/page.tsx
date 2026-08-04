import { MobilizeMemberProfileClient } from "@/components/mobilize/social/MobilizeMemberProfileClient";
import { requireServerUser } from "@/lib/auth/server-session";
import { canAccessMobilizeModule, loadUserRoleNames } from "@/lib/auth/user-roles";
import {
  normalizeChaptersViewerRoles,
  normalizeChaptersViewerUserIds,
} from "@/lib/auth/dashboard-user";
import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ from?: string; groupId?: string }>;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function MobilizeMemberProfilePage({ params, searchParams }: Props) {
  const { userId } = await params;
  const sp = await searchParams;

  if (!UUID_RE.test(userId)) {
    redirect("/dashboard/mobilize/my-groups");
  }

  const { supabase, user } = await requireServerUser();
  const [roleNames, settingsRes] = await Promise.all([
    loadUserRoleNames(supabase, user.id),
    supabase
      .from("mobilize_policy_settings")
      .select("chapters_viewer_roles, chapters_viewer_user_ids")
      .eq("id", 1)
      .maybeSingle(),
  ]);
  const row = settingsRes.data as {
    chapters_viewer_roles?: unknown;
    chapters_viewer_user_ids?: unknown;
  } | null;
  if (
    !canAccessMobilizeModule(roleNames, normalizeChaptersViewerRoles(row?.chapters_viewer_roles), {
      userId: user.id,
      viewerUserIds: normalizeChaptersViewerUserIds(row?.chapters_viewer_user_ids),
    })
  ) {
    redirect("/dashboard");
  }

  const backHref =
    sp.from === "group" && sp.groupId
      ? `/dashboard/mobilize/groups/${sp.groupId}?tab=members`
      : sp.from === "group"
        ? "/dashboard/mobilize/my-groups"
        : sp.from?.startsWith("/")
          ? sp.from
          : "/dashboard/mobilize/home";

  return <MobilizeMemberProfileClient userId={userId} backHref={backHref} />;
}
