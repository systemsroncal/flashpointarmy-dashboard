import { Box, Button, Chip, Container, Divider, Stack, Typography } from "@mui/material";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import type { ReactNode } from "react";
import { PublicGroupActionBar } from "@/components/mobilize/PublicGroupActionBar";
import { resolveMobilizeGroupStateInfo } from "@/lib/mobilize/group-state-flag";
import { publicAssetSrc } from "@/lib/media/public-asset-url";

export type PublicGroupEvent = {
  id: string;
  title: string;
  description: string | null;
  date_time: string;
  event_type: string;
  address?: string | null;
};

export type PublicGroupProfileData = {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  schedule_meeting: string | null;
  enrollment_mode: string | null;
  cover_image_url: string | null;
  parent_chapter_name: string | null;
  region_code?: string | null;
  leaderName: string | null;
  leaderEmail: string | null;
  upcoming: PublicGroupEvent[];
  past: PublicGroupEvent[];
};

function EventDateBadge({ dateIso }: { dateIso: string }) {
  const d = new Date(dateIso);
  const month = d.toLocaleString("en-US", { month: "short" }).toUpperCase();
  const day = String(d.getDate());
  return (
    <Box
      sx={{
        width: 52,
        height: 52,
        borderRadius: 1.5,
        bgcolor: "#f0f2f5",
        color: "#37474f",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        lineHeight: 1.05,
        border: "1px solid rgba(0,0,0,0.06)",
      }}
    >
      <Typography sx={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5 }}>{month}</Typography>
      <Typography sx={{ fontSize: 20, fontWeight: 800 }}>{day}</Typography>
    </Box>
  );
}

function formatEventShort(dateIso: string) {
  const d = new Date(dateIso);
  return d.toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function SidebarLabel({ children }: { children: ReactNode }) {
  return (
    <Typography
      variant="overline"
      sx={{
        display: "block",
        fontWeight: 700,
        letterSpacing: 1.2,
        color: "rgba(0,0,0,0.45)",
        mb: 0.75,
        fontSize: "0.68rem",
      }}
    >
      {children}
    </Typography>
  );
}

function EventRow({
  event,
  coverFallback,
}: {
  event: PublicGroupEvent;
  coverFallback?: string | null;
}) {
  const thumb = coverFallback ? publicAssetSrc(coverFallback) : null;
  return (
    <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ py: 1.25 }}>
      {thumb ? (
        <Box
          component="img"
          src={thumb}
          alt=""
          sx={{
            width: 72,
            height: 54,
            borderRadius: 1,
            objectFit: "cover",
            flexShrink: 0,
            bgcolor: "#eceff1",
          }}
        />
      ) : (
        <EventDateBadge dateIso={event.date_time} />
      )}
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.25 }}>
          <CalendarMonthOutlinedIcon sx={{ fontSize: 16, color: "rgba(0,0,0,0.45)" }} />
          <Typography
            fontWeight={700}
            sx={{ color: "#1565c0", fontSize: "0.95rem", lineHeight: 1.3 }}
            noWrap
            title={event.title}
          >
            {event.title}
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.45 }}>
          {formatEventShort(event.date_time)}
        </Typography>
        {event.address?.trim() ? (
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.25 }}>
            {event.address}
          </Typography>
        ) : null}
      </Box>
    </Stack>
  );
}

export function PublicGroupProfileView({ group }: { group: PublicGroupProfileData }) {
  const stateInfo = resolveMobilizeGroupStateInfo({
    regionCode: group.region_code,
    address: group.address,
    name: group.parent_chapter_name ?? group.name,
  });
  const campusLabel =
    group.parent_chapter_name?.trim() ||
    stateInfo?.name ||
    (group.address?.trim() ? group.address.split(",").slice(-2, -1)[0]?.trim() : null);

  const mapsQuery = group.address?.trim() ? encodeURIComponent(group.address.trim()) : null;
  const directionsHref = mapsQuery
    ? `https://www.google.com/maps/dir/?api=1&destination=${mapsQuery}`
    : null;
  const mapHref = mapsQuery ? `https://www.google.com/maps/search/?api=1&query=${mapsQuery}` : null;

  const coverSrc = group.cover_image_url ? publicAssetSrc(group.cover_image_url) : null;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#fff", color: "#1a1a1a" }}>
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 }, px: { xs: 2, sm: 3 } }}>
        {/* Hero: title + cover (no site header) */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1.05fr) minmax(0, 0.95fr)" },
            gap: { xs: 2, md: 4 },
            alignItems: "center",
            mb: 0,
          }}
        >
          <Typography
            component="h1"
            sx={{
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.15,
              fontSize: { xs: "1.75rem", sm: "2.1rem", md: "2.35rem" },
              color: "#111",
              m: 0,
            }}
          >
            {group.name}
          </Typography>

          {coverSrc ? (
            <Box
              component="img"
              src={coverSrc}
              alt=""
              sx={{
                width: "100%",
                aspectRatio: "16 / 9",
                objectFit: "cover",
                borderRadius: 2,
                boxShadow: "0 8px 28px rgba(0,0,0,0.12)",
                display: "block",
              }}
            />
          ) : (
            <Box
              sx={{
                width: "100%",
                aspectRatio: "16 / 9",
                borderRadius: 2,
                background: "linear-gradient(135deg, #1a2744 0%, #2d4a7a 55%, #4a6fa5 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                px: 3,
                textAlign: "center",
              }}
            >
              <Typography sx={{ color: "rgba(255,255,255,0.92)", fontWeight: 800, letterSpacing: 1.5, fontSize: "0.85rem" }}>
                FLASHPOINT ARMY GROUP
              </Typography>
            </Box>
          )}
        </Box>

        <Box sx={{ mt: { xs: 2.5, md: 3 }, mx: { xs: -2, sm: -3 }, px: { xs: 2, sm: 3 } }}>
          <PublicGroupActionBar
            groupId={group.id}
            enrollmentMode={group.enrollment_mode}
            contactEmail={group.leaderEmail}
            contactName={group.leaderName}
          />
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) 300px" },
            gap: { xs: 4, lg: 6 },
            alignItems: "start",
            mt: { xs: 3, md: 4 },
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h5" fontWeight={800} sx={{ mb: 1, letterSpacing: "-0.02em" }}>
              About {group.name}
            </Typography>

            {group.schedule_meeting?.trim() ? (
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, color: "#222" }}>
                {group.schedule_meeting}
              </Typography>
            ) : null}

            {group.description?.trim() ? (
              <Typography
                variant="body1"
                sx={{
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.75,
                  color: "rgba(0,0,0,0.82)",
                  mb: 4,
                  maxWidth: 720,
                }}
              >
                {group.description}
              </Typography>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                No description provided yet.
              </Typography>
            )}

            <Typography variant="h6" fontWeight={800} sx={{ mb: 1.5 }}>
              Upcoming events
            </Typography>
            {(group.upcoming ?? []).length ? (
              <Stack divider={<Divider flexItem />} sx={{ mb: 4 }}>
                {group.upcoming.map((ev) => (
                  <EventRow key={ev.id} event={ev} coverFallback={group.cover_image_url} />
                ))}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                No upcoming public events are scheduled for this group right now.
              </Typography>
            )}

            <Typography variant="h6" fontWeight={800} sx={{ mb: 1.5 }}>
              Past events
            </Typography>
            {(group.past ?? []).length ? (
              <Stack divider={<Divider flexItem />}>
                {group.past.map((ev) => (
                  <EventRow key={ev.id} event={ev} coverFallback={group.cover_image_url} />
                ))}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No past public events have been recorded for this group.
              </Typography>
            )}
          </Box>

          <Box
            sx={{
              position: { lg: "sticky" },
              top: { lg: 24 },
              bgcolor: "#fafafa",
              border: "1px solid rgba(0,0,0,0.08)",
              borderRadius: 2,
              p: 2.5,
            }}
          >
            {campusLabel ? (
              <Box sx={{ mb: 2.5 }}>
                <SidebarLabel>Campus</SidebarLabel>
                <Chip
                  label={campusLabel}
                  size="small"
                  sx={{
                    fontWeight: 600,
                    bgcolor: "#fff",
                    border: "1px solid rgba(0,0,0,0.12)",
                    height: 28,
                  }}
                />
              </Box>
            ) : null}

            {group.schedule_meeting?.trim() ? (
              <Box sx={{ mb: 2.5 }}>
                <SidebarLabel>Schedule</SidebarLabel>
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.55 }}>
                  {group.schedule_meeting}
                </Typography>
              </Box>
            ) : null}

            <Box sx={{ mb: 2.5 }}>
              <SidebarLabel>Leader</SidebarLabel>
              <Typography variant="body1" fontWeight={600}>
                {group.leaderName?.split(" ")[0] || group.leaderName || "—"}
              </Typography>
            </Box>

            <Box>
              <SidebarLabel>Location</SidebarLabel>
              <Stack direction="row" spacing={0.75} alignItems="flex-start" sx={{ mb: 1.25 }}>
                <PlaceOutlinedIcon sx={{ fontSize: 18, color: "rgba(0,0,0,0.45)", mt: 0.15 }} />
                <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
                  {group.address?.trim() || "Location not listed."}
                </Typography>
              </Stack>
              {mapHref ? (
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Button
                    size="small"
                    variant="outlined"
                    href={mapHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      borderRadius: 99,
                      textTransform: "none",
                      fontWeight: 600,
                      borderColor: "rgba(0,0,0,0.22)",
                      color: "#333",
                    }}
                  >
                    Show map
                  </Button>
                  {directionsHref ? (
                    <Button
                      size="small"
                      variant="outlined"
                      href={directionsHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        borderRadius: 99,
                        textTransform: "none",
                        fontWeight: 600,
                        borderColor: "rgba(0,0,0,0.22)",
                        color: "#333",
                      }}
                    >
                      Get directions
                    </Button>
                  ) : null}
                </Stack>
              ) : null}
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
