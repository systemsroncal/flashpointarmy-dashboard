"use client";

import { useEffect, useState } from "react";
import { Box, Card, CardContent, Chip, Skeleton, Typography } from "@mui/material";
import Link from "next/link";
import { useMobilizeToast } from "@/components/mobilize/MobilizeToastProvider";

type Ev = {
  id: string;
  title: string;
  date_time: string;
  event_type: string;
  group_id: string;
};

export default function MobilizeActivitiesPage() {
  const toast = useMobilizeToast();
  const [events, setEvents] = useState<Ev[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/mobilize/activities");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load.");
        setEvents(json.events ?? []);
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
        Upcoming Activities
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Public Mobilize events (not Gatherings).
      </Typography>
      {loading ? (
        <Skeleton height={240} />
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {events.map((e) => (
            <Card key={e.id} variant="outlined" sx={{ bgcolor: "rgba(0,0,0,0.2)" }}>
              <CardContent component={Link} href={`/dashboard/mobilize/groups/${e.group_id}`} sx={{ textDecoration: "none", color: "inherit" }}>
                <Typography fontWeight={600}>{e.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {new Date(e.date_time).toLocaleString()}
                </Typography>
                <Chip size="small" label={e.event_type} sx={{ mt: 1 }} />
              </CardContent>
            </Card>
          ))}
          {!events.length ? (
            <Typography color="text.secondary">No upcoming public events.</Typography>
          ) : null}
        </Box>
      )}
    </Box>
  );
}
