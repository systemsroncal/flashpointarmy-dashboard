"use client";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { MOBILIZE_EVENT_TYPES } from "@/lib/mobilize/constants";

type Membership = {
  id: string;
  member_role: string;
  status: string;
} | null;

type Group = {
  id: string;
  name: string;
  group_type: string;
  description: string | null;
  address_line: string | null;
  visibility: string;
  only_leaders_can_create_events: boolean;
};

type MessageRow = { id: string; author_label: string; body: string; created_at: string };
type EventRow = { id: string; title: string; starts_at: string; event_type: string; is_public: boolean };

export function GroupDetailView({ groupId }: { groupId: string }) {
  const router = useRouter();
  const [tab, setTab] = useState(0);
  const [group, setGroup] = useState<Group | null>(null);
  const [membership, setMembership] = useState<Membership>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [pending, setPending] = useState<{ id: string; user_id: string; user_label: string }[]>([]);
  const [msgBody, setMsgBody] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const loadCore = useCallback(async () => {
    const res = await fetch(`/api/mobilize/groups/${groupId}`);
    const json = await res.json();
    if (!res.ok) {
      setErr(String(json.error ?? "Failed to load"));
      return;
    }
    setGroup(json.group as Group);
    setMembership(json.membership as Membership);
  }, [groupId]);

  const loadMessages = useCallback(async () => {
    const res = await fetch(`/api/mobilize/groups/${groupId}/messages`);
    if (!res.ok) return;
    const json = await res.json();
    setMessages((json.messages ?? []) as MessageRow[]);
  }, [groupId]);

  const loadEvents = useCallback(async () => {
    const res = await fetch(`/api/mobilize/groups/${groupId}/events`);
    if (!res.ok) return;
    const json = await res.json();
    setEvents((json.events ?? []) as EventRow[]);
  }, [groupId]);

  const loadPending = useCallback(async () => {
    const res = await fetch(`/api/mobilize/groups/${groupId}/members?status=pending`);
    if (!res.ok) return;
    const json = await res.json();
    setPending(
      ((json.members ?? []) as { id: string; user_id: string; user_label: string }[]).map((m) => ({
        id: m.id,
        user_id: m.user_id,
        user_label: m.user_label,
      }))
    );
  }, [groupId]);

  useEffect(() => {
    void loadCore();
  }, [loadCore]);

  useEffect(() => {
    if (!group) return;
    if (membership?.status === "approved") {
      void loadMessages();
      void loadEvents();
      if (membership.member_role === "leader") void loadPending();
    }
  }, [group, loadEvents, loadMessages, loadPending, membership]);

  const approved = membership?.status === "approved";
  const leader = approved && membership?.member_role === "leader";

  if (err) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {err}
      </Alert>
    );
  }
  if (!group) return <Typography sx={{ mt: 2 }}>Loading…</Typography>;

  return (
    <Stack spacing={2}>
      <Button size="small" variant="outlined" onClick={() => router.push("/dashboard/mobilize/map")}>
        Back to map
      </Button>
      <Typography variant="h5" fontWeight={700}>
        {group.name}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {group.group_type} · {group.visibility}
      </Typography>
      {group.description ? <Typography variant="body1">{group.description}</Typography> : null}
      {group.address_line ? <Typography variant="body2">{group.address_line}</Typography> : null}

      {group.visibility === "public" && !approved ? (
        <Button
          variant="contained"
          onClick={async () => {
            const res = await fetch(`/api/mobilize/groups/${groupId}/join`, { method: "POST" });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) setToast(String(json.error ?? "Request failed"));
            else {
              setToast("Join request sent.");
              void loadCore();
            }
          }}
        >
          Request to join
        </Button>
      ) : null}

      {leader && pending.length > 0 ? (
        <Card variant="outlined" sx={{ bgcolor: "rgba(0,0,0,0.25)" }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600}>
              Pending members
            </Typography>
            <Stack spacing={1} sx={{ mt: 1 }}>
              {pending.map((p) => (
                <Stack key={p.id} direction="row" spacing={1} alignItems="center">
                  <Typography variant="body2" sx={{ flex: 1 }}>
                    {p.user_label}
                  </Typography>
                  <Button
                    size="small"
                    onClick={async () => {
                      const res = await fetch(`/api/mobilize/groups/${groupId}/members/${p.user_id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status: "approved" }),
                      });
                      if (res.ok) {
                        setToast("Approved");
                        void loadPending();
                      }
                    }}
                  >
                    Approve
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    onClick={async () => {
                      const res = await fetch(`/api/mobilize/groups/${groupId}/members/${p.user_id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status: "rejected" }),
                      });
                      if (res.ok) {
                        setToast("Rejected");
                        void loadPending();
                      }
                    }}
                  >
                    Reject
                  </Button>
                </Stack>
              ))}
            </Stack>
          </CardContent>
        </Card>
      ) : null}

      <Tabs value={tab} onChange={(_, v) => setTab(v)}>
        <Tab label="Wall" />
        <Tab label="Events" />
      </Tabs>

      {tab === 0 ? (
        <Stack spacing={2}>
          {!approved ? (
            <Typography color="text.secondary">Join the group to view and post on the wall.</Typography>
          ) : (
            <>
              <Stack spacing={1}>
                {messages.map((m) => (
                  <Card key={m.id} variant="outlined" sx={{ bgcolor: "rgba(0,0,0,0.2)" }}>
                    <CardContent sx={{ py: 1.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        {m.author_label} · {new Date(m.created_at).toLocaleString()}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        {m.body}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
              <Divider />
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <TextField
                  label="New message"
                  value={msgBody}
                  onChange={(e) => setMsgBody(e.target.value)}
                  fullWidth
                  multiline
                  minRows={2}
                />
                <Button
                  variant="contained"
                  sx={{ alignSelf: { sm: "flex-end" } }}
                  onClick={async () => {
                    const res = await fetch(`/api/mobilize/groups/${groupId}/messages`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ body: msgBody }),
                    });
                    const json = await res.json().catch(() => ({}));
                    if (!res.ok) setToast(String(json.error ?? "Post failed"));
                    else {
                      setMsgBody("");
                      void loadMessages();
                    }
                  }}
                >
                  Post
                </Button>
              </Stack>
            </>
          )}
        </Stack>
      ) : (
        <Stack spacing={2}>
          {!approved ? (
            <Typography color="text.secondary">Join the group to see events.</Typography>
          ) : (
            <>
              {events.map((e) => (
                <Card key={e.id} variant="outlined" sx={{ bgcolor: "rgba(0,0,0,0.2)" }}>
                  <CardContent>
                    <Typography variant="subtitle1">{e.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(e.starts_at).toLocaleString()} · {e.event_type}
                      {e.is_public ? " · Public" : ""}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
              <CreateEventMini groupId={groupId} onCreated={() => void loadEvents()} group={group} membership={membership} />
            </>
          )}
        </Stack>
      )}

      <Snackbar open={Boolean(toast)} autoHideDuration={4000} onClose={() => setToast(null)}>
        <Alert onClose={() => setToast(null)} severity="success">
          {toast}
        </Alert>
      </Snackbar>
    </Stack>
  );
}

function CreateEventMini({
  groupId,
  onCreated,
  group,
  membership,
}: {
  groupId: string;
  onCreated: () => void;
  group: Group;
  membership: Membership;
}) {
  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [eventType, setEventType] = useState<string>(MOBILIZE_EVENT_TYPES[0]);
  const [isPublic, setIsPublic] = useState(false);

  const leader = membership?.member_role === "leader";
  const blocked = group.only_leaders_can_create_events && !leader;
  if (blocked) {
    return <Typography color="text.secondary">Only leaders can create events in this group.</Typography>;
  }

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        Create event
      </Typography>
      <Stack spacing={1.5}>
        <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} size="small" fullWidth />
        <TextField
          label="Starts at (ISO local)"
          value={startsAt}
          onChange={(e) => setStartsAt(e.target.value)}
          size="small"
          fullWidth
          placeholder="2026-05-10T18:00:00"
          helperText="Use a timezone-aware ISO string from your local picker."
        />
        <FormControl size="small" fullWidth>
          <InputLabel id="ev-type">Type</InputLabel>
          <Select
            labelId="ev-type"
            label="Type"
            value={eventType}
            onChange={(e) => setEventType(String(e.target.value))}
          >
            {MOBILIZE_EVENT_TYPES.map((t) => (
              <MenuItem key={t} value={t}>
                {t}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14 }}>
          <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
          Public (visible in Upcoming Activities for all Mobilize users)
        </label>
        <Button
          variant="outlined"
          size="small"
          onClick={async () => {
            const res = await fetch(`/api/mobilize/groups/${groupId}/events`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title,
                starts_at: startsAt,
                event_type: eventType,
                is_public: isPublic,
              }),
            });
            if (res.ok) {
              setTitle("");
              setStartsAt("");
              onCreated();
            }
          }}
        >
          Save event
        </Button>
      </Stack>
    </Box>
  );
}
