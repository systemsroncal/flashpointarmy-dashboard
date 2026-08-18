import { MobilizeContentShell } from "@/components/mobilize/MobilizeContentShell";
import { MobilizeNotificationsSoundWatcher } from "@/components/mobilize/MobilizeNotificationsSoundWatcher";
import { MobilizeToastProvider } from "@/components/mobilize/MobilizeToastProvider";
import { WelcomeVideoPopup } from "@/components/mobilize/WelcomeVideoPopup";
import { canAccessMobilizeModule, loadUserRoleNames } from "@/lib/auth/user-roles";
import {
  normalizeChaptersViewerRoles,
  normalizeChaptersViewerUserIds,
} from "@/lib/auth/dashboard-user";
import { requireServerUser } from "@/lib/auth/server-session";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default async function MobilizeLayout({ children }: { children: React.ReactNode }) {
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
  const viewerRoles = normalizeChaptersViewerRoles(row?.chapters_viewer_roles);
  const viewerUserIds = normalizeChaptersViewerUserIds(row?.chapters_viewer_user_ids);
  if (
    !canAccessMobilizeModule(roleNames, viewerRoles, {
      userId: user.id,
      viewerUserIds,
    })
  ) {
    redirect("/dashboard");
  }

  return (
    <MobilizeToastProvider>
      <MobilizeNotificationsSoundWatcher />
      <WelcomeVideoPopup />
      <Suspense fallback={null}>
        <MobilizeContentShell>{children}</MobilizeContentShell>
      </Suspense>
    </MobilizeToastProvider>
  );
}
