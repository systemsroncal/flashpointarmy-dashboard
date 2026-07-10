import { MissionsLanding } from "@/components/dashboard/missions/MissionsLanding";
import { MODULE_SLUGS } from "@/config/modules";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { isElevatedRole, loadUserRoleNames } from "@/lib/auth/user-roles";
import { requireServerUser } from "@/lib/auth/server-session";
import {
  isMemberOnboardingAudience,
  loadMemberOnboardingSnapshot,
} from "@/lib/onboarding/member-onboarding-status";
import { loadJourneyMilestones } from "@/lib/onboarding/journey-milestones";
import { can } from "@/types/permissions";

export default async function MissionsPage() {
  const { supabase, user } = await requireServerUser();
  const permissions = await loadModulePermissions(supabase, user.id);
  const roleNames = await loadUserRoleNames(supabase, user.id);
  const onboardingAudience = isMemberOnboardingAudience(roleNames);

  let missionLinksEnabled = true;
  let showWelcome = false;

  if (onboardingAudience && can(permissions, MODULE_SLUGS.training, "read")) {
    const [snapshot, milestones] = await Promise.all([
      loadMemberOnboardingSnapshot(supabase, user.id, roleNames),
      loadJourneyMilestones(supabase, user.id),
    ]);
    missionLinksEnabled = snapshot.firstMission !== "locked";
    // Welcome marks "started"; hide once started. Completed will be wired in a later phase.
    const missionsAlreadyStarted =
      snapshot.firstMission === "in_progress" ||
      snapshot.firstMission === "completed" ||
      Boolean(milestones?.missions_started_notified_at);
    showWelcome = !missionsAlreadyStarted;
  } else if (!isElevatedRole(roleNames) && !can(permissions, MODULE_SLUGS.training, "read")) {
    missionLinksEnabled = false;
  }

  return (
    <MissionsLanding missionLinksEnabled={missionLinksEnabled} showWelcome={showWelcome} />
  );
}
