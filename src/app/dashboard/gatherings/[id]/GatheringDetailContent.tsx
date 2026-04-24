import { publicAssetSrc } from "@/lib/media/public-asset-url";
import Link from "next/link";
import { MODULE_SLUGS } from "@/config/modules";
import { EventCategoryPill } from "@/components/events/EventCategoryPill";
import { EventImageCarousel } from "@/components/events/EventImageCarousel";
import { EventDescriptionHtml } from "@/components/events/EventDescriptionHtml";
import { EventVideoPlyrDialog } from "@/components/events/EventVideoPlyrDialog";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { can } from "@/types/permissions";
import { createClient } from "@/utils/supabase/server";
import { redirect, notFound } from "next/navigation";
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

export default async function GatheringDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const permissions = await loadModulePermissions(supabase, user.id);
  if (!can(permissions, MODULE_SLUGS.gatherings, "read")) {
    redirect("/dashboard/gatherings");
  }

  const canUpdate = can(permissions, MODULE_SLUGS.gatherings, "update");

  const { data: ev } = await supabase
    .from("gatherings")
    .select(
      "id, title, subtitle, starts_at, description_html, featured_image_url, gallery_image_urls, chapter_id, category_id, slug, status, is_virtual, virtual_url, video_url, cta_url, cta_button_label, cta_button_visible"
    )
    .eq("id", id)
    .maybeSingle();

  if (!ev) notFound();

  let catName: string | null = null;
  if (ev.category_id) {
    const { data: cat } = await supabase
      .from("event_categories")
      .select("name")
      .eq("id", ev.category_id)
      .maybeSingle();
    catName = cat?.name ?? null;
  }

  const { data: upcoming } = await supabase
    .from("gatherings")
    .select("id, title, starts_at, featured_image_url, slug")
    .neq("id", id)
    .eq("status", "published")
    .gt("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(8);

  const ctaHref = ev.cta_url?.trim() ?? "";
  const ctaLabel = (ev.cta_button_label ?? "REGISTER NOW").trim() || "REGISTER NOW";

  return (
    <Box>
      <EventVideoPlyrDialog videoUrl={ev.video_url} />
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Button component={Link} href="/dashboard/gatherings" size="small">
          ← Back to gatherings
        </Button>
        <Box sx={{ display: "flex", gap: 1 }}>
          {ev.slug ? (
            <Button component={Link} href={`/events/${ev.slug}`} size="small" target="_blank">
              Open public URL
            </Button>
          ) : null}
          {canUpdate ? (
            <Button component={Link} href={`/dashboard/gatherings/${id}/edit`} size="small">
              Edit event
            </Button>
          ) : null}
        </Box>
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "70% 30%" }, gap: 2 }}>
        <Box>
          <EventImageCarousel
            featuredImageUrl={ev.featured_image_url}
            galleryImageUrls={(ev.gallery_image_urls as string[] | null) ?? []}
            alt={ev.title}
          />
          <Typography variant="h4" sx={{ color: "primary.main", fontWeight: 800 }}>
            {ev.title}
          </Typography>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 1,
              my: 1,
            }}
          >
            <Typography variant="body2" component="span">
              {formatEventDateTime(ev.starts_at)}
            </Typography>
            {catName ? <EventCategoryPill label={catName} /> : null}
            {ev.status ? (
              <Typography variant="body2" component="span" color="text.secondary">
                {ev.status}
              </Typography>
            ) : null}
          </Box>
          {ev.is_virtual ? (
            <Typography variant="body2" sx={{ mb: 1 }}>
              Virtual event{ev.virtual_url ? ` · ${ev.virtual_url}` : ""}
            </Typography>
          ) : null}
          <Paper sx={{ p: 2, bgcolor: "rgba(0,0,0,0.45)", my: 2 }}>
            <EventDescriptionHtml html={ev.description_html} />
          </Paper>
          {ev.cta_button_visible && ctaHref ? (
            <Button
              component="a"
              href={ctaHref}
              target="_blank"
              rel="noopener noreferrer"
              variant="contained"
              sx={{ mt: 1 }}
            >
              {ctaLabel}
            </Button>
          ) : null}
        </Box>
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700 }}>
            What might interest you
          </Typography>
          <Box sx={{ display: "grid", gap: 1 }}>
            {(upcoming ?? []).map((u) => (
              <Link
                key={u.id}
                href={u.slug ? `/events/${u.slug}` : `/dashboard/gatherings/${u.id}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <Paper sx={{ p: 1, bgcolor: "rgba(0,0,0,0.35)" }}>
                  {u.featured_image_url ? (
                    <Box
                      component="img"
                      src={publicAssetSrc(u.featured_image_url)}
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
                    {u.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(u.starts_at).toLocaleDateString()}
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
