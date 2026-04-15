import { CommandCenterBackdrop } from "@/components/dashboard/CommandCenterBackdrop";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { DashboardUserProvider } from "@/contexts/DashboardUserContext";
import { PermissionsProvider } from "@/contexts/PermissionsContext";
import { loadDashboardUser } from "@/lib/auth/dashboard-user";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [dashboardUser, permissions] = await Promise.all([
    loadDashboardUser(supabase, user.id),
    loadModulePermissions(supabase, user.id),
  ]);

  if (!dashboardUser) {
    redirect("/login");
  }

  return (
    <DashboardUserProvider user={dashboardUser}>
      <PermissionsProvider value={permissions}>
        <CommandCenterBackdrop>
          <DashboardShell>{children}</DashboardShell>
        </CommandCenterBackdrop>
      </PermissionsProvider>
    </DashboardUserProvider>
  );
}
