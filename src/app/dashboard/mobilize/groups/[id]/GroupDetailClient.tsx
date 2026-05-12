"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { MOBILIZE_EVENT_TYPES } from "@/lib/mobilize/constants";
import { useMobilizeToast } from "@/components/mobilize/MobilizeToastProvider";

type Group = {
  id: string;
  name: string;
  group_type: string;
  description: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  visibility: string;
  event_create_policy: string;
  created_by: string;
  created_at: string;
};

type Membership = {
  member_role: string;
  membership_status: string;
} | null;

type MessageRow = { id: string; author_id: string; content: string; created_at: string };
type EventRow = {
  id: string;
  title: string;
  date_time: string;
  event_type: string;
  is_public: boolean;
};
type MemberRow = { user_id: string; member_role: string; membership_status: string; id: string };

export default function GroupDetailClient({ groupId }: { groupId: string }) {
  const toast = useMobilizeToast();
  const [tab, setTab] = useState(0);
  const [group, setGroup] = useState<Group | null>(null);
  const [membership, setMembership] = useState<Membership>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [wallInput, setWallInput] = useState("");
  const [eventOpen, setEventOpen] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    date_time: "",
    event_type: "meeting",
    is_public: false,
  });

  const loadGroup = useCallback(async () => {
    const res = await fetch(`/api/mobilize/groups/${groupId}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to load group.");
    setGroup(json.group);
    setMembership(json.membership ?? null);
  }, [groupId]);

  const loadWall = useCallback(async () => {
    const res = await fetch(`/api/mobilize/groups/${groupId}/messages`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to load messages.");
    setMessages(json.messages ?? []);
  }, [groupId]);

  const loadEvents = useCallback(async () => {
    const res = await fetch(`/api/mobilize/groups/${groupId}/events`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to load events.");
    setEvents(json.events ?? []);
  }, [groupId]);

  const loadMembers = useCallback(async () => {
    const res = await fetch(`/api/mobilize/groups/${groupId}/members`);
    if (res.status === 403) {
      setMembers([]);
      return;
    }
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to load members.");
    setMembers(json.members ?? []);
  }, [groupId]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        await loadGroup();
      } catch (e) {
        toast(e instanceof Error ? e.message : "Error", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [loadGroup, toast]);

  const isApproved = membership?.membership_status === "approved";
  const isLeader = membership?.member_role === "leader" && isApproved;

  useEffect(() => {
    if (!isApproved) return;
    void loadWall().catch(() => {});
    void loadEvents().catch(() => {});
  }, [isApproved, loadWall, loadEvents]);

  useEffect(() => {
    if (!isLeader) return;
    void loadMembers().catch(() => {});
  }, [isLeader, loadMembers]);

  async function joinRequest() {
    try {
      const res = await fetch(`/api/mobilize/groups/${groupId}/join`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Join failed.");
      toast("Join request sent.", "success");
      await loadGroup();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Join failed.", "error");
    }
  }

  async function postWall() {
    const content = wallInput.trim();
    if (!content) return;
    try {
      const res = await fetch(`/api/mobilize/groups/${groupId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Post failed.");
      setWallInput("");
      await loadWall();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Post failed.", "error");
    }
  }

  async function createEvent() {
    if (!eventForm.title.trim() || !eventForm.date_time) {
      toast("Title and date/time are required.", "error");
      return;
    }
    try {
      const res = await fetch(`/api/mobilize/groups/${groupId}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: eventForm.title.trim(),
          description: eventForm.description.trim() || null,
          date_time: new Date(eventForm.date_time).toISOString(),
          event_type: eventForm.event_type,
          is_public: eventForm.is_public,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Create failed.");
      toast("Event created.", "success");
      setEventOpen(false);
      setEventForm({ title: "", description: "", date_time: "", event_type: "meeting", is_public: false });
      await loadEvents();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Create failed.", "error");
    }
  }

  async function setRsvp(eventId: string, rsvp_status: "yes" | "maybe" | "no") {
    try {
      const res = await fetch(`/api/mobilize/events/${eventId}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rsvp_status }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "RSVP failed.");
      toast("RSVP saved.", "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "RSVP failed.", "error");
    }
  }

  async function approveMember(uid: string, status: "approved" | "rejected") {
    try {
      const res = await fetch(`/api/mobilize/groups/${groupId}/members/${uid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membership_status: status }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Update failed.");
      await loadMembers();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Update failed.", "error");
    }
  }

  const showJoin =
    group?.visibility === "public" &&
    (!membership || membership.membership_status === "rejected");

  const header = useMemo(() => {
    if (!group) return null;
    return (
      <Box sx={{ mb: 2 }}>
        <Typography variant="h4" fontWeight={700}>
          {group.name}
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
          <Chip label={group.group_type} />
          <Chip label={group.visibility} />
          <Chip label={`Events: ${group.event_create_policy}`} variant="outlined" />
          {membership ? <Chip label={`You: ${membership.membership_status}`} color="primary" /> : null}
        </Box>
        {group.description ? (
          <Typography variant="body2" sx={{ mt: 1 }}>
            {group.description}
          </Typography>
        ) : null}
        {group.address ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {group.address}
          </Typography>
        ) : null}
        {showJoin ? (
          <Button variant="contained" sx={{ mt: 2 }} onClick={() => void joinRequest()}>
            Request to join
          </Button>
        ) : null}
        {membership?.membership_status === "pending" ? (
          <Typography sx={{ mt: 2 }} color="warning.main">
            Your membership is pending leader approval.
          </Typography>
        ) : null}
      </Box>
    );
  }, [group, membership, showJoin]);

  if (loading || !group) {
    return <Skeleton height={320} />;
  }

  return (
    <Box>
      <Button component={Link} href="/dashboard/mobilize/map" size="small" sx={{ mb: 1 }}>
        Back to map
      </Button>
      {header}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Wall" disabled={!isApproved} />
        <Tab label="Events" disabled={!isApproved} />
        <Tab label="Members" disabled={!isLeader} />
      </Tabs>

      {tab === 0 && isApproved ? (
        <Box>
          <TextField
            fullWidth
            multiline
            minRows={2}
            placeholder="Post a message, link, or activity idea…"
            value={wallInput}
            onChange={(e) => setWallInput(e.target.value)}
          />
          <Button sx={{ mt: 1 }} variant="contained" onClick={() => void postWall()}>
            Post
          </Button>
          <Box sx={{ mt: 2 }}>
            {messages.map((m) => (
              <Card key={m.id} variant="outlined" sx={{ mb: 1, bgcolor: "rgba(0,0,0,0.2)" }}>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(m.created_at).toLocaleString()} · {m.author_id.slice(0, 8)}…
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: "pre-wrap" }}>
                    {m.content}
                  </Typography>
                </CardContent>
              </Card>
            ))}
            {!messages.length ? <Typography color="text.secondary">No messages yet.</Typography> : null}
          </Box>
        </Box>
      ) : null}

      {tab === 1 && isApproved ? (
        <Box>
          {(isLeader || group.event_create_policy === "any_member") ? (
            <Button variant="outlined" sx={{ mb: 2 }} onClick={() => setEventOpen(true)}>
              New Mobilize event
            </Button>
          ) : null}
          {events.map((e) => (
            <Card key={e.id} variant="outlined" sx={{ mb: 1, bgcolor: "rgba(0,0,0,0.2)" }}>
              <CardContent>
                <Typography fontWeight={600}>{e.title}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(e.date_time).toLocaleString()} · {e.event_type}
                  {e.is_public ? " · public" : ""}
                </Typography>
                <Box sx={{ mt: 1, display: "flex", gap: 1, flexWrap: "wrap" }}>
                  <Button size="small" onClick={() => void setRsvp(e.id, "yes")}>
                    RSVP yes
                  </Button>
                  <Button size="small" onClick={() => void setRsvp(e.id, "maybe")}>
                    Maybe
                  </Button>
                  <Button size="small" onClick={() => void setRsvp(e.id, "no")}>
                    No
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))}
          {!events.length ? <Typography color="text.secondary">No events yet.</Typography> : null}
        </Box>
      ) : null}

      {tab === 2 && isLeader ? (
        <Box>
          {members
            .filter((m) => m.membership_status === "pending")
            .map((m) => (
              <Card key={m.id} variant="outlined" sx={{ mb: 1, bgcolor: "rgba(0,0,0,0.2)" }}>
                <CardContent sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
                  <Typography variant="body2">
                    User {m.user_id.slice(0, 8)}… — pending
                  </Typography>
                  <Button size="small" onClick={() => void approveMember(m.user_id, "approved")}>
                    Approve
                  </Button>
                  <Button size="small" color="error" onClick={() => void approveMember(m.user_id, "rejected")}>
                    Reject
                  </Button>
                </CardContent>
              </Card>
            ))}
          {!members.filter((m) => m.membership_status === "pending").length ? (
            <Typography color="text.secondary">No pending requests.</Typography>
          ) : null}
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
            All members
          </Typography>
          {members.map((m) => (
            <Typography key={m.id} variant="body2">
              {m.user_id.slice(0, 8)}… — {m.member_role} — {m.membership_status}
            </Typography>
          ))}
        </Box>
      ) : null}

      <Dialog open={eventOpen} onClose={() => setEventOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>New Mobilize event</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Title"
              required
              fullWidth
              value={eventForm.title}
              onChange={(e) => setEventForm((f) => ({ ...f, title: e.target.value }))}
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              minRows={2}
              value={eventForm.description}
              onChange={(e) => setEventForm((f) => ({ ...f, description: e.target.value }))}
            />
            <TextField
              label="Date & time (local)"
              type="datetime-local"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={eventForm.date_time}
              onChange={(e) => setEventForm((f) => ({ ...f, date_time: e.target.value }))}
            />
            <FormControl fullWidth>
              <InputLabel id="et">Type</InputLabel>
              <Select
                labelId="et"
                label="Type"
                value={eventForm.event_type}
                onChange={(e) => setEventForm((f) => ({ ...f, event_type: String(e.target.value) }))}
              >
                {MOBILIZE_EVENT_TYPES.map((t) => (
                  <MenuItem key={t} value={t}>
                    {t}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant={eventForm.is_public ? "contained" : "outlined"}
              onClick={() => setEventForm((f) => ({ ...f, is_public: !f.is_public }))}
            >
              {eventForm.is_public ? "Public listing: on" : "Public listing: off"}
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEventOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => void createEvent()}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
