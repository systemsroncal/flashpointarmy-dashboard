import { createAdminClient } from "@/utils/supabase/admin";
import { EventCategoryPill } from "@/components/events/EventCategoryPill";
import { EventImageCarousel } from "@/components/events/EventImageCarousel";
import { SocialShareButtons } from "@/components/events/SocialShareButtons";
import { EventDescriptionHtml } from "@/components/events/EventDescriptionHtml";
import { EventVideoPlyrDialog } from "@/components/events/EventVideoPlyrDialog";
import { Box, Button, Paper, Typography } from "@mui/material";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

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

export default async function PublicEventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const admin = createAdminClient();

  const { data: ev } = await admin
    .from("gatherings")
    .select(
      "id, title, subtitle, starts_at, description_html, featured_image_url, gallery_image_urls, category_id, slug, status, is_virtual, virtual_url, video_url, cta_url, cta_button_label, cta_button_visible"
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!ev) notFound();
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const proto = h.get("x-forwarded-proto") ?? "https";
  const eventUrl = host ? `${proto}://${host}/events/${ev.slug}` : `/events/${ev.slug}`;

  let catName: string | null = null;
  if (ev.category_id) {
    const { data: cat } = await admin
      .from("event_categories")
      .select("name")
      .eq("id", ev.category_id)
      .maybeSingle();
    catName = cat?.name ?? null;
  }

  const ctaHref = ev.cta_url?.trim() ?? "";
  const ctaLabel = (ev.cta_button_label ?? "REGISTER NOW").trim() || "REGISTER NOW";

  const { data: related } = await admin
    .from("gatherings")
    .select("id, title, starts_at, featured_image_url, slug")
    .eq("status", "published")
    .neq("id", ev.id)
    .order("starts_at", { ascending: true })
    .limit(8);

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: { xs: 2, md: 3 } }}>
      <EventVideoPlyrDialog videoUrl={ev.video_url} />
      <Box sx={{ mb: 2 }}>
        <EventImageCarousel
          featuredImageUrl={ev.featured_image_url}
          galleryImageUrls={(ev.gallery_image_urls as string[] | null) ?? []}
          alt={ev.title}
        />
        <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
          {ev.title}
        </Typography>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 1,
            mb: 1,
          }}
        >
          <Typography variant="body2" color="text.secondary" component="span">
            {formatEventDateTime(ev.starts_at)}
          </Typography>
          {catName ? <EventCategoryPill label={catName} /> : null}
        </Box>
        {ev.is_virtual ? (
          <Typography variant="body2" sx={{ mb: 1 }}>
            Virtual event{ev.virtual_url ? ` · ${ev.virtual_url}` : ""}
          </Typography>
        ) : null}
        <SocialShareButtons url={eventUrl} title={ev.title} />
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "70% 30%" }, gap: 2 }}>
        <Box>
          <Paper sx={{ p: 2, bgcolor: "rgba(0,0,0,0.45)" }}>
            <EventDescriptionHtml html={ev.description_html} />
          </Paper>
          {ev.cta_button_visible && ctaHref ? (
            <Button
              component="a"
              href={ctaHref}
              target="_blank"
              rel="noopener noreferrer"
              variant="contained"
              sx={{ mt: 2 }}
            >
              {ctaLabel}
            </Button>
          ) : null}
        </Box>
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700 }}>
            You might also like
          </Typography>
          <Box sx={{ display: "grid", gap: 1 }}>
            {(related ?? []).map((item) => (
              <Link
                key={item.id}
                href={item.slug ? `/events/${item.slug}` : "#"}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <Paper sx={{ p: 1, bgcolor: "rgba(0,0,0,0.35)" }}>
                  {item.featured_image_url ? (
                    <Box
                      component="img"
                      src={item.featured_image_url}
                      alt=""
                      sx={{
                        width: "100%",
                        height: 120,
                        objectFit: "contain",
                        bgcolor: "rgba(0,0,0,0.25)",
                        borderRadius: 1,
                        mb: 0.5,
                      }}
                    />
                  ) : null}
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {item.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(item.starts_at).toLocaleDateString()}
                  </Typography>
                </Paper>
              </Link>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
