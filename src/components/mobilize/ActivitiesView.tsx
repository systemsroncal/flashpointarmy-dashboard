"use client";

import {
  Alert,
  Button,
  Card,
  CardContent,
  Stack,
  Typography,
  Skeleton,
  Snackbar,
} from "@mui/material";
import { useEffect, useState } from "react";

type Ev = {
  id: string;
  title: string;
  starts_at: string;
  is_public: boolean;
  group_id: string;
  event_type: string;
};

export function ActivitiesView() {
  const [events, setEvents] = useState<Ev[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/mobilize/activities");
      const json = await res.json();
      if (!cancelled && res.ok) setEvents((json.events ?? []) as Ev[]);
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <Skeleton height={240} />;

  return (
    <Stack spacing={2}>
      <Typography variant="h5" fontWeight={700}>
        Upcoming Activities
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Public Mobilize events and events in groups you belong to. These are separate from main platform gatherings.
      </Typography>
      {events.length === 0 ? (
        <Typography color="text.secondary">No upcoming Mobilize events.</Typography>
      ) : (
        events.map((e) => (
          <Card key={e.id} variant="outlined" sx={{ bgcolor: "rgba(0,0,0,0.25)" }}>
            <CardContent>
              <Typography variant="h6">{e.title}</Typography>
              <Typography variant="body2" color="text.secondary">
                {new Date(e.starts_at).toLocaleString()} · {e.event_type}
                {e.is_public ? " · Public" : ""}
              </Typography>
            </CardContent>
            <Stack direction="row" spacing={1} sx={{ px: 2, pb: 2 }}>
              <Button
                size="small"
                variant="contained"
                onClick={async () => {
                  const res = await fetch(`/api/mobilize/events/${e.id}/rsvp`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: "going" }),
                  });
                  const json = await res.json().catch(() => ({}));
                  if (!res.ok) setToast(String(json.error ?? "RSVP failed"));
                  else setToast("RSVP saved.");
                }}
              >
                RSVP: Going
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={async () => {
                  const res = await fetch(`/api/mobilize/events/${e.id}/rsvp`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: "declined" }),
                  });
                  const json = await res.json().catch(() => ({}));
                  if (!res.ok) setToast(String(json.error ?? "RSVP failed"));
                  else setToast("RSVP updated.");
                }}
              >
                Decline
              </Button>
            </Stack>
          </Card>
        ))
      )}
      <Snackbar open={Boolean(toast)} autoHideDuration={4000} onClose={() => setToast(null)}>
        <Alert severity="success" onClose={() => setToast(null)}>
          {toast}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
