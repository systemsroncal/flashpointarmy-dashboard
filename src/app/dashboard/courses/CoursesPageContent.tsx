import { MODULE_SLUGS } from "@/config/modules";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { can } from "@/types/permissions";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Box, Button, Paper, Typography } from "@mui/material";

export default async function CoursesPageContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const permissions = await loadModulePermissions(supabase, user.id);
  if (!can(permissions, MODULE_SLUGS.courses, "read")) {
    return (
      <Paper sx={{ p: 3, bgcolor: "rgba(0,0,0,0.45)" }}>
        <Typography color="error">You do not have access to Courses.</Typography>
      </Paper>
    );
  }

  const { data: rows } = await supabase
    .from("courses")
    .select("id, title, slug, published, updated_at")
    .order("updated_at", { ascending: false });

  const canCreate = can(permissions, MODULE_SLUGS.courses, "create");

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: "primary.main" }}>
          Courses
        </Typography>
        {canCreate ? (
          <Button component={Link} href="/dashboard/courses/new" variant="contained">
            New course
          </Button>
        ) : null}
      </Box>
      <Paper sx={{ bgcolor: "rgba(0,0,0,0.45)" }}>
        {(rows ?? []).length === 0 ? (
          <Typography sx={{ p: 2 }} color="text.secondary">
            No courses yet.
          </Typography>
        ) : (
          <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
            {(rows ?? []).map((r) => (
              <Box
                key={r.id as string}
                component="li"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 2,
                  px: 2,
                  py: 1.5,
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <Box>
                  <Typography fontWeight={700}>{r.title as string}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    /dashboard/course/{r.slug as string} · {r.published ? "Published" : "Draft"}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button component={Link} href={`/dashboard/courses/${r.id}/edit`} size="small" variant="outlined">
                    Edit
                  </Button>
                  <Button component={Link} href={`/dashboard/courses/${r.id}/progress`} size="small" variant="text">
                    Progress
                  </Button>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Paper>
    </Box>
  );
}
