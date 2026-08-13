"use client";

import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import GridViewOutlinedIcon from "@mui/icons-material/GridViewOutlined";
import ViewListOutlinedIcon from "@mui/icons-material/ViewListOutlined";
import { MobilizeAddMemberDialog } from "@/components/mobilize/MobilizeAddMemberDialog";
import { MobilizeDialog } from "@/components/mobilize/MobilizeDialog";
import {
  Avatar,
  Box,
  Button,
  Chip,
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
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MobilizeContentPanel } from "@/components/mobilize/MobilizeContentPanel";
import MobilizeGroupCoverDropzone from "@/components/mobilize/MobilizeGroupCoverDropzone";
import MobilizeGroupListedSwitch from "@/components/mobilize/MobilizeGroupListedSwitch";
import { useMobilizeToast } from "@/components/mobilize/MobilizeToastProvider";
import { useDashboardUser } from "@/contexts/DashboardUserContext";
import {
  enrollmentModeLabel,
  type MobilizeEnrollmentMode,
} from "@/lib/mobilize/chapter-subgroup";
import { MOBILIZE_GROUP_TYPES } from "@/lib/mobilize/constants";
import type { MobilizeGroupLeaderBrief } from "@/lib/mobilize/enrich-groups-browse";
import { mobilizeGroupInitials } from "@/lib/mobilize/group-initials";
import { mobilizeChapterCoverSrc } from "@/lib/mobilize/mobilize-chapter-cover";
import {
  isMobilizeGroupListed,
  mobilizeGroupListingVisibilityFromListed,
} from "@/lib/mobilize/group-ui-labels";
import {
  mobilizeChapterDetailRootSx,
  mobilizeJoinGroupButtonSx,
  mobilizeTableContainerSx,
} from "@/lib/mobilize/mobilize-ui-surface";
import { publicAssetSrc } from "@/lib/media/public-asset-url";

type ViewMode = "grid" | "list";

type ChapterRow = {
  id: string;
  name: string;
  group_type: string;
  description: string | null;
  address: string | null;
  latitude?: number | null;
  longitude?: number | null;
  visibility: string;
  cover_image_url?: string | null;
  parent_group_id?: string | null;
  created_by?: string;
  region_code?: string | null;
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
  is_featured?: boolean | null;
};

export default function ChapterGroupsClient({ chapterId }: { chapterId: string }) {
  const toast = useMobilizeToast();
  const me = useDashboardUser();
  const [chapter, setChapter] = useState<ChapterRow | null>(null);
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [canCreate, setCanCreate] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [addMemberGroup, setAddMemberGroup] = useState<GroupRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    group_type: "other",
    description: "",
    schedule_meeting: "",
    address: "",
    latitude: null as number | null,
    longitude: null as number | null,
    cover_image_url: "",
    profile_image_url: "",
    enrollment_mode: "request_to_join" as MobilizeEnrollmentMode,
    visibility: "private",
    event_create_policy: "any_member" as "any_member" | "leader_only",
    wall_post_policy: "all_approved" as "all_approved" | "leaders_only",
    resources_post_policy: "all_approved" as "all_approved" | "leaders_only",
    parent_group_id: chapterId,
    is_featured: false,
  });
  const [chapterOptions, setChapterOptions] = useState<{ id: string; name: string }[]>([]);
  const [editForm, setEditForm] = useState({
    name: "",
    group_type: "other",
    description: "",
    address: "",
    latitude: null as number | null,
    longitude: null as number | null,
    visibility: "public",
    cover_image_url: "",
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

  const isSuperAdmin = me.role_names.includes("super_admin");
  const canEditChapter =
    Boolean(chapter) && (isSuperAdmin || chapter?.created_by === me.id);

  // Matches canManageMobilizeGroupMembers on the server: site staff, group owner,
  // chapter owner, or an approved leader of this group may add members directly.
  function canAddMemberToGroup(g: GroupRow) {
    return (
      isSuperAdmin ||
      me.role_names.includes("admin") ||
      g.created_by === me.id ||
      chapter?.created_by === me.id ||
      (g.leaders ?? []).some((l) => l.user_id === me.id)
    );
  }

  function openCreateGroup() {
    setForm((f) => ({ ...f, parent_group_id: chapterId }));
    if (isSuperAdmin && chapterOptions.length === 0) {
      void (async () => {
        try {
          const res = await fetch("/api/mobilize/groups?scope=chapters&visibility=all");
          const json = await res.json();
          if (res.ok && Array.isArray(json.groups)) {
            setChapterOptions(
              (json.groups as { id: string; name: string }[]).map((g) => ({
                id: g.id,
                name: g.name,
              }))
            );
          }
        } catch {
          /* ignore */
        }
      })();
    }
    setCreateOpen(true);
  }

  function openEditChapter() {
    if (!chapter) return;
    setEditForm({
      name: chapter.name,
      group_type: chapter.group_type || "other",
      description: chapter.description ?? "",
      address: chapter.address ?? "",
      latitude: chapter.latitude ?? null,
      longitude: chapter.longitude ?? null,
      visibility: chapter.visibility,
      cover_image_url: chapter.cover_image_url?.trim() ?? "",
    });
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

  async function saveChapterEdit() {
    if (!editForm.name.trim()) {
      toast("Name is required.", "error");
      return;
    }
    setEditSaving(true);
    try {
      const cover = editForm.cover_image_url.trim() ? editForm.cover_image_url.trim() : null;
      const res = await fetch(`/api/mobilize/groups/${chapterId}`, {
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
          cover_image_url: cover,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Update failed.");
      toast("Chapter updated.", "success");
      setEditOpen(false);
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Update failed.", "error");
    } finally {
      setEditSaving(false);
    }
  }

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
          profile_image_url: form.profile_image_url.trim() || null,
          parent_group_id: form.parent_group_id || chapterId,
          enrollment_mode: form.enrollment_mode === "auto_closed" ? "closed" : form.enrollment_mode,
          visibility: form.visibility,
          event_create_policy: form.event_create_policy,
          wall_post_policy: form.wall_post_policy,
          resources_post_policy: form.resources_post_policy,
          is_featured: form.is_featured === true,
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
        profile_image_url: "",
        enrollment_mode: "request_to_join",
        visibility: "private",
        event_create_policy: "any_member",
        wall_post_policy: "all_approved",
        resources_post_policy: "all_approved",
        parent_group_id: chapterId,
        is_featured: false,
      });
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Create failed.", "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Box sx={mobilizeChapterDetailRootSx}>
        <Skeleton variant="text" width={160} height={36} sx={{ mb: 1, flexShrink: 0 }} />
        <Skeleton variant="text" width={280} height={44} sx={{ mb: 0.5, flexShrink: 0 }} />
        <Skeleton variant="text" width={80} height={24} sx={{ mb: 2, flexShrink: 0 }} />
        <Skeleton variant="rectangular" sx={{ borderRadius: 2, flex: 1, minHeight: 240 }} />
      </Box>
    );
  }

  if (!chapter) {
    return <Typography color="text.secondary">Chapter not found.</Typography>;
  }

  function groupStatusChip(g: GroupRow) {
    const st = g.my_membership_status;
    if (st === "approved") return { label: "Joined", color: "success" as const };
    if (st === "pending") return { label: "Pending", color: "warning" as const };
    if (g.enrollment_mode === "closed" || g.enrollment_mode === "auto_closed") {
      return { label: "Closed", color: "default" as const };
    }
    return { label: "Open", color: "success" as const };
  }

  function renderGroupGrid() {
    if (!filtered.length) {
      return (
        <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
          No groups in this chapter yet.
        </Typography>
      );
    }

    return (
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            lg: "repeat(3, minmax(0, 1fr))",
          },
          gap: 2,
        }}
      >
        {filtered.map((g) => {
          // Groups usually have no banner yet, so fall back to the default chapter
          // cover (same fallback as the group detail hero), matching its look.
          const cover = publicAssetSrc(mobilizeChapterCoverSrc(g.cover_image_url));
          const enrollment = enrollmentModeLabel(g.enrollment_mode);
          const listed = isMobilizeGroupListed(g.visibility);
          const status = groupStatusChip(g);
          const detailHref = `/dashboard/mobilize/groups/${g.id}`;

          return (
            <Box
              key={g.id}
              sx={{
                borderRadius: 2,
                overflow: "hidden",
                border: "1px solid rgba(0,0,0,0.1)",
                bgcolor: "#fff",
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
              }}
            >
              <Box sx={{ position: "relative", aspectRatio: "16 / 10", bgcolor: "#1a2744" }}>
                <Box
                  component={Link}
                  href={detailHref}
                  aria-label={`Open group ${g.name}`}
                  sx={{
                    display: "block",
                    width: "100%",
                    height: "100%",
                    "&:hover img": { transform: "scale(1.04)" },
                  }}
                >
                  <Box
                    component="img"
                    src={cover}
                    alt={g.name}
                    sx={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                      transition: "transform 0.25s ease",
                    }}
                  />
                </Box>
                <Tooltip title="Open group">
                  <IconButton
                    component={Link}
                    href={detailHref}
                    size="small"
                    sx={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      bgcolor: "rgba(0,0,0,0.45)",
                      color: "#fff",
                      "&:hover": { bgcolor: "rgba(0,0,0,0.6)" },
                    }}
                  >
                    <OpenInNewIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <Box sx={{ p: 1.5, flex: 1, display: "flex", flexDirection: "column", gap: 0.75 }}>
                <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={1}>
                  <Typography
                    component={Link}
                    href={detailHref}
                    fontWeight={700}
                    color="text.primary"
                    sx={{
                      textDecoration: "none",
                      lineHeight: 1.25,
                      "&:hover": { textDecoration: "underline" },
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    {g.name}
                  </Typography>
                  <Chip size="small" label={status.label} color={status.color} variant="outlined" sx={{ flexShrink: 0 }} />
                </Stack>
                {g.is_featured ? (
                  <Chip size="small" label="Featured" color="primary" variant="outlined" sx={{ alignSelf: "flex-start" }} />
                ) : null}
                {g.schedule_meeting ? (
                  <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                    {g.schedule_meeting}
                  </Typography>
                ) : null}
                <Typography variant="caption" color="text.secondary" sx={{ mt: "auto" }}>
                  {listed ? "Listed" : "Link only"} · {g.member_count ?? 0} members · {enrollment}
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
                  {g.my_membership_status !== "approved" &&
                  g.enrollment_mode !== "closed" &&
                  g.enrollment_mode !== "auto_closed" ? (
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<PersonAddIcon />}
                      onClick={() => void joinGroup(g.id)}
                      sx={{ alignSelf: "flex-start", ...mobilizeJoinGroupButtonSx }}
                    >
                      {g.enrollment_mode === "open_signup" ? "Join group" : "Request to join"}
                    </Button>
                  ) : null}
                  {canAddMemberToGroup(g) ? (
                    <Button
                      size="small"
                      variant="outlined"
                      color="primary"
                      startIcon={<GroupAddIcon />}
                      onClick={() => setAddMemberGroup(g)}
                      sx={{ alignSelf: "flex-start", textTransform: "none", borderRadius: 99 }}
                    >
                      Add member
                    </Button>
                  ) : null}
                </Stack>
              </Box>
            </Box>
          );
        })}
      </Box>
    );
  }

  function renderGroupList() {
    return (
      <TableContainer sx={mobilizeTableContainerSx}>
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
                          color="text.primary"
                          sx={{ textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
                        >
                          {g.name}
                        </Typography>
                        {g.is_featured ? (
                          <Chip
                            size="small"
                            label="Featured"
                            color="primary"
                            variant="outlined"
                            sx={{ mt: 0.5 }}
                          />
                        ) : null}
                        {g.schedule_meeting ? (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                            noWrap
                            title={g.schedule_meeting}
                          >
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
                              variant="contained"
                              startIcon={<PersonAddIcon />}
                              onClick={() => void joinGroup(g.id)}
                              sx={mobilizeJoinGroupButtonSx}
                            >
                              {g.enrollment_mode === "open_signup" ? "Join group" : "Request to join"}
                            </Button>
                          )}
                          {canAddMemberToGroup(g) ? (
                            <Tooltip title="Add member">
                              <IconButton
                                size="small"
                                color="primary"
                                aria-label="Add member"
                                onClick={() => setAddMemberGroup(g)}
                              >
                                <GroupAddIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          ) : null}
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
    );
  }

  return (
    <Box sx={mobilizeChapterDetailRootSx}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 1.5, flexShrink: 0 }}
        flexWrap="wrap"
        gap={1}
      >
        <Button
          component={Link}
          href="/dashboard/mobilize/map"
          startIcon={<ArrowBackIcon />}
          size="small"
          color="primary"
          sx={{ fontWeight: 600 }}
        >
          Back to chapters
        </Button>
        <Stack direction="row" spacing={1} alignItems="center">
          {canCreate ? (
            <Button
              size="small"
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => openCreateGroup()}
              sx={{ fontWeight: 700, textTransform: "none" }}
            >
              Add group
            </Button>
          ) : null}
          {canEditChapter ? (
            <Button
              size="small"
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => openEditChapter()}
              sx={{ fontWeight: 600 }}
            >
              Edit chapter
            </Button>
          ) : null}
        </Stack>
      </Stack>

      <Box sx={{ mb: 2, flexShrink: 0 }}>
        <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: "-0.02em", lineHeight: 1.15 }}>
          {chapter.name}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
          Groups
        </Typography>
      </Box>

      <MobilizeContentPanel fill sx={{ p: { xs: 1.5, sm: 2 }, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{ mb: 2, flexShrink: 0 }}
          alignItems={{ sm: "center" }}
          justifyContent="space-between"
        >
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }} sx={{ flex: 1 }}>
            <TextField
              size="small"
              label="Search by name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ minWidth: 240 }}
            />
            <Typography variant="body2" color="text.secondary">
              {filtered.length} {filtered.length === 1 ? "group" : "groups"}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <ToggleButtonGroup
              size="small"
              exclusive
              value={viewMode}
              onChange={(_, v: ViewMode | null) => {
                if (v) setViewMode(v);
              }}
              sx={{
                "& .MuiToggleButton-root": {
                  borderColor: "rgba(0,0,0,0.15)",
                  color: "text.secondary",
                  px: 1.25,
                  "&.Mui-selected": {
                    bgcolor: "rgba(0,0,0,0.06)",
                    color: "text.primary",
                  },
                },
              }}
            >
              <ToggleButton value="grid" aria-label="Grid view">
                <GridViewOutlinedIcon fontSize="small" />
              </ToggleButton>
              <ToggleButton value="list" aria-label="List view">
                <ViewListOutlinedIcon fontSize="small" />
              </ToggleButton>
            </ToggleButtonGroup>
            {canCreate ? (
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => openCreateGroup()}
                sx={{ fontWeight: 700, textTransform: "none", whiteSpace: "nowrap" }}
              >
                New group
              </Button>
            ) : null}
          </Stack>
        </Stack>

        <Box sx={{ flex: 1, minHeight: 0, overflow: { xs: "visible", lg: "auto" } }}>
          {viewMode === "grid" ? renderGroupGrid() : renderGroupList()}
        </Box>
      </MobilizeContentPanel>

      <MobilizeDialog open={editOpen} onClose={() => !editSaving && setEditOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Edit chapter</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Name"
              required
              fullWidth
              value={editForm.name}
              onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
            />
            <FormControl fullWidth>
              <InputLabel id="egt-ch">Type</InputLabel>
              <Select
                labelId="egt-ch"
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
            <Button variant="outlined" onClick={() => void geocodeEditAddress()} disabled={editSaving}>
              Geocode address
            </Button>
            <MobilizeGroupListedSwitch
              listed={isMobilizeGroupListed(editForm.visibility)}
              disabled={editSaving}
              onListedChange={(listed) =>
                setEditForm((f) => ({
                  ...f,
                  visibility: mobilizeGroupListingVisibilityFromListed(listed),
                }))
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)} disabled={editSaving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={() => void saveChapterEdit()} disabled={editSaving}>
            Save
          </Button>
        </DialogActions>
      </MobilizeDialog>

      <MobilizeDialog open={createOpen} onClose={() => !saving && setCreateOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>New group</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel id="parent-chapter-new">Chapter</InputLabel>
              <Select
                labelId="parent-chapter-new"
                label="Chapter"
                value={form.parent_group_id || chapterId}
                disabled={!isSuperAdmin}
                onChange={(e) =>
                  setForm((f) => ({ ...f, parent_group_id: String(e.target.value) }))
                }
              >
                {(chapterOptions.length
                  ? chapterOptions
                  : chapter
                    ? [{ id: chapter.id, name: chapter.name }]
                    : [{ id: chapterId, name: "Current chapter" }]
                ).map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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
              label="Schedule"
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
              variant="profile"
              value={form.profile_image_url}
              onChange={(url) => setForm((f) => ({ ...f, profile_image_url: url }))}
              disabled={saving}
            />
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
            <MobilizeGroupListedSwitch
              listed={form.is_featured}
              disabled={saving}
              label="Featured"
              listedHint="Shown under every chapter's Groups list (same group, not copied)."
              unlistedHint="Only listed under its own chapter."
              onListedChange={(featured) => setForm((f) => ({ ...f, is_featured: featured }))}
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
              <InputLabel id="wpp-new">Who can post?</InputLabel>
              <Select
                labelId="wpp-new"
                label="Who can post?"
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
      </MobilizeDialog>

      <MobilizeAddMemberDialog
        open={addMemberGroup != null}
        groupId={addMemberGroup?.id ?? ""}
        groupName={addMemberGroup?.name ?? ""}
        onClose={() => setAddMemberGroup(null)}
        onAdded={() => {
          setAddMemberGroup(null);
          void load();
        }}
      />
    </Box>
  );
}
