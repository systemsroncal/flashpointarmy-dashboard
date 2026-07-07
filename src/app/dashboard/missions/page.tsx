import { MissionsLanding } from "@/components/dashboard/missions/MissionsLanding";
import { MODULE_SLUGS } from "@/config/modules";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { isElevatedRole, loadUserRoleNames } from "@/lib/auth/user-roles";
import { requireServerUser } from "@/lib/auth/server-session";
import {
  isMemberOnboardingAudience,
  loadMemberOnboardingSnapshot,
} from "@/lib/onboarding/member-onboarding-status";
import { can } from "@/types/permissions";

export default async function MissionsPage() {
  const { supabase, user } = await requireServerUser();
  const permissions = await loadModulePermissions(supabase, user.id);
  const roleNames = await loadUserRoleNames(supabase, user.id);
  const onboardingAudience = isMemberOnboardingAudience(roleNames);

  let missionLinksEnabled = true;

  if (onboardingAudience && can(permissions, MODULE_SLUGS.training, "read")) {
    const snapshot = await loadMemberOnboardingSnapshot(supabase, user.id, roleNames);
    missionLinksEnabled = snapshot.firstMission !== "locked";
  } else if (!isElevatedRole(roleNames) && !can(permissions, MODULE_SLUGS.training, "read")) {
    missionLinksEnabled = false;
  }

  return <MissionsLanding missionLinksEnabled={missionLinksEnabled} />;
}
