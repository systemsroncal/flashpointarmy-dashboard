import { MobilizeContentShell } from "@/components/mobilize/MobilizeContentShell";
import { MobilizeNotificationsSoundWatcher } from "@/components/mobilize/MobilizeNotificationsSoundWatcher";
import { MobilizeToastProvider } from "@/components/mobilize/MobilizeToastProvider";
import { canAccessMobilizeModule, loadUserRoleNames } from "@/lib/auth/user-roles";
import { requireServerUser } from "@/lib/auth/server-session";
import { redirect } from "next/navigation";

export default async function MobilizeLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await requireServerUser();
  const roleNames = await loadUserRoleNames(supabase, user.id);
  if (!canAccessMobilizeModule(roleNames)) {
    redirect("/dashboard");
  }

  return (
    <MobilizeToastProvider>
      <MobilizeNotificationsSoundWatcher />
      <MobilizeContentShell>{children}</MobilizeContentShell>
    </MobilizeToastProvider>
  );
}
