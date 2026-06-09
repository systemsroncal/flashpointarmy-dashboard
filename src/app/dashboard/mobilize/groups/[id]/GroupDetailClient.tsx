"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Autocomplete,
  Avatar,
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
  FormControlLabel,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Skeleton,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import ViewListIcon from "@mui/icons-material/ViewList";
import Link from "next/link";
import { MOBILIZE_EVENT_TYPES, MOBILIZE_GROUP_TYPES } from "@/lib/mobilize/constants";
import { labelEventCreatePolicy, labelWallPostPolicy } from "@/lib/mobilize/group-ui-labels";
import { publicAssetSrc } from "@/lib/media/public-asset-url";
import MobilizeGroupCoverDropzone from "@/components/mobilize/MobilizeGroupCoverDropzone";
import { useDashboardUser } from "@/contexts/DashboardUserContext";
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
  wall_post_policy?: string;
  cover_image_url?: string | null;
  created_by: string;
  created_at: string;
};

type Membership = {
  member_role: string;
  membership_status: string;
} | null;

type MessageRow = {
  id: string;
  author_id: string;
  content: string;
  comments_policy?: string;
  created_at: string;
};

type EventRow = {
  id: string;
  title: string;
  description?: string | null;
  date_time: string;
  event_type: string;
  is_public: boolean;
  created_by: string;
  my_rsvp?: "yes" | "maybe" | "no" | null;
};

type MemberRow = {
  id: string;
  user_id: string;
  member_role: string;
  membership_status: string;
  created_at: string;
  display_name?: string;
  email?: string | null;
  avatar_url?: string | null;
  state?: string | null;
};

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

function dateTimeLocalFromIso(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function MobilizeSectionEmptyState({ icon, message }: { icon: ReactNode; message: string }) {
  return (
    <Card variant="outlined" sx={{ bgcolor: "rgba(0,0,0,0.2)", borderColor: "rgba(255,215,0,0.12)" }}>
      <CardContent>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "center", sm: "flex-start" }}
          spacing={1.5}
          useFlexGap
          sx={{ textAlign: { xs: "center", sm: "left" } }}
        >
          <Box sx={{ flexShrink: 0, color: "text.secondary", display: "flex" }}>{icon}</Box>
          <Typography variant="body1" color="text.secondary">
            {message}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}

function JoinToViewGate({
  section,
  onJoin,
  showJoinButton,
  isPending,
}: {
  section: "announcements" | "events" | "members";
  onJoin: () => void;
  showJoinButton: boolean;
  isPending: boolean;
}) {
  const sectionLabel =
    section === "announcements"
      ? "announcements"
      : section === "events"
        ? "events and activities"
        : "members";

  const message = isPending
    ? "Your join request is pending. A group leader must approve it before you can view this section."
    : `Join this group to view ${sectionLabel}.`;

  return (
    <Card variant="outlined" sx={{ bgcolor: "rgba(0,0,0,0.2)", borderColor: "rgba(255,215,0,0.12)" }}>
      <CardContent>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "stretch", sm: "center" }}
          spacing={2}
          useFlexGap
        >
          <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ flex: 1, minWidth: 0 }}>
            <WarningAmberOutlinedIcon
              color="warning"
              sx={{ fontSize: 40, flexShrink: 0, mt: 0.25 }}
            />
            <Typography variant="body1" color="text.primary">
              {message}
            </Typography>
          </Stack>
          {showJoinButton ? (
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={() => void onJoin()}
              sx={{ alignSelf: { xs: "stretch", sm: "center" }, flexShrink: 0 }}
            >
              Join now
            </Button>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function GroupDetailClient({ groupId }: { groupId: string }) {
  const toast = useMobilizeToast();
  const me = useDashboardUser();
  const [tab, setTab] = useState(0);
  const [group, setGroup] = useState<Group | null>(null);
  const [membership, setMembership] = useState<Membership>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [wallInput, setWallInput] = useState("");
  const [leaderCommentsPolicy, setLeaderCommentsPolicy] = useState<"everyone" | "leaders_only">("everyone");
  const [eventOpen, setEventOpen] = useState(false);
  const [eventsView, setEventsView] = useState<"list" | "calendar">("list");
  const [eventCalCursor, setEventCalCursor] = useState(() => new Date());
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    date_time: "",
    event_type: "meeting",
    is_public: false,
  });
  const [editEventOpen, setEditEventOpen] = useState(false);
  const [editEventId, setEditEventId] = useState<string | null>(null);
  const [editEventForm, setEditEventForm] = useState({
    title: "",
    description: "",
    date_time: "",
    event_type: "meeting",
    is_public: false,
  });
  const [deleteDialog, setDeleteDialog] = useState<{ id: string; title: string } | null>(null);
  const [eventSaving, setEventSaving] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    group_type: "reading",
    description: "",
    address: "",
    latitude: null as number | null,
    longitude: null as number | null,
    visibility: "public",
    event_create_policy: "any_member" as "any_member" | "leader_only",
    cover_image_url: "",
    wall_post_policy: "all_approved" as "all_approved" | "leaders_only",
    created_by: "",
    leader_user_ids: [] as string[],
  });
  const [ownerCandidates, setOwnerCandidates] = useState<{ userId: string; label: string }[]>([]);
  const [ownerCandidatesLoading, setOwnerCandidatesLoading] = useState(false);
  const [msgEdit, setMsgEdit] = useState<{
    id: string;
    content: string;
    comments_policy: "everyone" | "leaders_only";
  } | null>(null);

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
  const isSuperAdmin = me.role_names.includes("super_admin");

  const loadOwnerCandidates = useCallback(async () => {
    if (!isSuperAdmin) return;
    setOwnerCandidatesLoading(true);
    try {
      const res = await fetch(`/api/mobilize/groups/${groupId}/owner-candidates`);
      const json = (await res.json()) as {
        candidates?: { userId: string; label: string }[];
        error?: string;
      };
      if (!res.ok) throw new Error(json.error || "Failed to load owner options.");
      setOwnerCandidates(json.candidates ?? []);
    } catch (e) {
      setOwnerCandidates([]);
      toast(e instanceof Error ? e.message : "Failed to load owner options.", "error");
    } finally {
      setOwnerCandidatesLoading(false);
    }
  }, [groupId, isSuperAdmin, toast]);

  useEffect(() => {
    if (isSuperAdmin) void loadOwnerCandidates();
  }, [isSuperAdmin, loadOwnerCandidates]);

  const selectedOwnerCandidate = useMemo(
    () => ownerCandidates.find((c) => c.userId === editForm.created_by) ?? null,
    [ownerCandidates, editForm.created_by]
  );

  const selectedLeaderCandidates = useMemo(
    () => ownerCandidates.filter((c) => editForm.leader_user_ids.includes(c.userId)),
    [ownerCandidates, editForm.leader_user_ids]
  );

  function canManageEvent(e: EventRow) {
    return isLeader || e.created_by === me.id;
  }

  useEffect(() => {
    if (!isApproved) return;
    void loadWall().catch(() => {});
    void loadEvents().catch(() => {});
    void loadMembers().catch(() => {});
  }, [isApproved, loadWall, loadEvents, loadMembers]);

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

  const wallPolicy = group?.wall_post_policy === "leaders_only" ? "leaders_only" : "all_approved";
  const canPostWall = isApproved && (isLeader || wallPolicy === "all_approved");

  async function postWall() {
    const content = wallInput.trim();
    if (!content) return;
    try {
      const body: { content: string; comments_policy?: string } = { content };
      if (isLeader) body.comments_policy = leaderCommentsPolicy;
      const res = await fetch(`/api/mobilize/groups/${groupId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Post failed.");
      setWallInput("");
      setLeaderCommentsPolicy("everyone");
      await loadWall();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Post failed.", "error");
    }
  }

  async function saveMessageEdit() {
    if (!msgEdit) return;
    try {
      const res = await fetch(`/api/mobilize/groups/${groupId}/messages/${msgEdit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isLeader
            ? {
                content: msgEdit.content.trim(),
                comments_policy: msgEdit.comments_policy,
              }
            : { content: msgEdit.content.trim() }
        ),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Update failed.");
      setMsgEdit(null);
      await loadWall();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Update failed.", "error");
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
      if (!res.ok) throw new Error(json.error || "Attendance update failed.");
      setEvents((prev) => prev.map((ev) => (ev.id === eventId ? { ...ev, my_rsvp: rsvp_status } : ev)));
      toast("Attendance saved.", "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Attendance update failed.", "error");
    }
  }

  function openEditEvent(e: EventRow) {
    setEditEventId(e.id);
    setEditEventForm({
      title: e.title,
      description: e.description ?? "",
      date_time: dateTimeLocalFromIso(e.date_time),
      event_type: e.event_type,
      is_public: e.is_public,
    });
    setEditEventOpen(true);
  }

  async function saveEditedEvent() {
    if (!editEventId) return;
    if (!editEventForm.title.trim() || !editEventForm.date_time) {
      toast("Title and date/time are required.", "error");
      return;
    }
    setEventSaving(true);
    try {
      const res = await fetch(`/api/mobilize/events/${editEventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editEventForm.title.trim(),
          description: editEventForm.description.trim() || null,
          date_time: new Date(editEventForm.date_time).toISOString(),
          event_type: editEventForm.event_type,
          is_public: editEventForm.is_public,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Update failed.");
      toast("Event updated.", "success");
      setEditEventOpen(false);
      setEditEventId(null);
      await loadEvents();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Update failed.", "error");
    } finally {
      setEventSaving(false);
    }
  }

  async function confirmDeleteEvent() {
    if (!deleteDialog) return;
    setEventSaving(true);
    try {
      const res = await fetch(`/api/mobilize/events/${deleteDialog.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Delete failed.");
      toast("Event deleted.", "success");
      setDeleteDialog(null);
      await loadEvents();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Delete failed.", "error");
    } finally {
      setEventSaving(false);
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

  async function setMemberRole(uid: string, role: "leader" | "member") {
    try {
      const res = await fetch(`/api/mobilize/groups/${groupId}/members/${uid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ member_role: role }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Role update failed.");
      toast("Role updated.", "success");
      await loadMembers();
      await loadGroup();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Role update failed.", "error");
    }
  }

  function openEditGroup() {
    if (!group) return;
    setEditForm({
      name: group.name,
      group_type: group.group_type,
      description: group.description ?? "",
      address: group.address ?? "",
      latitude: group.latitude,
      longitude: group.longitude,
      visibility: group.visibility,
      event_create_policy: group.event_create_policy === "leader_only" ? "leader_only" : "any_member",
      cover_image_url: group.cover_image_url?.trim() ?? "",
      wall_post_policy: group.wall_post_policy === "leaders_only" ? "leaders_only" : "all_approved",
      created_by: group.created_by,
      leader_user_ids: (() => {
        const ids = members
          .filter((m) => m.member_role === "leader" && m.membership_status === "approved")
          .map((m) => m.user_id);
        if (group.created_by && !ids.includes(group.created_by)) ids.push(group.created_by);
        return ids;
      })(),
    });
    if (isSuperAdmin && !ownerCandidates.length && !ownerCandidatesLoading) {
      void loadOwnerCandidates();
    }
    setEditOpen(true);
  }

  async function geocodeEditAddress() {
    const q = editForm.address.trim();
    if (q.length < 3) {
      toast("Enter a longer address to geocode.", "info");
      return;
    }
    try {
      const res = await fetch("/api/mobilize/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Geocode failed.");
      const hit = json.results?.[0];
      if (!hit) {
        toast("No geocode results.", "info");
        return;
      }
      setEditForm((f) => ({
        ...f,
        address: hit.display_name,
        latitude: hit.lat,
        longitude: hit.lon,
      }));
      toast("Address geocoded.", "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Geocode error.", "error");
    }
  }

  async function saveGroupEdit() {
    if (!editForm.name.trim()) {
      toast("Name is required.", "error");
      return;
    }
    if (isSuperAdmin && !editForm.created_by) {
      toast("Select a primary owner.", "error");
      return;
    }
    const leaderIds = isSuperAdmin
      ? [...new Set([...editForm.leader_user_ids, editForm.created_by].filter(Boolean))]
      : [];
    if (isSuperAdmin && leaderIds.length === 0) {
      toast("Add at least one group administrator.", "error");
      return;
    }
    setEditSaving(true);
    try {
      const cover =
        editForm.cover_image_url.trim() ? editForm.cover_image_url.trim() : null;
      const res = await fetch(`/api/mobilize/groups/${groupId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name.trim(),
          group_type: editForm.group_type,
          description: editForm.description.trim() || null,
          address: editForm.address.trim() || null,
          latitude: editForm.latitude,
          longitude: editForm.longitude,
          visibility: editForm.visibility,
          event_create_policy: editForm.event_create_policy,
          cover_image_url: cover,
          wall_post_policy: editForm.wall_post_policy,
          ...(isSuperAdmin
            ? {
                created_by: editForm.created_by,
                leader_user_ids: leaderIds,
              }
            : {}),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Update failed.");
      toast("Group updated.", "success");
      setEditOpen(false);
      await loadGroup();
      if (isApproved) await loadMembers();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Update failed.", "error");
    } finally {
      setEditSaving(false);
    }
  }

  const isPendingJoin = membership?.membership_status === "pending";
  const showJoin =
    !isApproved && !isPendingJoin && (!membership || membership.membership_status === "rejected");

  const eventWeeks = useMemo(() => {
    const first = startOfMonth(eventCalCursor);
    const startWeekday = first.getDay();
    const gridStart = new Date(first);
    gridStart.setDate(first.getDate() - startWeekday);
    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      days.push(d);
    }
    const chunks: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) chunks.push(days.slice(i, i + 7));
    return { chunks };
  }, [eventCalCursor]);

  function dayGroupEvents(day: Date) {
    const key = day.toDateString();
    return events.filter((e) => new Date(e.date_time).toDateString() === key);
  }

  const header = useMemo(() => {
    if (!group) return null;
    const cover =
      group.cover_image_url?.trim() ||
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&q=80";
    const coverSrc = publicAssetSrc(cover);
    return (
      <Box sx={{ mb: 2 }}>
        <Box
          component="img"
          src={coverSrc}
          alt=""
          sx={{
            width: "100%",
            minHeight: 280,
            maxHeight: 400,
            objectFit: "cover",
            borderRadius: 2,
            mb: 1.5,
            display: "block",
            bgcolor: "rgba(0,0,0,0.25)",
          }}
        />
        <Typography variant="h4" fontWeight={700}>
          {group.name}
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
          <Chip label={group.group_type} />
          <Chip label={group.visibility === "private" ? "Private" : "Public"} />
          <Chip label={labelEventCreatePolicy(group.event_create_policy)} variant="outlined" />
          <Chip
            label={labelWallPostPolicy(group.wall_post_policy === "leaders_only" ? "leaders_only" : "all_approved")}
            variant="outlined"
          />
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
          <Button
            variant="outlined"
            size="small"
            startIcon={<PersonAddIcon />}
            sx={{ mt: 2 }}
            onClick={() => void joinRequest()}
          >
            Join now
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

  const canEditGroup = isLeader || group.created_by === me.id || isSuperAdmin;
  const gridSx = {
    display: "grid",
    gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
    gap: 0.5,
  } as const;

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Button component={Link} href="/dashboard/mobilize/map" size="small">
          Back to map
        </Button>
        {canEditGroup ? (
          <Button size="small" variant="outlined" startIcon={<EditIcon />} onClick={() => openEditGroup()}>
            Edit group
          </Button>
        ) : null}
      </Stack>
      {header}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Announcements" />
        <Tab label="Events" />
        <Tab label="Members" />
      </Tabs>

      {tab === 0 && !isApproved ? (
        <JoinToViewGate
          section="announcements"
          onJoin={joinRequest}
          showJoinButton={showJoin}
          isPending={isPendingJoin}
        />
      ) : null}

      {tab === 0 && isApproved ? (
        <Box>
          {canPostWall ? (
            <>
              <TextField
                fullWidth
                multiline
                minRows={2}
                placeholder="Post a message, link, or activity idea…"
                value={wallInput}
                onChange={(e) => setWallInput(e.target.value)}
              />
              {isLeader ? (
                <FormControl component="fieldset" sx={{ mt: 1.5 }} variant="standard">
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                    Who can comment on this post (leaders only — not shown to members on announcements)
                  </Typography>
                  <RadioGroup
                    row
                    value={leaderCommentsPolicy}
                    onChange={(_, v) => setLeaderCommentsPolicy(v as "everyone" | "leaders_only")}
                  >
                    <FormControlLabel value="everyone" control={<Radio size="small" />} label="Everyone" />
                    <FormControlLabel value="leaders_only" control={<Radio size="small" />} label="Leaders only" />
                  </RadioGroup>
                </FormControl>
              ) : null}
              <Button sx={{ mt: 1 }} variant="contained" onClick={() => void postWall()}>
                Post
              </Button>
            </>
          ) : (
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Only leaders can post announcements.
            </Typography>
          )}
          <Box sx={{ mt: 2 }}>
            {messages.map((m) => {
              const canEdit = isLeader || m.author_id === me.id;
              const pol = m.comments_policy === "leaders_only" ? "Leaders only" : "Everyone";
              return (
                <Card key={m.id} variant="outlined" sx={{ mb: 1, bgcolor: "rgba(0,0,0,0.2)" }}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(m.created_at).toLocaleString()} · {m.author_id.slice(0, 8)}…
                        </Typography>
                        {isLeader ? (
                          <Chip size="small" label={`Comments: ${pol}`} sx={{ ml: 1 }} variant="outlined" />
                        ) : null}
                        <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: "pre-wrap" }}>
                          {m.content}
                        </Typography>
                      </Box>
                      {canEdit ? (
                        <Button
                          size="small"
                          onClick={() =>
                            setMsgEdit({
                              id: m.id,
                              content: m.content,
                              comments_policy:
                                m.comments_policy === "leaders_only" ? "leaders_only" : "everyone",
                            })
                          }
                        >
                          Edit
                        </Button>
                      ) : null}
                    </Stack>
                  </CardContent>
                </Card>
              );
            })}
            {!messages.length ? (
              <MobilizeSectionEmptyState
                icon={<CampaignOutlinedIcon sx={{ fontSize: 40 }} />}
                message="There are no announcements in this group yet."
              />
            ) : null}
          </Box>
        </Box>
      ) : null}

      {tab === 1 && !isApproved ? (
        <JoinToViewGate
          section="events"
          onJoin={joinRequest}
          showJoinButton={showJoin}
          isPending={isPendingJoin}
        />
      ) : null}

      {tab === 1 && isApproved ? (
        <Box>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }} flexWrap="wrap" gap={1}>
            {(isLeader || group.event_create_policy === "any_member") ? (
              <Button variant="outlined" onClick={() => setEventOpen(true)}>
                New Mobilize event
              </Button>
            ) : (
              <Box />
            )}
            <ToggleButtonGroup
              size="small"
              value={eventsView}
              exclusive
              onChange={(_, v) => v && setEventsView(v)}
              aria-label="Events view"
            >
              <ToggleButton value="list" aria-label="List" sx={{ px: 1.25 }}>
                <Tooltip title="List">
                  <ViewListIcon fontSize="small" />
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="calendar" aria-label="Calendar" sx={{ px: 1.25 }}>
                <Tooltip title="Calendar">
                  <CalendarMonthIcon fontSize="small" />
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>

          {eventsView === "list" ? (
            <>
              {events.map((e) => (
                <Card key={e.id} variant="outlined" sx={{ mb: 1, bgcolor: "rgba(0,0,0,0.2)" }}>
                  <CardContent>
                    <Typography fontWeight={600}>{e.title}</Typography>
                    {e.description ? (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, whiteSpace: "pre-wrap" }}>
                        {e.description}
                      </Typography>
                    ) : null}
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                      {new Date(e.date_time).toLocaleString()} · {e.event_type}
                      {e.is_public ? " · public" : ""}
                    </Typography>
                    <Box sx={{ mt: 1, display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
                      <Button
                        size="small"
                        variant={e.my_rsvp === "yes" ? "contained" : "outlined"}
                        onClick={() => void setRsvp(e.id, "yes")}
                      >
                        Yes
                      </Button>
                      <Button
                        size="small"
                        variant={e.my_rsvp === "maybe" ? "contained" : "outlined"}
                        onClick={() => void setRsvp(e.id, "maybe")}
                      >
                        Maybe
                      </Button>
                      <Button
                        size="small"
                        variant={e.my_rsvp === "no" ? "contained" : "outlined"}
                        onClick={() => void setRsvp(e.id, "no")}
                      >
                        No
                      </Button>
                    </Box>
                    {canManageEvent(e) ? (
                      <Stack direction="row" spacing={1} sx={{ mt: 1.5 }} flexWrap="wrap">
                        <Button size="small" variant="outlined" startIcon={<EditIcon />} onClick={() => openEditEvent(e)}>
                          Edit
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          variant="outlined"
                          startIcon={<DeleteOutlineIcon />}
                          onClick={() => setDeleteDialog({ id: e.id, title: e.title })}
                        >
                          Delete
                        </Button>
                      </Stack>
                    ) : null}
                  </CardContent>
                </Card>
              ))}
              {!events.length ? (
                <MobilizeSectionEmptyState
                  icon={<CalendarMonthOutlinedIcon sx={{ fontSize: 40 }} />}
                  message="There are no upcoming events in this group."
                />
              ) : null}
            </>
          ) : (
            <Box>
              <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1 }}>
                <Button size="small" onClick={() => setEventCalCursor(new Date(eventCalCursor.getFullYear(), eventCalCursor.getMonth() - 1, 1))}>
                  Prev
                </Button>
                <Typography variant="subtitle1" sx={{ flex: 1 }} fontWeight={600}>
                  {eventCalCursor.toLocaleString(undefined, { month: "long", year: "numeric" })}
                </Typography>
                <Button size="small" onClick={() => setEventCalCursor(new Date(eventCalCursor.getFullYear(), eventCalCursor.getMonth() + 1, 1))}>
                  Next
                </Button>
              </Stack>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                Events for this group only.
              </Typography>
              <Box sx={{ ...gridSx, mb: 0.5 }}>
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <Typography key={d} variant="caption" color="text.secondary" align="center" display="block">
                    {d}
                  </Typography>
                ))}
              </Box>
              {eventWeeks.chunks.map((week, wi) => (
                <Box sx={{ ...gridSx, mb: 0.5 }} key={wi}>
                  {week.map((day) => {
                    const inMonth =
                      day.getMonth() === eventCalCursor.getMonth() &&
                      day.getFullYear() === eventCalCursor.getFullYear();
                    const evs = dayGroupEvents(day);
                    return (
                      <Card
                        key={day.toISOString()}
                        variant="outlined"
                        sx={{
                          minHeight: 72,
                          bgcolor: inMonth ? "rgba(0,0,0,0.25)" : "rgba(0,0,0,0.1)",
                          borderColor: inMonth ? "rgba(255,215,0,0.12)" : "transparent",
                        }}
                      >
                        <CardContent sx={{ p: 0.5, "&:last-child": { pb: 0.5 } }}>
                          <Typography variant="caption" fontWeight={700}>
                            {day.getDate()}
                          </Typography>
                          {evs.slice(0, 2).map((e) => (
                            <Typography key={e.id} variant="caption" display="block" noWrap sx={{ lineHeight: 1.15 }}>
                              {e.title}
                            </Typography>
                          ))}
                          {evs.length > 2 ? (
                            <Typography variant="caption" color="text.secondary">
                              +{evs.length - 2}
                            </Typography>
                          ) : null}
                        </CardContent>
                      </Card>
                    );
                  })}
                </Box>
              ))}
            </Box>
          )}
        </Box>
      ) : null}

      {tab === 2 && !isApproved ? (
        <JoinToViewGate
          section="members"
          onJoin={joinRequest}
          showJoinButton={showJoin}
          isPending={isPendingJoin}
        />
      ) : null}

      {tab === 2 && isApproved ? (
        <Box>
          {isLeader ? (
            <>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Pending requests
              </Typography>
              {members
                .filter((m) => m.membership_status === "pending")
                .map((m) => (
                  <Card key={m.id} variant="outlined" sx={{ mb: 1, bgcolor: "rgba(0,0,0,0.2)" }}>
                    <CardContent sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
                      <Typography variant="body2">{m.display_name ?? m.user_id.slice(0, 8)}</Typography>
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
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                  No pending requests.
                </Typography>
              ) : null}
            </>
          ) : null}

          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
            Members
          </Typography>
          {members.length ? (
            <TableContainer
              sx={{
                borderRadius: 1,
                border: "1px solid rgba(255,215,0,0.12)",
                bgcolor: "rgba(0,0,0,0.15)",
              }}
            >
              <Table
                size="small"
                sx={{
                  "& .MuiTableCell-root": {
                    borderBottom: "none",
                  },
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell>Member</TableCell>
                    <TableCell sx={{ width: 72 }}>State</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Status</TableCell>
                    {isLeader ? <TableCell align="right">Actions</TableCell> : null}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {members.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Avatar src={m.avatar_url ?? undefined} sx={{ width: 36, height: 36 }}>
                            {(m.display_name ?? "?").slice(0, 1)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2">{m.display_name ?? m.user_id.slice(0, 8)}</Typography>
                            {m.email ? (
                              <Typography variant="caption" color="text.secondary">
                                {m.email}
                              </Typography>
                            ) : null}
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600} color="text.primary">
                          {m.state && String(m.state).trim() ? String(m.state).trim() : "—"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={0.75} flexWrap="wrap" useFlexGap>
                          <Typography variant="body2" component="span">
                            {m.member_role}
                          </Typography>
                          {group.created_by === m.user_id ? (
                            <Chip size="small" label="Primary owner" color="primary" variant="outlined" />
                          ) : null}
                        </Stack>
                      </TableCell>
                      <TableCell>{m.membership_status}</TableCell>
                    {isLeader ? (
                      <TableCell align="right">
                        {m.membership_status === "approved" && m.user_id !== me.id ? (
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end" flexWrap="wrap">
                            {m.member_role === "member" ? (
                              <Button size="small" onClick={() => void setMemberRole(m.user_id, "leader")}>
                                Make leader
                              </Button>
                            ) : (
                              <Button size="small" onClick={() => void setMemberRole(m.user_id, "member")}>
                                Demote
                              </Button>
                            )}
                          </Stack>
                        ) : null}
                      </TableCell>
                    ) : null}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <MobilizeSectionEmptyState
              icon={<GroupsOutlinedIcon sx={{ fontSize: 40 }} />}
              message="This group does not have any members yet. Approved members will appear here."
            />
          )}
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

      <Dialog open={editEventOpen} onClose={() => !eventSaving && setEditEventOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Edit Mobilize event</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Title"
              required
              fullWidth
              value={editEventForm.title}
              onChange={(e) => setEditEventForm((f) => ({ ...f, title: e.target.value }))}
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              minRows={2}
              value={editEventForm.description}
              onChange={(e) => setEditEventForm((f) => ({ ...f, description: e.target.value }))}
            />
            <TextField
              label="Date & time (local)"
              type="datetime-local"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={editEventForm.date_time}
              onChange={(e) => setEditEventForm((f) => ({ ...f, date_time: e.target.value }))}
            />
            <FormControl fullWidth>
              <InputLabel id="et-edit">Type</InputLabel>
              <Select
                labelId="et-edit"
                label="Type"
                value={editEventForm.event_type}
                onChange={(e) => setEditEventForm((f) => ({ ...f, event_type: String(e.target.value) }))}
              >
                {MOBILIZE_EVENT_TYPES.map((t) => (
                  <MenuItem key={t} value={t}>
                    {t}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant={editEventForm.is_public ? "contained" : "outlined"}
              onClick={() => setEditEventForm((f) => ({ ...f, is_public: !f.is_public }))}
            >
              {editEventForm.is_public ? "Public listing: on" : "Public listing: off"}
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => !eventSaving && setEditEventOpen(false)} disabled={eventSaving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={() => void saveEditedEvent()} disabled={eventSaving}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteDialog} onClose={() => !eventSaving && setDeleteDialog(null)} fullWidth maxWidth="xs">
        <DialogTitle>Delete event</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Delete &quot;{deleteDialog?.title}&quot;? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(null)} disabled={eventSaving}>
            Cancel
          </Button>
          <Button color="error" variant="contained" onClick={() => void confirmDeleteEvent()} disabled={eventSaving}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editOpen} onClose={() => !editSaving && setEditOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Edit group</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Name"
              required
              fullWidth
              value={editForm.name}
              onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
            />
            <FormControl fullWidth>
              <InputLabel id="egt">Type</InputLabel>
              <Select
                labelId="egt"
                label="Type"
                value={editForm.group_type}
                onChange={(e) => setEditForm((f) => ({ ...f, group_type: String(e.target.value) }))}
              >
                {MOBILIZE_GROUP_TYPES.map((t) => (
                  <MenuItem key={t} value={t}>
                    {t}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Description"
              fullWidth
              multiline
              minRows={2}
              value={editForm.description}
              onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
            />
            <MobilizeGroupCoverDropzone
              value={editForm.cover_image_url}
              onChange={(url) => setEditForm((f) => ({ ...f, cover_image_url: url }))}
              disabled={editSaving}
            />
            <TextField
              label="Address"
              fullWidth
              value={editForm.address}
              onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))}
            />
            <Button variant="outlined" onClick={() => void geocodeEditAddress()}>
              Geocode address
            </Button>
            {isSuperAdmin ? (
              <Stack spacing={2}>
                <Autocomplete
                  fullWidth
                  disableClearable
                  loading={ownerCandidatesLoading}
                  disabled={ownerCandidatesLoading || ownerCandidates.length === 0}
                  options={ownerCandidates}
                  value={selectedOwnerCandidate ?? undefined}
                  onChange={(_, option) => {
                    if (!option) return;
                    setEditForm((f) => {
                      const withoutPrev = f.leader_user_ids.filter((id) => id !== f.created_by);
                      const leaderIds = [...new Set([...withoutPrev, option.userId])];
                      return { ...f, created_by: option.userId, leader_user_ids: leaderIds };
                    });
                  }}
                  getOptionLabel={(c) => c.label}
                  isOptionEqualToValue={(a, b) => a.userId === b.userId}
                  filterOptions={(opts, state) => {
                    const q = state.inputValue.trim().toLowerCase();
                    if (!q) return opts;
                    return opts.filter((c) => c.label.toLowerCase().includes(q));
                  }}
                  noOptionsText={
                    ownerCandidatesLoading ? "Loading administrators…" : "No matching users"
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Primary owner"
                      placeholder="Search by name or role…"
                      helperText="Replaces the group owner on record. The previous primary owner is demoted to member unless listed below."
                    />
                  )}
                />
                <Autocomplete
                  multiple
                  fullWidth
                  disableCloseOnSelect
                  loading={ownerCandidatesLoading}
                  disabled={ownerCandidatesLoading || ownerCandidates.length === 0}
                  options={ownerCandidates}
                  value={selectedLeaderCandidates}
                  onChange={(_, options) => {
                    const ids = options.map((o) => o.userId);
                    setEditForm((f) => {
                      const withPrimary = f.created_by && !ids.includes(f.created_by)
                        ? [f.created_by, ...ids]
                        : ids;
                      return { ...f, leader_user_ids: [...new Set(withPrimary)] };
                    });
                  }}
                  getOptionLabel={(c) => c.label}
                  isOptionEqualToValue={(a, b) => a.userId === b.userId}
                  filterOptions={(opts, state) => {
                    const q = state.inputValue.trim().toLowerCase();
                    if (!q) return opts;
                    return opts.filter((c) => c.label.toLowerCase().includes(q));
                  }}
                  noOptionsText={
                    ownerCandidatesLoading ? "Loading administrators…" : "No matching users"
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Group administrators"
                      placeholder="Add one or more administrators…"
                      helperText="Leaders who can manage this group. Primary owner is always included."
                    />
                  )}
                />
              </Stack>
            ) : null}
            <FormControl fullWidth>
              <InputLabel id="ev">Visibility</InputLabel>
              <Select
                labelId="ev"
                label="Visibility"
                value={editForm.visibility}
                onChange={(e) => setEditForm((f) => ({ ...f, visibility: String(e.target.value) }))}
              >
                <MenuItem value="public">Public</MenuItem>
                <MenuItem value="private">Private</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="ecp">Who can create events</InputLabel>
              <Select
                labelId="ecp"
                label="Who can create events"
                value={editForm.event_create_policy}
                onChange={(e) =>
                  setEditForm((f) => ({
                    ...f,
                    event_create_policy: e.target.value as "any_member" | "leader_only",
                  }))
                }
              >
                <MenuItem value="any_member">Any approved member</MenuItem>
                <MenuItem value="leader_only">Leaders only</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="wpp">Who can post announcements</InputLabel>
              <Select
                labelId="wpp"
                label="Who can post announcements"
                value={editForm.wall_post_policy}
                onChange={(e) =>
                  setEditForm((f) => ({
                    ...f,
                    wall_post_policy: e.target.value as "all_approved" | "leaders_only",
                  }))
                }
              >
                <MenuItem value="all_approved">All approved members</MenuItem>
                <MenuItem value="leaders_only">Leaders only</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)} disabled={editSaving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={() => void saveGroupEdit()} disabled={editSaving}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!msgEdit} onClose={() => setMsgEdit(null)} fullWidth maxWidth="sm">
        <DialogTitle>Edit announcement</DialogTitle>
        <DialogContent>
          {msgEdit ? (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Content"
                fullWidth
                multiline
                minRows={3}
                value={msgEdit.content}
                onChange={(e) => setMsgEdit((s) => (s ? { ...s, content: e.target.value } : s))}
              />
              {isLeader ? (
                <FormControl fullWidth>
                  <InputLabel id="cpol">Who can comment</InputLabel>
                  <Select
                    labelId="cpol"
                    label="Who can comment"
                    value={msgEdit.comments_policy}
                    onChange={(e) =>
                      setMsgEdit((s) =>
                        s
                          ? {
                              ...s,
                              comments_policy: e.target.value as "everyone" | "leaders_only",
                            }
                          : s
                      )
                    }
                  >
                    <MenuItem value="everyone">Everyone</MenuItem>
                    <MenuItem value="leaders_only">Leaders only</MenuItem>
                  </Select>
                </FormControl>
              ) : null}
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMsgEdit(null)}>Cancel</Button>
          <Button variant="contained" onClick={() => void saveMessageEdit()}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
