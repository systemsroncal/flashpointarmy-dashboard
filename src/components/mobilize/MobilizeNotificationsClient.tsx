"use client";

import type { ReactNode } from "react";
import {
  formatMobilizeTimeAgo,
  useMobilizeNotifications,
} from "@/components/mobilize/useMobilizeNotifications";
import type {
  MobilizePendingJoinNotification,
  MobilizeRecentEventNotification,
} from "@/lib/mobilize/fetch-mobilize-notifications";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import PersonAddAlt1OutlinedIcon from "@mui/icons-material/PersonAddAlt1Outlined";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControlLabel,
  Skeleton,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import Link from "next/link";

function notificationCardSx(accent: string) {
  return {
    bgcolor: "#fafafa",
    border: "1px solid rgba(0,0,0,0.1)",
    borderLeft: "4px solid",
    borderLeftColor: accent,
    borderRadius: 2,
    transition: "transform 0.15s ease, box-shadow 0.15s ease",
    "&:hover": {
      transform: "translateY(-1px)",
      boxShadow: "0 6px 18px rgba(0,0,0,0.1)",
    },
  } as const;
}

function JoinRequestCard({ item }: { item: MobilizePendingJoinNotification }) {
  return (
    <Card variant="outlined" sx={notificationCardSx("#f59e0b")}>
      <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", sm: "center" }}
          useFlexGap
        >
          <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ flex: 1, minWidth: 0 }}>
            <Avatar
              src={item.user_avatar_url ?? undefined}
              alt=""
              sx={{
                width: 48,
                height: 48,
                bgcolor: "rgba(245, 158, 11, 0.2)",
                color: "warning.light",
                border: "1px solid rgba(255,215,0,0.2)",
              }}
            >
              {item.user_display_name.slice(0, 1).toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 0.5 }}>
                <PersonAddAlt1OutlinedIcon sx={{ fontSize: 18, color: "warning.main" }} />
                <Typography variant="overline" sx={{ color: "warning.main", letterSpacing: 0.6, lineHeight: 1.2 }}>
                  Join request
                </Typography>
                <Chip size="small" label={formatMobilizeTimeAgo(item.created_at)} variant="outlined" />
              </Stack>
              <Typography variant="body1" sx={{ fontWeight: 600, lineHeight: 1.35 }}>
                <Box component="span" sx={{ color: "primary.main" }}>
                  {item.user_display_name}
                </Box>{" "}
                requested to join{" "}
                <Box component="span" sx={{ color: "text.primary" }}>
                  {item.group_name}
                </Box>
              </Typography>
              {item.user_email ? (
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                  {item.user_email}
                </Typography>
              ) : null}
            </Box>
          </Stack>
          <Button
            component={Link}
            href={`/dashboard/mobilize/groups/${item.group_id}`}
            variant="contained"
            endIcon={<ArrowForwardIcon />}
            sx={{ alignSelf: { xs: "stretch", sm: "center" }, flexShrink: 0 }}
          >
            Review request
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}

function EventNotificationCard({ item }: { item: MobilizeRecentEventNotification }) {
  return (
    <Card variant="outlined" sx={notificationCardSx("#c32020")}>
      <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", sm: "center" }}
          useFlexGap
        >
          <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ flex: 1, minWidth: 0 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "rgba(195, 32, 32, 0.18)",
                color: "#f87171",
                border: "1px solid rgba(195, 32, 32, 0.35)",
                flexShrink: 0,
              }}
            >
              <CalendarMonthOutlinedIcon />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 0.5 }}>
                <Typography variant="overline" sx={{ color: "#f87171", letterSpacing: 0.6, lineHeight: 1.2 }}>
                  New event
                </Typography>
                <Chip size="small" label={formatMobilizeTimeAgo(item.created_at)} variant="outlined" />
              </Stack>
              <Typography variant="body1" fontWeight={700} sx={{ lineHeight: 1.35 }}>
                {item.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {item.group_name} · {new Date(item.date_time).toLocaleString()}
              </Typography>
            </Box>
          </Stack>
          <Button
            component={Link}
            href={`/dashboard/mobilize/groups/${item.group_id}`}
            variant="outlined"
            endIcon={<ArrowForwardIcon />}
            sx={{ alignSelf: { xs: "stretch", sm: "center" }, flexShrink: 0 }}
          >
            Open group
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}

function EmptySection({ icon, message }: { icon: ReactNode; message: string }) {
  return (
    <Card variant="outlined" sx={{ bgcolor: "#fafafa", borderColor: "rgba(0,0,0,0.1)", borderRadius: 2 }}>
      <CardContent>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          alignItems={{ xs: "center", sm: "flex-start" }}
          sx={{ textAlign: { xs: "center", sm: "left" } }}
        >
          <Box sx={{ color: "text.secondary" }}>{icon}</Box>
          <Typography variant="body2" color="text.secondary">
            {message}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}

export function MobilizeNotificationsClient() {
  const { data, loading, soundEnabled, toggleSound } = useMobilizeNotifications();
  const { pendingJoinRequests, recentGroupEvents } = data;

  return (
    <Box>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        spacing={1.5}
        sx={{ mb: 3 }}
      >
        <Stack direction="row" spacing={1.25} alignItems="center">
          <NotificationsActiveOutlinedIcon sx={{ fontSize: 32, color: "primary.main" }} />
          <Box>
            <Typography variant="h4" fontWeight={700} lineHeight={1.2}>
              Notifications
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Join requests and new group activity
            </Typography>
          </Box>
        </Stack>
        <FormControlLabel
          control={
            <Switch
              checked={soundEnabled}
              onChange={(_, checked) => toggleSound(checked)}
              color="primary"
            />
          }
          label="Sound alerts"
          sx={{ m: 0 }}
        />
      </Stack>

      {loading ? (
        <Stack spacing={2}>
          <Skeleton variant="rounded" height={120} />
          <Skeleton variant="rounded" height={120} />
        </Stack>
      ) : (
        <Stack spacing={3}>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
              <PersonAddAlt1OutlinedIcon fontSize="small" color="warning" />
              <Typography variant="h6" fontWeight={700}>
                Pending join requests
              </Typography>
              {pendingJoinRequests.length ? (
                <Chip size="small" color="warning" label={pendingJoinRequests.length} />
              ) : null}
            </Stack>
            {!pendingJoinRequests.length ? (
              <EmptySection
                icon={<GroupsOutlinedIcon sx={{ fontSize: 36 }} />}
                message="No pending join requests right now."
              />
            ) : (
              <Stack spacing={1.5}>
                {pendingJoinRequests.map((p) => (
                  <JoinRequestCard key={p.id} item={p} />
                ))}
              </Stack>
            )}
          </Box>

          <Box>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
              <CalendarMonthOutlinedIcon fontSize="small" sx={{ color: "#f87171" }} />
              <Typography variant="h6" fontWeight={700}>
                Recent events in your groups
              </Typography>
            </Stack>
            {!recentGroupEvents.length ? (
              <EmptySection
                icon={<CalendarMonthOutlinedIcon sx={{ fontSize: 36 }} />}
                message="No new upcoming events in the last 7 days."
              />
            ) : (
              <Stack spacing={1.5}>
                {recentGroupEvents.map((e) => (
                  <EventNotificationCard key={e.id} item={e} />
                ))}
              </Stack>
            )}
          </Box>
        </Stack>
      )}
    </Box>
  );
}
