"use client";

import { useEffect, useState } from "react";
import { Box, Button, Card, CardContent, Chip, Skeleton, Typography } from "@mui/material";
import Link from "next/link";
import { useMobilizeToast } from "@/components/mobilize/MobilizeToastProvider";

type JoinReq = { id: string; group_id: string; user_id: string; created_at: string };
type Ev = { id: string; group_id: string; title: string; date_time: string; created_at: string };

export default function MobilizeNotificationsPage() {
  const toast = useMobilizeToast();
  const [pending, setPending] = useState<JoinReq[]>([]);
  const [events, setEvents] = useState<Ev[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/mobilize/notifications");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load.");
        setPending(json.pendingJoinRequests ?? []);
        setEvents(json.recentGroupEvents ?? []);
      } catch (e) {
        toast(e instanceof Error ? e.message : "Error", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Notifications
      </Typography>
      {loading ? (
        <Skeleton height={200} />
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Pending join requests
            </Typography>
            {!pending.length ? (
              <Typography color="text.secondary">None.</Typography>
            ) : (
              pending.map((p) => (
                <Card key={p.id} variant="outlined" sx={{ mb: 1, bgcolor: "rgba(0,0,0,0.2)" }}>
                  <CardContent sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center" }}>
                    <Typography variant="body2">
                      User <Chip size="small" label={p.user_id.slice(0, 8)} /> requested to join group{" "}
                      <Chip size="small" label={p.group_id.slice(0, 8)} />
                    </Typography>
                    <Button size="small" component={Link} href={`/dashboard/mobilize/groups/${p.group_id}`}>
                      Review in group
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </Box>
          <Box>
            <Typography variant="h6" gutterBottom>
              Recent events in your groups
            </Typography>
            {!events.length ? (
              <Typography color="text.secondary">None in the last 7 days.</Typography>
            ) : (
              events.map((e) => (
                <Card key={e.id} variant="outlined" sx={{ mb: 1, bgcolor: "rgba(0,0,0,0.2)" }}>
                  <CardContent>
                    <Typography fontWeight={600}>{e.title}</Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {new Date(e.date_time).toLocaleString()}
                    </Typography>
                    <Button size="small" component={Link} href={`/dashboard/mobilize/groups/${e.group_id}`} sx={{ mt: 1 }}>
                      Open group
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
}
