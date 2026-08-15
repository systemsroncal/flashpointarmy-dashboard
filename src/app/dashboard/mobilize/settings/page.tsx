import { MobilizeSettingsClient } from "@/components/mobilize/MobilizeSettingsClient";
import { loadUserRoleNames } from "@/lib/auth/user-roles";
import { requireServerUser } from "@/lib/auth/server-session";
import { Box, Typography } from "@mui/material";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default async function MobilizeSettingsPage() {
  const { supabase, user } = await requireServerUser();

  const roles = await loadUserRoleNames(supabase, user.id);
  if (!roles.includes("super_admin")) {
    redirect("/dashboard/mobilize");
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 2 }}>
        Mobilize settings
      </Typography>
      <Suspense fallback={null}>
        <MobilizeSettingsClient />
      </Suspense>
    </Box>
  );
}
