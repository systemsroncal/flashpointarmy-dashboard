import { Box, Button, Container, Stack, Typography } from "@mui/material";
import { notFound } from "next/navigation";
import { PublicGroupActionBar } from "@/components/mobilize/PublicGroupActionBar";
import { applyMobilizeAutoCloseInactive } from "@/lib/mobilize/apply-auto-close";
import { publicAssetSrc } from "@/lib/media/public-asset-url";
import { createAdminClient } from "@/utils/supabase/admin";

type Props = { params: Promise<{ id: string }> };

function EventDateBadge({ dateIso }: { dateIso: string }) {
  const d = new Date(dateIso);
  const month = d.toLocaleString("en-US", { month: "short" }).toUpperCase();
  const day = String(d.getDate());
  return (
    <Box
      sx={{
        width: 48,
        height: 48,
        borderRadius: 1.5,
        bgcolor: "#eceff1",
        color: "#455a64",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        lineHeight: 1.1,
      }}
    >
      <Typography sx={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.6 }}>{month}</Typography>
      <Typography sx={{ fontSize: 18, fontWeight: 800 }}>{day}</Typography>
    </Box>
  );
}

function formatEventWhen(dateIso: string) {
  const d = new Date(dateIso);
  return d.toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function PublicMobilizeGroupPage({ params }: Props) {
  const { id } = await params;
  const admin = createAdminClient();

  await applyMobilizeAutoCloseInactive(admin, [id]);

  let { data: group } = await admin
    .from("mobilize_groups")
    .select(
      "id, name, description, address, schedule_meeting, enrollment_mode, cover_image_url, parent_group_id, public_slug, visibility, created_by"
    )
    .eq("id", id)
    .maybeSingle();

  if (!group) {
    const bySlug = await admin
      .from("mobilize_groups")
      .select(
        "id, name, description, address, schedule_meeting, enrollment_mode, cover_image_url, parent_group_id, public_slug, visibility, created_by"
      )
      .eq("public_slug", id)
      .maybeSingle();
    group = bySlug.data;
  }

  if (!group || group.parent_group_id == null) {
    notFound();
  }

  const { data: leaderRows } = await admin
    .from("mobilize_group_members")
    .select("user_id")
    .eq("group_id", group.id)
    .eq("member_role", "leader")
    .eq("membership_status", "approved")
    .limit(5);

  const leaderIds = [
    ...new Set(
      [
        ...(leaderRows ?? []).map((r) => r.user_id as string),
        group.created_by ? String(group.created_by) : null,
      ].filter((x): x is string => Boolean(x))
    ),
  ];

  let leaderName: string | null = null;
  let leaderEmail: string | null = null;
  if (leaderIds.length) {
    const [{ data: duRows }, { data: profRows }] = await Promise.all([
      admin
        .from("dashboard_users")
        .select("id, first_name, last_name, display_name, email")
        .in("id", leaderIds),
      admin.from("profiles").select("id, first_name, last_name, display_name").in("id", leaderIds),
    ]);
    const primaryId = leaderIds[0]!;
    const du = (duRows ?? []).find((r) => r.id === primaryId) as
      | {
          first_name?: string | null;
          last_name?: string | null;
          display_name?: string | null;
          email?: string | null;
        }
      | undefined;
    const pr = (profRows ?? []).find((r) => r.id === primaryId) as
      | {
          first_name?: string | null;
          last_name?: string | null;
          display_name?: string | null;
        }
      | undefined;
    const first = (du?.first_name ?? pr?.first_name ?? "").trim();
    const last = (du?.last_name ?? pr?.last_name ?? "").trim();
    const both = [first, last].filter(Boolean).join(" ");
    leaderName = both || (du?.display_name ?? pr?.display_name ?? null);
    leaderEmail = du?.email ?? null;
  }

  const nowIso = new Date().toISOString();
  const [{ data: upcoming }, { data: past }] = await Promise.all([
    admin
      .from("mobilize_events")
      .select("id, title, description, date_time, event_type, is_public")
      .eq("group_id", group.id)
      .eq("is_public", true)
      .gte("date_time", nowIso)
      .order("date_time", { ascending: true })
      .limit(8),
    admin
      .from("mobilize_events")
      .select("id, title, description, date_time, event_type, is_public")
      .eq("group_id", group.id)
      .eq("is_public", true)
      .lt("date_time", nowIso)
      .order("date_time", { ascending: false })
      .limit(8),
  ]);

  const subtitleParts = [leaderName, group.address?.trim() || null, group.name].filter(Boolean);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#fff", color: "#1a1a1a" }}>
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 } }}>
        {/* Hero: title left, cover right — no site menus */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1.1fr 0.9fr" },
            gap: { xs: 2.5, md: 4 },
            alignItems: "center",
            mb: 1,
          }}
        >
          <Box>
            <Typography
              variant="h4"
              fontWeight={700}
              sx={{ letterSpacing: "-0.02em", lineHeight: 1.25, fontSize: { xs: "1.6rem", md: "2rem" } }}
            >
              {subtitleParts.length > 1 ? subtitleParts.join(" / ") : group.name}
            </Typography>
            {group.schedule_meeting?.trim() ? (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1.25, whiteSpace: "pre-wrap" }}>
                {group.schedule_meeting}
              </Typography>
            ) : null}
          </Box>
          {group.cover_image_url ? (
            <Box
              component="img"
              src={publicAssetSrc(group.cover_image_url)}
              alt=""
              sx={{
                width: "100%",
                maxHeight: 200,
                objectFit: "cover",
                borderRadius: 1,
              }}
            />
          ) : (
            <Box
              sx={{
                width: "100%",
                minHeight: 140,
                borderRadius: 1,
                bgcolor: "#1a2744",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                px: 2,
                textAlign: "center",
              }}
            >
              <Typography fontWeight={800} letterSpacing={1.2}>
                FLASHPOINT ARMY GROUPS
              </Typography>
            </Box>
          )}
        </Box>

        <PublicGroupActionBar
          groupId={group.id}
          enrollmentMode={group.enrollment_mode}
          contactEmail={leaderEmail}
          contactName={leaderName}
        />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "7fr 3fr" },
            gap: { xs: 4, md: 5 },
            alignItems: "start",
          }}
        >
          <Box>
            {group.description?.trim() ? (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 1.25 }}>
                  About
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
                  {group.description}
                </Typography>
              </Box>
            ) : null}

            <Typography variant="h6" fontWeight={700} sx={{ mb: 1.5 }}>
              Upcoming events
            </Typography>
            {(upcoming ?? []).length ? (
              <Stack spacing={1.75} sx={{ mb: 2 }}>
                {(upcoming ?? []).map((ev) => (
                  <Stack key={ev.id} direction="row" spacing={1.5} alignItems="flex-start">
                    <EventDateBadge dateIso={ev.date_time} />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography fontWeight={700} color="#1565c0">
                        {ev.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatEventWhen(ev.date_time)}
                      </Typography>
                    </Box>
                  </Stack>
                ))}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                No upcoming public events.
              </Typography>
            )}

            <Typography variant="h6" fontWeight={700} sx={{ mb: 1.5, mt: 3 }}>
              Past events
            </Typography>
            {(past ?? []).length ? (
              <Stack spacing={1.75}>
                {(past ?? []).map((ev) => (
                  <Stack key={ev.id} direction="row" spacing={1.5} alignItems="flex-start">
                    <EventDateBadge dateIso={ev.date_time} />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography fontWeight={700} color="#1565c0">
                        {ev.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatEventWhen(ev.date_time)}
                      </Typography>
                    </Box>
                  </Stack>
                ))}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No past public events.
              </Typography>
            )}
          </Box>

          <Box>
            <Typography
              variant="overline"
              sx={{ fontWeight: 700, letterSpacing: 1.4, color: "text.secondary" }}
            >
              Leader
            </Typography>
            <Typography variant="body1" fontWeight={600} sx={{ mb: 3 }}>
              {leaderName?.split(" ")[0] || leaderName || "—"}
            </Typography>

            <Typography
              variant="overline"
              sx={{ fontWeight: 700, letterSpacing: 1.4, color: "text.secondary" }}
            >
              Location
            </Typography>
            <Typography variant="body2" sx={{ mb: group.address ? 1 : 3 }}>
              {group.address?.trim() || "Location not listed."}
            </Typography>
            {group.address?.trim() ? (
              <Button
                size="small"
                variant="outlined"
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(group.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ mb: 3 }}
              >
                Show map
              </Button>
            ) : null}

            {group.schedule_meeting?.trim() ? (
              <>
                <Typography
                  variant="overline"
                  sx={{ display: "block", fontWeight: 700, letterSpacing: 1.4, color: "text.secondary" }}
                >
                  Schedule
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                  {group.schedule_meeting}
                </Typography>
              </>
            ) : null}
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
