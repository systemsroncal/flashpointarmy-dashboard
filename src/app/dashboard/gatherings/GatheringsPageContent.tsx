import { EventsListClient, type EventListItem } from "@/components/dashboard/gatherings/EventsListClient";
import { MODULE_SLUGS } from "@/config/modules";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { can } from "@/types/permissions";
import { createClient } from "@/utils/supabase/server";
import { requireServerUser } from "@/lib/auth/server-session";
import { Box, Button, Paper, Typography } from "@mui/material";
import Link from "next/link";

export default async function GatheringsPageContent() {
  const { supabase, user } = await requireServerUser();

  const permissions = await loadModulePermissions(supabase, user.id);
  if (!can(permissions, MODULE_SLUGS.gatherings, "read")) {
    return (
      <Paper sx={{ p: 3, bgcolor: "rgba(0,0,0,0.45)" }}>
        <Typography color="error">You do not have access to Events.</Typography>
      </Paper>
    );
  }

  let events: EventListItem[] = [];

  try {
    const { data } = await supabase
      .from("gatherings")
      .select(
        "id, title, starts_at, status, slug, featured_image_url, is_virtual, virtual_url, location_manual, use_chapter_address, chapter:chapters(name, city, state, zip_code)"
      )
      .order("starts_at", { ascending: true });
    const rows = data ?? [];
    events = rows.map((row) => {
      const ch = (row as { chapter?: EventListItem["chapter"][] }).chapter?.[0] ?? null;
      return {
        id: row.id as string,
        title: row.title as string,
        starts_at: row.starts_at as string,
        status: String(row.status),
        slug: (row.slug as string | null) ?? null,
        featured_image_url: (row.featured_image_url as string | null) ?? null,
        is_virtual: Boolean(row.is_virtual),
        virtual_url: (row.virtual_url as string | null) ?? null,
        location_manual: (row.location_manual as string | null) ?? null,
        use_chapter_address: Boolean(row.use_chapter_address),
        chapter: ch
          ? {
              name: ch.name,
              city: ch.city ?? null,
              state: ch.state ?? null,
              zip_code: ch.zip_code ?? null,
            }
          : null,
      };
    });
  } catch {
    events = [];
  }

  const canCreate = can(permissions, MODULE_SLUGS.gatherings, "create");
  const canUpdate = can(permissions, MODULE_SLUGS.gatherings, "update");
  const canDelete = can(permissions, MODULE_SLUGS.gatherings, "delete");

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: "primary.main" }}>
          Events
        </Typography>
        {canCreate ? (
          <Button component={Link} href="/dashboard/gatherings/new" variant="contained">
            New event
          </Button>
        ) : null}
      </Box>
      <Paper sx={{ bgcolor: "rgba(0,0,0,0.45)", p: 2 }}>
        <EventsListClient events={events} canUpdate={canUpdate} canDelete={canDelete} />
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
