"use client";

import { Alert, Button, Card, CardContent, Stack, Typography, Skeleton, Snackbar } from "@mui/material";
import { useCallback, useEffect, useState } from "react";

type Pending = {
  id: string;
  group_id: string;
  user_id: string;
  created_at: string;
  mobilize_groups: { name: string } | null;
};

type RecentEv = {
  id: string;
  title: string;
  starts_at: string;
  mobilize_groups: { name: string } | null;
};

export function MobilizeNotificationsView() {
  const [pending, setPending] = useState<Pending[]>([]);
  const [recent, setRecent] = useState<RecentEv[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/mobilize/notifications");
    const json = await res.json();
    if (res.ok) {
      setPending((json.pendingJoinRequests ?? []) as Pending[]);
      setRecent((json.recentGroupEvents ?? []) as RecentEv[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <Skeleton height={200} />;

  return (
    <Stack spacing={2}>
      <Typography variant="h5" fontWeight={700}>
        Mobilize notifications
      </Typography>

      <Typography variant="subtitle1" fontWeight={600}>
        Pending join requests (groups you lead)
      </Typography>
      {pending.length === 0 ? (
        <Typography color="text.secondary">No pending requests.</Typography>
      ) : (
        pending.map((p) => (
          <Card key={p.id} variant="outlined" sx={{ bgcolor: "rgba(0,0,0,0.25)" }}>
            <CardContent>
              <Typography variant="body1">
                User <code>{p.user_id.slice(0, 8)}…</code> wants to join{" "}
                <strong>{p.mobilize_groups?.name ?? "group"}</strong>
              </Typography>
            </CardContent>
            <Stack direction="row" spacing={1} sx={{ px: 2, pb: 2 }}>
              <Button
                size="small"
                variant="contained"
                onClick={async () => {
                  const res = await fetch(`/api/mobilize/groups/${p.group_id}/members/${p.user_id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: "approved" }),
                  });
                  const json = await res.json().catch(() => ({}));
                  if (!res.ok) setToast(String(json.error ?? "Failed"));
                  else {
                    setToast("Approved.");
                    void load();
                  }
                }}
              >
                Approve
              </Button>
              <Button
                size="small"
                color="error"
                variant="outlined"
                onClick={async () => {
                  const res = await fetch(`/api/mobilize/groups/${p.group_id}/members/${p.user_id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: "rejected" }),
                  });
                  const json = await res.json().catch(() => ({}));
                  if (!res.ok) setToast(String(json.error ?? "Failed"));
                  else {
                    setToast("Rejected.");
                    void load();
                  }
                }}
              >
                Reject
              </Button>
            </Stack>
          </Card>
        ))
      )}

      <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 2 }}>
        Recent events in your groups
      </Typography>
      {recent.length === 0 ? (
        <Typography color="text.secondary">Nothing new in the last 7 days.</Typography>
      ) : (
        recent.map((e) => (
          <Card key={e.id} variant="outlined" sx={{ bgcolor: "rgba(0,0,0,0.25)" }}>
            <CardContent>
              <Typography variant="subtitle1">{e.title}</Typography>
              <Typography variant="body2" color="text.secondary">
                {e.mobilize_groups?.name ?? "Group"} · {new Date(e.starts_at).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        ))
      )}

      <Snackbar open={Boolean(toast)} autoHideDuration={4000} onClose={() => setToast(null)}>
        <Alert severity="info" onClose={() => setToast(null)}>
          {toast}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
