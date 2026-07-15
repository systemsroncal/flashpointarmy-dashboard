"use client";

import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import {
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  Link as MuiLink,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MobilizeContentPanel } from "@/components/mobilize/MobilizeContentPanel";
import MobilizeGroupCoverDropzone from "@/components/mobilize/MobilizeGroupCoverDropzone";
import MobilizeGroupListedSwitch from "@/components/mobilize/MobilizeGroupListedSwitch";
import { useMobilizeToast } from "@/components/mobilize/MobilizeToastProvider";
import {
  enrollmentModeLabel,
  type MobilizeEnrollmentMode,
} from "@/lib/mobilize/chapter-subgroup";
import { MOBILIZE_GROUP_TYPES } from "@/lib/mobilize/constants";
import type { MobilizeGroupLeaderBrief } from "@/lib/mobilize/enrich-groups-browse";
import { mobilizeGroupInitials } from "@/lib/mobilize/group-initials";
import {
  isMobilizeGroupListed,
  mobilizeGroupListingVisibilityFromListed,
} from "@/lib/mobilize/group-ui-labels";
import { publicAssetSrc } from "@/lib/media/public-asset-url";

type ChapterRow = {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  cover_image_url?: string | null;
  parent_group_id?: string | null;
};

type GroupRow = {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  cover_image_url?: string | null;
  schedule_meeting?: string | null;
  enrollment_mode?: string;
  visibility: string;
  member_count?: number;
  leaders?: MobilizeGroupLeaderBrief[];
  my_membership_status?: string | null;
  created_by?: string;
};

export default function ChapterGroupsClient({ chapterId }: { chapterId: string }) {
  const toast = useMobilizeToast();
  const [chapter, setChapter] = useState<ChapterRow | null>(null);
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [canCreate, setCanCreate] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    group_type: "other",
    description: "",
    schedule_meeting: "",
    address: "",
    latitude: null as number | null,
    longitude: null as number | null,
    cover_image_url: "",
    enrollment_mode: "request_to_join" as MobilizeEnrollmentMode,
    visibility: "private",
    event_create_policy: "any_member" as "any_member" | "leader_only",
    wall_post_policy: "all_approved" as "all_approved" | "leaders_only",
    resources_post_policy: "all_approved" as "all_approved" | "leaders_only",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [chRes, gRes, createRes] = await Promise.all([
        fetch(`/api/mobilize/groups/${chapterId}`),
        fetch(`/api/mobilize/groups?parent_id=${encodeURIComponent(chapterId)}&visibility=all`),
        fetch("/api/mobilize/can-create-group"),
      ]);
      const chJson = await chRes.json();
      if (!chRes.ok) throw new Error(chJson.error || "Failed to load chapter.");
      const ch = chJson.group as ChapterRow;
      if (ch.parent_group_id != null) {
        throw new Error("This is a group, not a chapter.");
      }
      setChapter(ch);

      const gJson = await gRes.json();
      if (!gRes.ok) throw new Error(gJson.error || "Failed to load groups.");
      setGroups((gJson.groups ?? []) as GroupRow[]);

      const cJson = await createRes.json();
      if (createRes.ok) setCanCreate(Boolean(cJson.canCreate));
    } catch (e) {
      toast(e instanceof Error ? e.message : "Load failed.", "error");
    } finally {
      setLoading(false);
    }
  }, [chapterId, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter((g) => g.name.toLowerCase().includes(q));
  }, [groups, search]);

  async function joinGroup(groupId: string) {
    try {
      const res = await fetch(`/api/mobilize/groups/${groupId}/join`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Join failed.");
      const status = json.membership?.membership_status;
      toast(status === "approved" ? "You joined this group." : "Join request sent.", "success");
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Join failed.", "error");
    }
  }

  async function geocodeAddress() {
    const q = form.address.trim();
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
      setForm((f) => ({
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

  async function submitCreate() {
    if (!form.name.trim()) {
      toast("Name is required.", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/mobilize/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          group_type: form.group_type,
          description: form.description.trim() || null,
          schedule_meeting: form.schedule_meeting.trim() || null,
          address: form.address.trim() || null,
          latitude: form.latitude,
          longitude: form.longitude,
          cover_image_url: form.cover_image_url.trim() || null,
          parent_group_id: chapterId,
          enrollment_mode: form.enrollment_mode === "auto_closed" ? "closed" : form.enrollment_mode,
          visibility: form.visibility,
          event_create_policy: form.event_create_policy,
          wall_post_policy: form.wall_post_policy,
          resources_post_policy: form.resources_post_policy,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Create failed.");
      toast("Group created.", "success");
      setCreateOpen(false);
      setForm({
        name: "",
        group_type: "other",
        description: "",
        schedule_meeting: "",
        address: "",
        latitude: null,
        longitude: null,
        cover_image_url: "",
        enrollment_mode: "request_to_join",
        visibility: "private",
        event_create_policy: "any_member",
        wall_post_policy: "all_approved",
        resources_post_policy: "all_approved",
      });
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Create failed.", "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <Skeleton variant="rectangular" height={420} sx={{ borderRadius: 2 }} />;
  }

  if (!chapter) {
    return (
      <Typography color="text.secondary">Chapter not found.</Typography>
    );
  }

  return (
    <Box>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} gap={2} sx={{ mb: 2 }}>
        <Box>
          <Button
            component={Link}
            href="/dashboard/mobilize/map"
            startIcon={<ArrowBackIcon />}
            size="small"
            sx={{ mb: 1 }}
          >
            Back to chapters
          </Button>
          <Typography variant="h4" fontWeight={700}>
            {chapter.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 720 }}>
            Groups you can join under this chapter. Joining a group does not require joining the chapter.
          </Typography>
        </Box>
        {canCreate ? (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
            New group
          </Button>
        ) : null}
      </Stack>

      <MobilizeContentPanel>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }} alignItems={{ sm: "center" }}>
          <TextField
            size="small"
            label="Search by name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: 240 }}
          />
          <Typography variant="body2" color="text.secondary">
            {filtered.length} Groups
          </Typography>
        </Stack>

        <TableContainer
          sx={{
            bgcolor: "#fff",
            border: "1px solid rgba(0,0,0,0.12)",
            borderRadius: 1,
          }}
        >
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 56 }} />
                <TableCell sx={{ fontWeight: 700, color: "text.secondary" }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "text.secondary" }}>Leader names</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: "text.secondary", width: 100 }}>
                  Members
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: "text.secondary", width: 150 }}>Enrollment</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "text.secondary" }}>Contact</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: "text.secondary", width: 140 }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                      No groups in this chapter yet.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((g) => {
                  const cover = g.cover_image_url ? publicAssetSrc(g.cover_image_url) : undefined;
                  const leaders = g.leaders ?? [];
                  const enrollment = enrollmentModeLabel(g.enrollment_mode);
                  const st = g.my_membership_status;
                  const contact = leaders[0]?.email ?? "—";
                  const publicHref = `/g/${g.id}`;
                  return (
                    <TableRow key={g.id} hover>
                      <TableCell>
                        <Avatar
                          src={cover}
                          variant="rounded"
                          sx={{ width: 40, height: 40, bgcolor: "grey.800", fontSize: "0.75rem" }}
                        >
                          {mobilizeGroupInitials(g.name)}
                        </Avatar>
                      </TableCell>
                      <TableCell>
                        <Typography
                          component={Link}
                          href={`/dashboard/mobilize/groups/${g.id}`}
                          fontWeight={700}
                          color="inherit"
                          sx={{ textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
                        >
                          {g.name}
                        </Typography>
                        {g.schedule_meeting ? (
                          <Typography variant="caption" color="text.secondary" display="block" noWrap title={g.schedule_meeting}>
                            {g.schedule_meeting}
                          </Typography>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        {leaders.length ? (
                          <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                            {leaders.slice(0, 3).map((L) => (
                              <Stack key={L.user_id} direction="row" spacing={0.5} alignItems="center">
                                <Avatar src={L.avatar_url ?? undefined} sx={{ width: 22, height: 22, fontSize: "0.65rem" }}>
                                  {(L.full_name || "?").slice(0, 1)}
                                </Avatar>
                                <Typography variant="caption">{L.full_name}</Typography>
                              </Stack>
                            ))}
                            {leaders.length > 3 ? (
                              <Typography variant="caption" color="text.secondary">
                                +{leaders.length - 3}
                              </Typography>
                            ) : null}
                          </Stack>
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            —
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">{g.member_count ?? 0}</TableCell>
                      <TableCell>
                        <Typography variant="body2">{enrollment}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" noWrap title={contact}>
                          {contact}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end" alignItems="center">
                          {st === "approved" ? (
                            <Chip size="small" label="Joined" color="success" variant="outlined" />
                          ) : st === "pending" ? (
                            <Chip size="small" label="Pending" color="warning" variant="outlined" />
                          ) : g.enrollment_mode === "closed" || g.enrollment_mode === "auto_closed" ? (
                            <Chip size="small" label="Closed" variant="outlined" />
                          ) : (
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<PersonAddIcon />}
                              onClick={() => void joinGroup(g.id)}
                            >
                              {g.enrollment_mode === "open_signup" ? "Join" : "Request"}
                            </Button>
                          )}
                          <Tooltip title="Open group">
                            <IconButton
                              component={Link}
                              href={`/dashboard/mobilize/groups/${g.id}`}
                              size="small"
                              color="primary"
                            >
                              <OpenInNewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Public profile">
                            <IconButton component={Link} href={publicHref} target="_blank" size="small">
                              <MuiLink component="span" sx={{ fontSize: 12, textDecoration: "none" }}>
                                URL
                              </MuiLink>
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </MobilizeContentPanel>

      <Dialog open={createOpen} onClose={() => !saving && setCreateOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>New group</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Name"
              required
              fullWidth
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <FormControl fullWidth>
              <InputLabel id="gt-new">Type</InputLabel>
              <Select
                labelId="gt-new"
                label="Type"
                value={form.group_type}
                onChange={(e) => setForm((f) => ({ ...f, group_type: String(e.target.value) }))}
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
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
            <TextField
              label="Schedule meeting"
              fullWidth
              multiline
              minRows={2}
              placeholder="e.g. Meets weekly on Saturdays from 6–8pm"
              value={form.schedule_meeting}
              onChange={(e) => setForm((f) => ({ ...f, schedule_meeting: e.target.value }))}
            />
            <FormControl fullWidth>
              <InputLabel id="enroll">Enrollment</InputLabel>
              <Select
                labelId="enroll"
                label="Enrollment"
                value={form.enrollment_mode}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    enrollment_mode: e.target.value as MobilizeEnrollmentMode,
                  }))
                }
              >
                <MenuItem value="request_to_join">Request to join (private)</MenuItem>
                <MenuItem value="open_signup">Open signup (public)</MenuItem>
                <MenuItem value="closed">Closed</MenuItem>
              </Select>
            </FormControl>
            <MobilizeGroupCoverDropzone
              value={form.cover_image_url}
              onChange={(url) => setForm((f) => ({ ...f, cover_image_url: url }))}
              disabled={saving}
            />
            <TextField
              label="Address"
              fullWidth
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            />
            <Button variant="outlined" onClick={() => void geocodeAddress()} disabled={saving}>
              Geocode address
            </Button>
            <MobilizeGroupListedSwitch
              listed={isMobilizeGroupListed(form.visibility)}
              disabled={saving}
              onListedChange={(listed) =>
                setForm((f) => ({
                  ...f,
                  visibility: mobilizeGroupListingVisibilityFromListed(listed),
                }))
              }
            />
            <FormControl fullWidth>
              <InputLabel id="ecp-new">Who can create events</InputLabel>
              <Select
                labelId="ecp-new"
                label="Who can create events"
                value={form.event_create_policy}
                onChange={(e) =>
                  setForm((f) => ({
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
              <InputLabel id="wpp-new">Who can post announcements</InputLabel>
              <Select
                labelId="wpp-new"
                label="Who can post announcements"
                value={form.wall_post_policy}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    wall_post_policy: e.target.value as "all_approved" | "leaders_only",
                  }))
                }
              >
                <MenuItem value="all_approved">All approved members</MenuItem>
                <MenuItem value="leaders_only">Leaders only</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="rpp-new">Who can add resources</InputLabel>
              <Select
                labelId="rpp-new"
                label="Who can add resources"
                value={form.resources_post_policy}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    resources_post_policy: e.target.value as "all_approved" | "leaders_only",
                  }))
                }
              >
                <MenuItem value="all_approved">All approved members</MenuItem>
                <MenuItem value="leaders_only">Leaders only</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={() => void submitCreate()} disabled={saving}>
            Create group
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
