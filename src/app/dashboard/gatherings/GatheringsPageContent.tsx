import Link from "next/link";
import { MODULE_SLUGS } from "@/config/modules";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { can } from "@/types/permissions";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Box, Button, Paper, Typography } from "@mui/material";

function formatEventDateTime(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}

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
    status: "published" | "draft" | "trash";
    slug: string | null;
    featured_image_url: string | null;
    is_virtual: boolean;
    virtual_url: string | null;
    location_manual: string | null;
    use_chapter_address: boolean;
    chapter: {
      name: string;
      address_line: string | null;
      city: string | null;
      state: string | null;
      zip_code: string | null;
    }[] | null;
  }[] = [];

  try {
    const { data } = await supabase
      .from("gatherings")
      .select(
        "id, title, starts_at, status, slug, featured_image_url, is_virtual, virtual_url, location_manual, use_chapter_address, chapter:chapters(name, address_line, city, state, zip_code)"
      )
      .order("starts_at", { ascending: true });
    events = data ?? [];
  } catch {
    events = [];
  }

  const canCreate = can(permissions, MODULE_SLUGS.gatherings, "create");
  const canUpdate = can(permissions, MODULE_SLUGS.gatherings, "update");

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
            (() => {
              const chapter = e.chapter?.[0] ?? null;
              return (
            <Box
              key={e.id}
              sx={{
                py: 1.5,
                borderBottom: "1px solid rgba(255,215,0,0.12)",
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "96px 1fr auto" },
                gap: 1.5,
                alignItems: "center",
              }}
            >
              <Box
                component="img"
                src={e.featured_image_url || "/favicon.ico"}
                alt=""
                sx={{
                  width: 96,
                  height: 72,
                  borderRadius: 1,
                  objectFit: "contain",
                  bgcolor: "rgba(255,255,255,0.06)",
                }}
              />
              <Box>
                <Typography sx={{ fontWeight: 700 }}>{e.title}</Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  {formatEventDateTime(e.starts_at)}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  {e.is_virtual
                    ? "Virtual event"
                    : e.location_manual?.trim() ||
                      (e.use_chapter_address && chapter
                        ? [chapter.address_line, chapter.city, chapter.state, chapter.zip_code]
                            .filter(Boolean)
                            .join(", ")
                        : chapter?.name || "Location TBD")}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <Typography variant="caption" color="text.secondary">
                  {e.status}
                </Typography>
                {e.slug ? (
                  <Button component={Link} href={`/events/${e.slug}`} size="small" target="_blank">
                    Public URL
                  </Button>
                ) : null}
                <Button component={Link} href={`/dashboard/gatherings/${e.id}`} size="small">
                  View
                </Button>
                {canUpdate ? (
                  <Button component={Link} href={`/dashboard/gatherings/${e.id}/edit`} size="small">
                    Edit
                  </Button>
                ) : null}
              </Box>
            </Box>
              );
            })()
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
