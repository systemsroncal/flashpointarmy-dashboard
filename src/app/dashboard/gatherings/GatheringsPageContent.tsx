import Link from "next/link";
import { MODULE_SLUGS } from "@/config/modules";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { can } from "@/types/permissions";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Box, Button, Paper, Typography } from "@mui/material";

export default async function GatheringsPageContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const permissions = await loadModulePermissions(supabase, user.id);
  if (!can(permissions, MODULE_SLUGS.gatherings, "read")) {
    return (
      <Paper sx={{ p: 3, bgcolor: "rgba(0,0,0,0.45)" }}>
        <Typography color="error">You do not have access to Gatherings.</Typography>
      </Paper>
    );
  }

  let events: {
    id: string;
    title: string;
    starts_at: string;
  }[] = [];

  try {
    const { data } = await supabase
      .from("gatherings")
      .select("id, title, starts_at")
      .order("starts_at", { ascending: true });
    events = data ?? [];
  } catch {
    events = [];
  }

  const canCreate = can(permissions, MODULE_SLUGS.gatherings, "create");

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: "primary.main" }}>
          Gatherings (events)
        </Typography>
        {canCreate ? (
          <Button component={Link} href="/dashboard/gatherings/new" variant="contained">
            New event
          </Button>
        ) : null}
      </Box>
      <Paper sx={{ bgcolor: "rgba(0,0,0,0.45)", p: 2 }}>
        {events.length === 0 ? (
          <Typography color="text.secondary">No events yet. Create categories and an event to get started.</Typography>
        ) : (
          events.map((e) => (
            <Box
              key={e.id}
              sx={{
                py: 1.5,
                borderBottom: "1px solid rgba(255,215,0,0.12)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography>{e.title}</Typography>
              <Button component={Link} href={`/dashboard/gatherings/${e.id}`} size="small">
                View
              </Button>
            </Box>
          ))
        )}
      </Paper>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: "block" }}>
        Event categories: manage at{" "}
        <Link href="/dashboard/gatherings/categories" style={{ color: "inherit" }}>
          /dashboard/gatherings/categories
        </Link>
      </Typography>
    </Box>
  );
}
