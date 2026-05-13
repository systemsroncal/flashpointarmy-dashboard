import { MobilizePolicySettingsForm } from "@/components/mobilize/MobilizePolicySettingsForm";
import { loadUserRoleNames } from "@/lib/auth/user-roles";
import { createClient } from "@/utils/supabase/server";
import { Box, Typography } from "@mui/material";
import { redirect } from "next/navigation";

export default async function MobilizeSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const roles = await loadUserRoleNames(supabase, user.id);
  if (!roles.includes("super_admin")) {
    redirect("/dashboard/mobilize");
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 2 }}>
        Mobilize settings
      </Typography>
      <MobilizePolicySettingsForm />
    </Box>
  );
}
