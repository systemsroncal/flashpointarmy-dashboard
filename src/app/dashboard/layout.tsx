import { CommandCenterBackdrop } from "@/components/dashboard/CommandCenterBackdrop";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { DashboardUserProvider } from "@/contexts/DashboardUserContext";
import { PermissionsProvider } from "@/contexts/PermissionsContext";
import { loadDashboardUser } from "@/lib/auth/dashboard-user";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { loadTrainingGraduateBadge } from "@/lib/courses/course-completion";
import {
  isMemberOnboardingAudience,
  loadMemberOnboardingSnapshot,
} from "@/lib/onboarding/member-onboarding-status";
import {
  ensureDashboardUserMirror,
  ensureMemberRoleIfUserHasNoRoles,
} from "@/lib/import/dashboard-user-mirror";
import { createAdminClient, hasSupabaseAdminEnv } from "@/utils/supabase/admin";
import { getServerAuth } from "@/lib/auth/server-session";
import { redirect } from "next/navigation";

/** Authenticated area: always render on request (cookies + admin mirror); avoids brittle static prerender. */
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { supabase, user, staleSessionCleared } = await getServerAuth();

  if (!user) {
    redirect(staleSessionCleared ? "/login?reason=session_expired" : "/login");
  }

  let dashboardUser = await loadDashboardUser(supabase, user.id);

  /** Auth session can exist without `dashboard_users` (trigger skipped / legacy user). That used to redirect to /login and felt like a logout. */
  if (!dashboardUser) {
    const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
    const fn = String(meta.first_name ?? "").trim();
    const ln = String(meta.last_name ?? "").trim();
    const email = user.email?.trim() || "";
    if (!email) {
      redirect("/login");
    }
    const fallbackName = email.split("@")[0] || "User";
    const displayName = [fn, ln].filter(Boolean).join(" ").trim() || fallbackName;
    const chapterRaw = meta.primary_chapter_id;
    const primaryChapterId =
      typeof chapterRaw === "string" && chapterRaw.length >= 32 ? chapterRaw : null;
    const phoneRaw = meta.phone;
    const phone = typeof phoneRaw === "string" ? phoneRaw : null;

    if (!hasSupabaseAdminEnv()) {
      redirect("/login");
    }
    const admin = createAdminClient();
    const mirror = await ensureDashboardUserMirror(admin, {
      id: user.id,
      email,
      firstName: fn || fallbackName,
      lastName: ln,
      displayName,
      primaryChapterId,
      phone,
      mailing: null,
    });
    if (mirror.error) {
      redirect("/login");
    }
    await ensureMemberRoleIfUserHasNoRoles(admin, user.id);
    dashboardUser = await loadDashboardUser(supabase, user.id);
  }

  if (dashboardUser && dashboardUser.role_names.length === 0) {
    if (!hasSupabaseAdminEnv()) {
      redirect("/login");
    }
    const admin = createAdminClient();
    await ensureMemberRoleIfUserHasNoRoles(admin, user.id);
    dashboardUser = await loadDashboardUser(supabase, user.id);
  }

  if (!dashboardUser) {
    redirect("/login");
  }

  const permissions = await loadModulePermissions(supabase, user.id);

  let trainingGraduateBadge: Awaited<ReturnType<typeof loadTrainingGraduateBadge>> = null;
  let memberOnboarding: Awaited<ReturnType<typeof loadMemberOnboardingSnapshot>> | null = null;
  try {
    trainingGraduateBadge = await loadTrainingGraduateBadge(
      supabase,
      dashboardUser.id,
      dashboardUser.role_names
    );
  } catch {
    /* Badge is optional — never block dashboard render if course tables are unavailable. */
  }
  if (isMemberOnboardingAudience(dashboardUser.role_names)) {
    try {
      memberOnboarding = await loadMemberOnboardingSnapshot(
        supabase,
        dashboardUser.id,
        dashboardUser.role_names
      );
    } catch {
      memberOnboarding = null;
    }
  }
  dashboardUser = {
    ...dashboardUser,
    training_graduate_badge: trainingGraduateBadge,
    member_onboarding: memberOnboarding,
  };

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
