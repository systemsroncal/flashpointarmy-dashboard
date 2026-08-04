import { MobilizeContentShell } from "@/components/mobilize/MobilizeContentShell";
import { MobilizeNotificationsSoundWatcher } from "@/components/mobilize/MobilizeNotificationsSoundWatcher";
import { MobilizeToastProvider } from "@/components/mobilize/MobilizeToastProvider";
import { canAccessMobilizeModule, loadUserRoleNames } from "@/lib/auth/user-roles";
import { normalizeChaptersViewerRoles } from "@/lib/auth/dashboard-user";
import { requireServerUser } from "@/lib/auth/server-session";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default async function MobilizeLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await requireServerUser();
  const [roleNames, settingsRes] = await Promise.all([
    loadUserRoleNames(supabase, user.id),
    supabase.from("mobilize_policy_settings").select("chapters_viewer_roles").eq("id", 1).maybeSingle(),
  ]);
  const viewerRoles = normalizeChaptersViewerRoles(
    (settingsRes.data as { chapters_viewer_roles?: unknown } | null)?.chapters_viewer_roles
  );
  if (!canAccessMobilizeModule(roleNames, viewerRoles)) {
    redirect("/dashboard");
  }

  return (
    <MobilizeToastProvider>
      <MobilizeNotificationsSoundWatcher />
      <Suspense fallback={null}>
        <MobilizeContentShell>{children}</MobilizeContentShell>
      </Suspense>
    </MobilizeToastProvider>
  );
}
