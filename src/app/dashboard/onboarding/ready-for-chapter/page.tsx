import { FirstMissionsAdminClient } from "@/components/dashboard/onboarding/FirstMissionsAdminClient";
import { DataPaneFallback } from "@/components/dashboard/DataPaneFallback";
import { MODULE_SLUGS } from "@/config/modules";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { isElevatedRole, loadUserRoleNames } from "@/lib/auth/user-roles";
import { can } from "@/types/permissions";
import { createAdminClient } from "@/utils/supabase/admin";
import { requireServerUser } from "@/lib/auth/server-session";
import { Box, Paper, Typography } from "@mui/material";
import { Suspense } from "react";

async function ReadyForChapterInner() {
  const { supabase, user } = await requireServerUser();
  const roleNames = await loadUserRoleNames(supabase, user.id);
  if (!isElevatedRole(roleNames)) {
    return (
      <Paper sx={{ p: 3, bgcolor: "rgba(0,0,0,0.45)" }}>
        <Typography color="error">You do not have access to this page.</Typography>
      </Paper>
    );
  }
  const permissions = await loadModulePermissions(supabase, user.id);
  if (!can(permissions, MODULE_SLUGS.courses, "read")) {
    return (
      <Paper sx={{ p: 3, bgcolor: "rgba(0,0,0,0.45)" }}>
        <Typography color="error">You do not have access to this page.</Typography>
      </Paper>
    );
  }

  const admin = createAdminClient();
  const { data: chapters } = await admin.from("chapters").select("id, name, state").order("name");
  const chapterOptions = (chapters ?? []).map((c) => ({
    id: c.id as string,
    name: c.name as string,
    city: null as string | null,
    state: String(c.state ?? "").trim(),
  }));

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
        Ready for Chapter
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Members and local leaders who completed their first mission and may be ready to form or join a
        chapter.
      </Typography>
      <FirstMissionsAdminClient chapterOptions={chapterOptions} />
    </Box>
  );
}

export default function ReadyForChapterPage() {
  return (
    <Suspense fallback={<DataPaneFallback label="Loading ready for chapter" />}>
      <ReadyForChapterInner />
    </Suspense>
  );
}
