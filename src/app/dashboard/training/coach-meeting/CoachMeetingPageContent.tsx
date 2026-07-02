import { CoachMeetingBookingForm } from "@/components/dashboard/coach-meeting/CoachMeetingBookingForm";
import { DataPaneFallback } from "@/components/dashboard/DataPaneFallback";
import { MODULE_SLUGS } from "@/config/modules";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { isMemberOnboardingAudience, loadMemberOnboardingSnapshot } from "@/lib/onboarding/member-onboarding-status";
import { loadUserRoleNames } from "@/lib/auth/user-roles";
import { can } from "@/types/permissions";
import { requireServerUser } from "@/lib/auth/server-session";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Box, Paper, Typography } from "@mui/material";

async function CoachMeetingPageInner() {
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
  if (roleNames.includes("member") && !roleNames.includes("local_leader")) {
    redirect("/dashboard/training/mission-briefing");
  }

  const snapshot = await loadMemberOnboardingSnapshot(supabase, user.id, roleNames);
  if (snapshot.training !== "completed") {
    return (
      <Paper sx={{ p: 3, bgcolor: "rgba(0,0,0,0.45)" }}>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
          Training incomplete
        </Typography>
        <Typography color="text.secondary">
          Complete Biblical Citizenship before scheduling your coach meeting or onboarding call.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <CoachMeetingBookingForm audience={snapshot.rankAudience} />
    </Box>
  );
}

export default function CoachMeetingPageContent() {
  return (
    <Suspense fallback={<DataPaneFallback label="Loading booking" />}>
      <CoachMeetingPageInner />
    </Suspense>
  );
}
