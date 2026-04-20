import { createAdminClient } from "@/utils/supabase/admin";
import { Box, Paper, Typography } from "@mui/material";
import Link from "next/link";

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

export default async function PublicEventsPage() {
  const admin = createAdminClient();
  const { data: events } = await admin
    .from("gatherings")
    .select(
      "id, title, starts_at, slug, featured_image_url, is_virtual, virtual_url, location_manual, use_chapter_address, chapter:chapters(name, address_line, city, state, zip_code)"
    )
    .eq("status", "published")
    .order("starts_at", { ascending: true });

  const rows = events ?? [];

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: { xs: 2, md: 3 } }}>
      <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>
        Events
      </Typography>
      {rows.length === 0 ? (
        <Typography color="text.secondary">No published events yet.</Typography>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(3, minmax(0, 1fr))" },
            gap: 2,
          }}
        >
          {rows.map((ev) => {
            const chapter = (ev.chapter as Array<{
              name: string;
              address_line: string | null;
              city: string | null;
              state: string | null;
              zip_code: string | null;
            }> | null)?.[0];
            const location = ev.is_virtual
              ? "Virtual event"
              : ev.location_manual?.trim() ||
                (ev.use_chapter_address && chapter
                  ? [chapter.address_line, chapter.city, chapter.state, chapter.zip_code]
                      .filter(Boolean)
                      .join(", ")
                  : chapter?.name || "Location TBD");

            return (
              <Link key={ev.id} href={ev.slug ? `/events/${ev.slug}` : "#"} style={{ textDecoration: "none", color: "inherit" }}>
                <Paper sx={{ p: 1.25, height: "100%", bgcolor: "rgba(0,0,0,0.35)" }}>
                  <Box
                    component="img"
                    src={ev.featured_image_url || "/favicon.ico"}
                    alt=""
                    sx={{
                      width: "100%",
                      height: 180,
                      objectFit: "contain",
                      bgcolor: "rgba(0,0,0,0.25)",
                      borderRadius: 1,
                      mb: 1,
                    }}
                  />
                  <Typography sx={{ fontWeight: 700, mb: 0.5 }}>{ev.title}</Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {formatEventDateTime(ev.starts_at)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {location}
                  </Typography>
                  {ev.is_virtual && ev.virtual_url ? (
                    <Typography variant="caption" color="primary.main" display="block">
                      Join link available
                    </Typography>
                  ) : null}
                </Paper>
              </Link>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
