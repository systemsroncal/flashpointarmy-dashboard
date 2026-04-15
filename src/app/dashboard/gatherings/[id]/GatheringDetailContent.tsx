import Link from "next/link";
import { MODULE_SLUGS } from "@/config/modules";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { can } from "@/types/permissions";
import { createClient } from "@/utils/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Box, Button, Paper, Typography } from "@mui/material";

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

  const { data: ev } = await supabase
    .from("gatherings")
    .select(
      "id, title, subtitle, starts_at, description_html, featured_image_url, chapter_id, category_id"
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
    .select("id, title, starts_at, featured_image_url")
    .neq("id", id)
    .gt("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(8);

  return (
    <Box>
      <Button component={Link} href="/dashboard/gatherings" size="small" sx={{ mb: 2 }}>
        ← Back to gatherings
      </Button>
      {ev.featured_image_url ? (
        <Box
          component="img"
          src={ev.featured_image_url}
          alt=""
          sx={{ width: "100%", maxHeight: 360, objectFit: "cover", borderRadius: 1, mb: 2 }}
        />
      ) : null}
      <Typography variant="h4" sx={{ color: "primary.main", fontWeight: 800 }}>
        {ev.title}
      </Typography>
      {ev.subtitle ? (
        <Typography variant="subtitle1" color="text.secondary">
          {ev.subtitle}
        </Typography>
      ) : null}
      <Typography variant="body2" sx={{ my: 1 }}>
        {new Date(ev.starts_at).toLocaleString()}
        {catName ? ` · ${catName}` : ""}
      </Typography>
      <Paper sx={{ p: 2, bgcolor: "rgba(0,0,0,0.45)", my: 2 }}>
        <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
          {ev.description_html ?? "—"}
        </Typography>
      </Paper>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Event comments
      </Typography>
      <Paper sx={{ p: 2, bgcolor: "rgba(0,0,0,0.35)", mb: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Comments UI can be connected to `gathering_comments` next.
        </Typography>
      </Paper>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Upcoming events
      </Typography>
      <Box
        sx={{
          display: "flex",
          gap: 1,
          overflowX: "auto",
          pb: 1,
          "& img": { width: 160, height: 100, objectFit: "cover", borderRadius: 1 },
        }}
      >
        {(upcoming ?? []).map((u) => (
          <Box key={u.id} sx={{ flex: "0 0 auto", width: 180 }}>
            <Link href={`/dashboard/gatherings/${u.id}`} style={{ textDecoration: "none", color: "inherit" }}>
              {u.featured_image_url ? (
                <Box component="img" src={u.featured_image_url} alt="" />
              ) : (
                <Box sx={{ height: 100, bgcolor: "rgba(255,255,255,0.06)", borderRadius: 1 }} />
              )}
              <Typography variant="caption" display="block" noWrap>
                {u.title}
              </Typography>
            </Link>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
