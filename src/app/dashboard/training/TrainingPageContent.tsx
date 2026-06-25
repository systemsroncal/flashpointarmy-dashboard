import { TrainingCommandLanding } from "@/components/dashboard/training/TrainingCommandLanding";
import { MODULE_SLUGS } from "@/config/modules";
import { isElevatedRole, loadUserRoleNames } from "@/lib/auth/user-roles";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { shouldShowExternalCertificatePrompt } from "@/lib/training/certificate-requests";
import { can } from "@/types/permissions";
import { requireServerUser } from "@/lib/auth/server-session";
import { Paper, Typography } from "@mui/material";

export default async function TrainingPageContent() {
  const { supabase, user } = await requireServerUser();

  const permissions = await loadModulePermissions(supabase, user.id);
  if (!can(permissions, MODULE_SLUGS.training, "read")) {
    return (
      <Paper sx={{ p: 3, bgcolor: "rgba(0,0,0,0.45)" }}>
        <Typography color="error">You do not have access to Training.</Typography>
      </Paper>
    );
  }

  const envIntro = process.env.NEXT_PUBLIC_TRAINING_INTRO_VIDEO?.trim() ?? "";

  const { data: trainingRow, error: trainingErr } = await supabase
    .from("training_settings")
    .select("intro_video_url")
    .eq("id", 1)
    .maybeSingle();

  const dbIntro =
    !trainingErr && trainingRow && typeof trainingRow.intro_video_url === "string"
      ? trainingRow.intro_video_url.trim()
      : "";

  const intro = dbIntro || envIntro;
  const roles = await loadUserRoleNames(supabase, user.id);
  const elevated = isElevatedRole(roles);
  const showExternalCertPrompt = await shouldShowExternalCertificatePrompt(supabase, user.id);

  return (
    <TrainingCommandLanding
      introVideoUrl={intro || null}
      showExternalCertPrompt={showExternalCertPrompt}
      introVideoAdmin={
        elevated ? { initialDbUrl: dbIntro, hasEnvFallback: Boolean(envIntro) } : null
      }
    />
  );
}
