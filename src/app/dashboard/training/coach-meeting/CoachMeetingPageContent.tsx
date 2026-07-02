import { DataPaneFallback } from "@/components/dashboard/DataPaneFallback";
import { MODULE_SLUGS } from "@/config/modules";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { isMemberOnboardingAudience } from "@/lib/onboarding/member-onboarding-status";
import { loadUserRoleNames } from "@/lib/auth/user-roles";
import { can } from "@/types/permissions";
import { requireServerUser } from "@/lib/auth/server-session";
import { redirect } from "next/navigation";
import { Suspense } from "react";

async function CoachMeetingPageInner() {
  const { supabase, user } = await requireServerUser();
  const permissions = await loadModulePermissions(supabase, user.id);
  if (!can(permissions, MODULE_SLUGS.training, "read")) {
    redirect("/dashboard/training");
  }

  const roleNames = await loadUserRoleNames(supabase, user.id);
  if (isMemberOnboardingAudience(roleNames)) {
    redirect("/dashboard/training/mission-briefing");
  }

  redirect("/dashboard/training");
  return null;
}

export default function CoachMeetingPageContent() {
  return (
    <Suspense fallback={<DataPaneFallback label="Loading" />}>
      <CoachMeetingPageInner />
    </Suspense>
  );
}
