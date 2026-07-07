"use client";

import { mobilizeCardSx } from "@/lib/mobilize/mobilize-ui-surface";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import PersonAddAlt1OutlinedIcon from "@mui/icons-material/PersonAddAlt1Outlined";
import { Box, Card, CardContent, Skeleton, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";

type Summary = {
  approvedMembers: number;
  pendingRequests: number;
  upcomingEvents: number;
  totalAnnouncements: number;
};

type Props = {
  groupId: string;
};

export function MobilizeGroupReportsPanel({ groupId }: Props) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const [membersRes, eventsRes, messagesRes] = await Promise.all([
          fetch(`/api/mobilize/groups/${groupId}/members`),
          fetch(`/api/mobilize/groups/${groupId}/events`),
          fetch(`/api/mobilize/groups/${groupId}/messages`),
        ]);
        const membersJson = await membersRes.json();
        const eventsJson = await eventsRes.json();
        const messagesJson = await messagesRes.json();
        if (cancelled) return;

        const members = (membersJson.members ?? []) as { membership_status: string }[];
        const events = (eventsJson.events ?? []) as { date_time: string }[];
        const now = Date.now();

        setSummary({
          approvedMembers: members.filter((m) => m.membership_status === "approved").length,
          pendingRequests: members.filter((m) => m.membership_status === "pending").length,
          upcomingEvents: events.filter((e) => new Date(e.date_time).getTime() >= now).length,
          totalAnnouncements: (messagesJson.messages ?? []).length,
        });
      } catch {
        if (!cancelled) setSummary(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [groupId]);

  if (loading) {
    return <Skeleton variant="rounded" height={200} />;
  }

  if (!summary) {
    return (
      <Typography color="text.secondary">Could not load group reports.</Typography>
    );
  }

  const cards = [
    {
      label: "Approved members",
      value: summary.approvedMembers,
      icon: <GroupsOutlinedIcon />,
    },
    {
      label: "Pending join requests",
      value: summary.pendingRequests,
      icon: <PersonAddAlt1OutlinedIcon />,
    },
    {
      label: "Upcoming events",
      value: summary.upcomingEvents,
      icon: <CalendarMonthOutlinedIcon />,
    },
    {
      label: "Feed",
      value: summary.totalAnnouncements,
      icon: <AssessmentOutlinedIcon />,
    },
  ];

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
        Group overview
      </Typography>
      <Stack direction="row" flexWrap="wrap" gap={2} useFlexGap>
        {cards.map((c) => (
          <Card
            key={c.label}
            variant="outlined"
            sx={{ ...mobilizeCardSx, flex: "1 1 200px", maxWidth: { sm: "calc(50% - 8px)" } }}
          >
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box sx={{ color: "text.secondary", display: "flex" }}>{c.icon}</Box>
              <Box>
                <Typography variant="h5" fontWeight={700}>
                  {c.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {c.label}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        More attendance and engagement reports can be added here later.
      </Typography>
    </Box>
  );
}
