import { DataPaneFallback } from "@/components/dashboard/DataPaneFallback";
import { MissionBriefingLanding } from "@/components/dashboard/training/MissionBriefingLanding";
import { MODULE_SLUGS } from "@/config/modules";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { isElevatedRole, loadUserRoleNames } from "@/lib/auth/user-roles";
import { requireServerUser } from "@/lib/auth/server-session";
import {
  isMemberOnboardingAudience,
  loadMemberOnboardingSnapshot,
} from "@/lib/onboarding/member-onboarding-status";
import { loadBriefingVideoUrl, loadMissionBriefingProgress } from "@/lib/onboarding/mission-briefing";
import { can } from "@/types/permissions";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Paper, Typography } from "@mui/material";

async function MissionBriefingPageInner() {
  const { supabase, user } = await requireServerUser();
  const permissions = await loadModulePermissions(supabase, user.id);
  if (!can(permissions, MODULE_SLUGS.training, "read")) {
    return (
      <Paper sx={{ p: 3, bgcolor: "rgba(0,0,0,0.45)" }}>
        <Typography color="error">You do not have access to Training.</Typography>
      </Paper>
    );
  }

  const roleNames = await loadUserRoleNames(supabase, user.id);
  if (!isMemberOnboardingAudience(roleNames)) {
    redirect("/dashboard/training");
  }

  const snapshot = await loadMemberOnboardingSnapshot(supabase, user.id, roleNames);
  if (snapshot.training !== "completed") {
    return (
      <Paper sx={{ p: 3, bgcolor: "rgba(0,0,0,0.45)" }}>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
          Training incomplete
        </Typography>
        <Typography color="text.secondary">
          Complete Biblical Citizenship before watching your Mission Briefing.
        </Typography>
      </Paper>
    );
  }

  const [videoUrl, progress] = await Promise.all([
    loadBriefingVideoUrl(supabase),
    loadMissionBriefingProgress(supabase, user.id),
  ]);

  const envIntro = process.env.NEXT_PUBLIC_TRAINING_INTRO_VIDEO?.trim() ?? "";
  const { data: trainingRow } = await supabase
    .from("training_settings")
    .select("briefing_video_url")
    .eq("id", 1)
    .maybeSingle();
  const dbBriefing =
    typeof trainingRow?.briefing_video_url === "string" ? trainingRow.briefing_video_url.trim() : "";
  const elevated = isElevatedRole(roleNames);

  return (
    <MissionBriefingLanding
      videoUrl={videoUrl}
      initialPositionSeconds={progress?.video_position_seconds ?? 0}
      initialDurationSeconds={progress?.video_duration_seconds ?? null}
      briefingCompleted={snapshot.coachMeeting === "completed"}
      briefingVideoAdmin={
        elevated ? { initialDbUrl: dbBriefing, hasEnvFallback: Boolean(envIntro) } : null
      }
    />
  );
}

export default function MissionBriefingPageContent() {
  return (
    <Suspense fallback={<DataPaneFallback label="Loading Mission Briefing" />}>
      <MissionBriefingPageInner />
    </Suspense>
  );
}
