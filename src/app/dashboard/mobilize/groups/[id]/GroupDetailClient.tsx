"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { MobilizeAddMemberDialog } from "@/components/mobilize/MobilizeAddMemberDialog";
import { MobilizeDialog } from "@/components/mobilize/MobilizeDialog";
import {
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
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
  useMediaQuery,
  useTheme,
} from "@mui/material";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import PublicOutlinedIcon from "@mui/icons-material/PublicOutlined";
import IosShareOutlinedIcon from "@mui/icons-material/IosShareOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import MilitaryTechOutlinedIcon from "@mui/icons-material/MilitaryTechOutlined";
import ViewListIcon from "@mui/icons-material/ViewList";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AvatarWithGraduateIcon } from "@/components/dashboard/training/CourseGraduateBadge";
import type { TrainingGraduateBadgeRole } from "@/lib/courses/course-completion";
import {
  canViewMobilizeGroupReports,
  MOBILIZE_GROUP_TAB_LABELS,
  mobilizeGroupDetailHref,
  mobilizeGroupTabsForNav,
  parseMobilizeGroupTab,
  type MobilizeGroupTabSlug,
} from "@/lib/mobilize/group-detail-tabs";
import {
  canManageMobilizeGroupContent,
  canPinMobilizeGroupMessage,
  canViewMobilizeGroupMemberContent,
} from "@/lib/mobilize/mobilize-content-access";
import { MOBILIZE_EMPTY_STATE_IMAGES } from "@/lib/mobilize/mobilize-empty-state-icons";
import { mobilizeChapterCoverSrc } from "@/lib/mobilize/mobilize-chapter-cover";
import { MOBILIZE_EVENT_TYPES, MOBILIZE_GROUP_TYPES } from "@/lib/mobilize/constants";
import {
  enrollmentModeLabel,
  enrollmentAcceptsNewMembers,
  type MobilizeEnrollmentMode,
} from "@/lib/mobilize/chapter-subgroup";
import { MobilizeSectionEmptyState } from "@/components/mobilize/MobilizeSectionEmptyState";
import { SOCIAL_HUB_LIGHT_BG } from "@/lib/mobilize/social/social-hub-surface";
import {
  mobilizeCalendarDaySx,
  mobilizeCardSx,
  mobilizeGroupDetailPageRootSx,
  mobilizeGroupFeedContentScrollSx,
  mobilizeGroupFeedPostCardSx,
  mobilizeGroupTabPanelScrollSx,
  mobilizeGroupSecondaryTabPanelScrollSx,
  mobilizeGroupMembersTableMobileSx,
  mobilizeJoinGroupButtonSx,
  mobilizeTableContainerSx,
} from "@/lib/mobilize/mobilize-ui-surface";
import MobilizeGroupListedSwitch from "@/components/mobilize/MobilizeGroupListedSwitch";
import {
  isMobilizeGroupListed,
  mobilizeGroupListingVisibilityFromListed,
} from "@/lib/mobilize/group-ui-labels";
import { publicAssetSrc } from "@/lib/media/public-asset-url";
import { MobilizeGroupAboutText } from "@/components/mobilize/MobilizeGroupAboutText";
import { MobilizeGroupMembersPreview } from "@/components/mobilize/MobilizeGroupMembersPreview";
import { MobilizeGroupFeed } from "@/components/mobilize/social/MobilizeGroupFeed";
import type { EnrichedGroupMessage } from "@/lib/mobilize/social/enrich-group-messages";
import { MobilizeProfilePageShell } from "@/components/mobilize/social/MobilizeProfilePageShell";
import { MobilizeProfileSidebarCard } from "@/components/mobilize/social/MobilizeProfileSidebarCard";
import { MobilizeSocialPostEditor } from "@/components/mobilize/social/MobilizeSocialPostEditor";
import { MobilizeSocialFeedShell } from "@/components/mobilize/social/MobilizeSocialFeedShell";
import { mobilizeMemberProfileHref } from "@/lib/mobilize/social/profile-href";
import MobilizeGroupCoverDropzone from "@/components/mobilize/MobilizeGroupCoverDropzone";
import { MobilizeGroupReportsPanel } from "@/components/mobilize/MobilizeGroupReportsPanel";
import MobilizeGroupResourcesPanel from "@/components/mobilize/MobilizeGroupResourcesPanel";
import { MobilizeChapterFeedBanner } from "@/components/mobilize/MobilizeChapterFeedBanner";
import { MobilizeFeedAdsRail } from "@/components/mobilize/feed-ads/MobilizeFeedAdsRail";
import type { MobilizeFeedAdBlock } from "@/lib/mobilize/feed-ads-types";
import { MobilizeChapterUpdatesPanel } from "@/components/mobilize/MobilizeChapterUpdatesPanel";
import { MobilizeGroupShareDialog } from "@/components/mobilize/MobilizeGroupShareDialog";
import { MobilizeTypeDeleteDialog } from "@/components/mobilize/MobilizeTypeDeleteDialog";
import { MobilizeGroupStateFlag } from "@/components/mobilize/MobilizeGroupStateFlag";
import { resolveMobilizeGroupStateInfo } from "@/lib/mobilize/group-state-flag";
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
  resources_post_policy?: string;
  cover_image_url?: string | null;
  profile_image_url?: string | null;
  region_code?: string | null;
  created_by: string;
  created_at: string;
  parent_group_id?: string | null;
  schedule_meeting?: string | null;
  enrollment_mode?: string | null;
  public_slug?: string | null;
  is_featured?: boolean | null;
};

type Membership = {
  member_role: string;
  membership_status: string;
} | null;

type MessageRow = EnrichedGroupMessage;

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
  member_since?: string;
  display_name?: string;
  email?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  state?: string | null;
  training_graduate_badge?: TrainingGraduateBadgeRole | null;
};

function formatMemberSince(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function capitalizeRole(role: string): string {
  return role === "leader" ? "Leader" : "Member";
}

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

function JoinToViewGate({
  section,
  onJoin,
  showJoinButton,
  isPending,
}: {
  section: "announcements" | "events" | "members" | "resources" | "updates" | "reports";
  onJoin: () => void;
  showJoinButton: boolean;
  isPending: boolean;
}) {
  const sectionLabel =
    section === "announcements"
      ? "the feed"
      : section === "events"
        ? "events and activities"
        : section === "resources"
          ? "resources"
          : section === "updates"
            ? "group updates"
            : section === "reports"
            ? "reports"
            : "members";

  const message = isPending
    ? "Your join request is pending. A group leader must approve it before you can view this section."
    : `Join this group to view ${sectionLabel}.`;

  return (
    <Card variant="outlined" sx={mobilizeCardSx}>
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
            <Typography variant="body1" color="text.primary" sx={{ fontWeight: 500 }}>
              {message}
            </Typography>
          </Stack>
          {showJoinButton ? (
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={() => void onJoin()}
              sx={{
                alignSelf: { xs: "stretch", sm: "center" },
                flexShrink: 0,
                ...mobilizeJoinGroupButtonSx,
              }}
            >
              Join group
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const theme = useTheme();
  const isMobileGroupFeed = useMediaQuery(theme.breakpoints.down("lg"));
  const isMobileMembersTable = useMediaQuery(theme.breakpoints.down("md"));
  const activeTab = parseMobilizeGroupTab(searchParams.get("tab"));
  const [group, setGroup] = useState<Group | null>(null);
  const [membership, setMembership] = useState<Membership>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [wallHtml, setWallHtml] = useState("");
  const [wallImages, setWallImages] = useState<string[]>([]);
  const [wallPosting, setWallPosting] = useState(false);
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
  const [deleteMessageDialog, setDeleteMessageDialog] = useState<{ id: string; preview: string } | null>(null);
  const [removeMemberDialog, setRemoveMemberDialog] = useState<{
    userId: string;
    name: string;
  } | null>(null);
  const [memberRoleDialog, setMemberRoleDialog] = useState<{
    userId: string;
    name: string;
    role: "leader" | "member";
  } | null>(null);
  const [promoteLeaderConfirm, setPromoteLeaderConfirm] = useState<{
    userId: string;
    name: string;
  } | null>(null);
  const [memberActionSaving, setMemberActionSaving] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [eventSaving, setEventSaving] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    group_type: "reading",
    description: "",
    schedule_meeting: "",
    address: "",
    latitude: null as number | null,
    longitude: null as number | null,
    visibility: "public",
    enrollment_mode: "request_to_join" as MobilizeEnrollmentMode,
    event_create_policy: "any_member" as "any_member" | "leader_only",
    cover_image_url: "",
    profile_image_url: "",
    wall_post_policy: "all_approved" as "all_approved" | "leaders_only",
    resources_post_policy: "all_approved" as "all_approved" | "leaders_only",
    created_by: "",
    leader_user_ids: [] as string[],
    parent_group_id: "" as string,
    is_featured: false,
  });
  const [chapterOptions, setChapterOptions] = useState<{ id: string; name: string }[]>([]);
  const [ownerCandidates, setOwnerCandidates] = useState<{ userId: string; label: string }[]>([]);
  const [ownerCandidatesLoading, setOwnerCandidatesLoading] = useState(false);
  const [msgEdit, setMsgEdit] = useState<{
    id: string;
    content: string;
    content_html: string;
    image_urls: string[];
    comments_policy: "everyone" | "leaders_only";
  } | null>(null);
  const [feedAds, setFeedAds] = useState<MobilizeFeedAdBlock[]>([]);
  const [approvedMemberCount, setApprovedMemberCount] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);
  const [canViewMemberContacts, setCanViewMemberContacts] = useState(false);

  const loadGroup = useCallback(async () => {
    const res = await fetch(`/api/mobilize/groups/${groupId}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to load group.");
    const g = json.group as Group;
    if (g.parent_group_id == null) {
      router.replace(`/dashboard/mobilize/groups/${groupId}/groups`);
      return;
    }
    setGroup(g);
    setMembership(json.membership ?? null);
    setApprovedMemberCount(
      typeof json.approved_member_count === "number" ? json.approved_member_count : 0
    );
  }, [groupId, router]);

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
    setCanViewMemberContacts(Boolean(json.can_view_contacts));
    if (Array.isArray(json.members)) {
      const approved = (json.members as MemberRow[]).filter(
        (m) => m.membership_status === "approved"
      ).length;
      setApprovedMemberCount(approved);
    }
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
  const canPinPosts = canPinMobilizeGroupMessage({
    roleNames: me.role_names,
    isLeader,
  });
  const canViewContent = canViewMobilizeGroupMemberContent({
    roleNames: me.role_names,
    isApprovedMember: isApproved,
  });
  const canViewReports = canViewMobilizeGroupReports({
    isSuperAdmin,
    isAdmin: me.role_names.includes("admin"),
    groupCreatedBy: group?.created_by,
    currentUserId: me.id,
    membership,
  });
  const approvedMembers = useMemo(
    () => members.filter((m) => m.membership_status === "approved"),
    [members]
  );
  const displayMemberCount = canViewContent
    ? approvedMembers.length || approvedMemberCount
    : approvedMemberCount;
  const recentMembers = useMemo(
    () =>
      [...approvedMembers]
        .sort(
          (a, b) =>
            new Date(b.member_since ?? b.created_at).getTime() -
            new Date(a.member_since ?? a.created_at).getTime()
        )
        .slice(0, 4),
    [approvedMembers]
  );

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

  function canManageMessage(m: MessageRow) {
    return canManageMobilizeGroupContent({
      roleNames: me.role_names,
      isLeader,
      isAuthor: m.author_id === me.id,
    });
  }

  function canManageEvent(e: EventRow) {
    return (
      canManageMobilizeGroupContent({
        roleNames: me.role_names,
        isLeader,
        isAuthor: e.created_by === me.id,
      })
    );
  }

  useEffect(() => {
    if (!canViewContent) return;
    void loadWall().catch(() => {});
    void loadEvents().catch(() => {});
    void loadMembers().catch(() => {});
    void fetch("/api/mobilize/feed-ads")
      .then((res) => res.json())
      .then((json: { items?: MobilizeFeedAdBlock[] }) => {
        setFeedAds(json.items ?? []);
      })
      .catch(() => setFeedAds([]));
  }, [canViewContent, loadWall, loadEvents, loadMembers]);

  useEffect(() => {
    if (!group) return;
    if (!canViewContent && activeTab !== "announcements") {
      router.replace(mobilizeGroupDetailHref(groupId, "announcements"));
    }
  }, [group, canViewContent, activeTab, groupId, router]);

  async function joinRequest() {
    try {
      const res = await fetch(`/api/mobilize/groups/${groupId}/join`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Join failed.");
      const status = json.membership?.membership_status;
      toast(status === "approved" ? "You joined this group." : "Join request sent.", "success");
      await loadGroup();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Join failed.", "error");
    }
  }

  const wallPolicy = group?.wall_post_policy === "leaders_only" ? "leaders_only" : "all_approved";
  const canPostWall = isApproved && (isLeader || wallPolicy === "all_approved");
  const resourcesPolicy =
    group?.resources_post_policy === "leaders_only" ? "leaders_only" : "all_approved";
  const canPostResources = isApproved && (isLeader || resourcesPolicy === "all_approved");

  function canCommentOnPost(m: MessageRow) {
    if (!isApproved) return false;
    if (m.comments_policy !== "leaders_only") return true;
    return isLeader || isSuperAdmin;
  }

  async function postWall() {
    const plain = wallHtml.replace(/<[^>]+>/g, "").trim();
    if (!plain && !wallImages.length) return;
    setWallPosting(true);
    try {
      const body: {
        content_html: string;
        comments_policy?: string;
        image_urls?: string[];
      } = {
        content_html: wallHtml,
        image_urls: wallImages,
      };
      if (isLeader) body.comments_policy = leaderCommentsPolicy;
      const res = await fetch(`/api/mobilize/groups/${groupId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Post failed.");
      setWallHtml("");
      setWallImages([]);
      setLeaderCommentsPolicy("everyone");
      await loadWall();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Post failed.", "error");
    } finally {
      setWallPosting(false);
    }
  }

  async function confirmDeleteMessage() {
    if (!deleteMessageDialog) return;
    setWallPosting(true);
    try {
      const res = await fetch(
        `/api/mobilize/groups/${groupId}/messages/${deleteMessageDialog.id}`,
        { method: "DELETE" }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Delete failed.");
      toast("Post deleted.", "success");
      setDeleteMessageDialog(null);
      await loadWall();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Delete failed.", "error");
    } finally {
      setWallPosting(false);
    }
  }

  async function saveMessageEdit() {
    if (!msgEdit) return;
    setWallPosting(true);
    try {
      const res = await fetch(`/api/mobilize/groups/${groupId}/messages/${msgEdit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isLeader || isSuperAdmin
            ? {
                content_html: msgEdit.content_html,
                image_urls: msgEdit.image_urls,
                comments_policy: msgEdit.comments_policy,
              }
            : { content_html: msgEdit.content_html, image_urls: msgEdit.image_urls }
        ),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Update failed.");
      setMsgEdit(null);
      await loadWall();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Update failed.", "error");
    } finally {
      setWallPosting(false);
    }
  }

  async function pinMessage(m: MessageRow, pin: boolean) {
    try {
      const res = await fetch(`/api/mobilize/groups/${groupId}/messages/${m.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Pin update failed.");
      toast(pin ? "Post pinned." : "Post unpinned.", "success");
      await loadWall();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Pin update failed.", "error");
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
      toast("Group role updated.", "success");
      setMemberRoleDialog(null);
      setPromoteLeaderConfirm(null);
      await loadMembers();
      await loadGroup();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Role update failed.", "error");
    } finally {
      setMemberActionSaving(false);
    }
  }

  function requestMemberRoleSave() {
    if (!memberRoleDialog) return;
    const current = members.find((m) => m.user_id === memberRoleDialog.userId);
    if (
      current?.member_role === "member" &&
      memberRoleDialog.role === "leader"
    ) {
      setPromoteLeaderConfirm({
        userId: memberRoleDialog.userId,
        name: memberRoleDialog.name,
      });
      return;
    }
    setMemberActionSaving(true);
    void setMemberRole(memberRoleDialog.userId, memberRoleDialog.role);
  }

  function confirmPromoteLeader() {
    if (!promoteLeaderConfirm) return;
    setMemberActionSaving(true);
    void setMemberRole(promoteLeaderConfirm.userId, "leader");
  }

  async function confirmRemoveMember() {
    if (!removeMemberDialog) return;
    setMemberActionSaving(true);
    try {
      const res = await fetch(
        `/api/mobilize/groups/${groupId}/members/${removeMemberDialog.userId}`,
        { method: "DELETE" }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Remove failed.");
      toast("Member removed from the chapter.", "success");
      setRemoveMemberDialog(null);
      await loadMembers();
      await loadGroup();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Remove failed.", "error");
    } finally {
      setMemberActionSaving(false);
    }
  }

  function openEditGroup() {
    if (!group) return;
    const mode = (group.enrollment_mode ?? "request_to_join") as MobilizeEnrollmentMode;
    setEditForm({
      name: group.name,
      group_type: group.group_type,
      description: group.description ?? "",
      schedule_meeting: group.schedule_meeting ?? "",
      address: group.address ?? "",
      latitude: group.latitude,
      longitude: group.longitude,
      visibility: group.visibility,
      enrollment_mode:
        mode === "open_signup" || mode === "closed" || mode === "auto_closed" || mode === "request_to_join"
          ? mode
          : "request_to_join",
      event_create_policy: group.event_create_policy === "leader_only" ? "leader_only" : "any_member",
      cover_image_url: group.cover_image_url?.trim() ?? "",
      profile_image_url: group.profile_image_url?.trim() ?? "",
      wall_post_policy: group.wall_post_policy === "leaders_only" ? "leaders_only" : "all_approved",
      resources_post_policy:
        group.resources_post_policy === "leaders_only" ? "leaders_only" : "all_approved",
      created_by: group.created_by,
      leader_user_ids: (() => {
        const ids = members
          .filter((m) => m.member_role === "leader" && m.membership_status === "approved")
          .map((m) => m.user_id);
        if (group.created_by && !ids.includes(group.created_by)) ids.push(group.created_by);
        return ids;
      })(),
      parent_group_id: group.parent_group_id ?? "",
      is_featured: Boolean(group.is_featured),
    });
    if (isSuperAdmin && group.parent_group_id) {
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
      const profileImage =
        editForm.profile_image_url.trim() ? editForm.profile_image_url.trim() : null;
      const res = await fetch(`/api/mobilize/groups/${groupId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name.trim(),
          group_type: editForm.group_type,
          description: editForm.description.trim() || null,
          schedule_meeting: editForm.schedule_meeting.trim() || null,
          address: editForm.address.trim() || null,
          latitude: editForm.latitude,
          longitude: editForm.longitude,
          visibility: editForm.visibility,
          enrollment_mode:
            editForm.enrollment_mode === "auto_closed" ? "closed" : editForm.enrollment_mode,
          event_create_policy: editForm.event_create_policy,
          cover_image_url: cover,
          profile_image_url: profileImage,
          wall_post_policy: editForm.wall_post_policy,
          resources_post_policy: editForm.resources_post_policy,
          is_featured: editForm.is_featured === true,
          ...(isSuperAdmin
            ? {
                created_by: editForm.created_by,
                leader_user_ids: leaderIds,
                ...(editForm.parent_group_id
                  ? { parent_group_id: editForm.parent_group_id }
                  : {}),
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
  const enrollmentOpen = enrollmentAcceptsNewMembers(group?.enrollment_mode);
  const showJoin =
    enrollmentOpen &&
    !isApproved &&
    !isPendingJoin &&
    (!membership || membership.membership_status === "rejected");

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

  const groupCoverSrc = useMemo(() => {
    if (!group) return "";
    return publicAssetSrc(mobilizeChapterCoverSrc(group.cover_image_url));
  }, [group]);

  const groupStateInfo = useMemo(() => {
    if (!group) return null;
    return resolveMobilizeGroupStateInfo({
      regionCode: group.region_code,
      address: group.address,
      name: group.name,
    });
  }, [group]);

  const joinCallToAction = useMemo(() => {
    if (showJoin) {
      return (
        <Button
          variant="contained"
          size="small"
          startIcon={<PersonAddIcon />}
          onClick={() => void joinRequest()}
          sx={mobilizeJoinGroupButtonSx}
        >
          Join group
        </Button>
      );
    }
    if (membership?.membership_status === "pending") {
      return (
        <Typography color="warning.main" variant="body2" sx={{ maxWidth: 220 }}>
          Membership pending approval.
        </Typography>
      );
    }
    return null;
  }, [membership, showJoin, joinRequest]);

  const profileHeaderActions = useMemo(() => {
    const canEdit = Boolean(group && (isLeader || group.created_by === me.id || isSuperAdmin));
    const actions: ReactNode[] = [];
    const heroBtnSx = {
      borderRadius: 99,
      textTransform: "none" as const,
      fontWeight: 700,
      color: "#0d0d0d",
      borderColor: "rgba(0,0,0,0.18)",
      bgcolor: "#fff",
      "&:hover": {
        borderColor: "rgba(0,0,0,0.28)",
        bgcolor: "rgba(0,0,0,0.03)",
      },
    };
    if (showJoin) {
      actions.push(
        <Button
          key="join"
          size="small"
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={() => void joinRequest()}
          sx={{
            ...heroBtnSx,
            ...mobilizeJoinGroupButtonSx,
          }}
        >
          Join group
        </Button>
      );
    } else if (membership?.membership_status === "pending") {
      actions.push(
        <Typography
          key="pending"
          variant="body2"
          sx={{ color: "warning.main", maxWidth: 220, fontWeight: 600 }}
        >
          Membership pending approval.
        </Typography>
      );
    }
    if (canEdit) {
      actions.push(
        <Button
          key="edit"
          size="small"
          variant="outlined"
          startIcon={<EditIcon />}
          onClick={() => openEditGroup()}
          sx={heroBtnSx}
        >
          Edit group
        </Button>
      );
    }
    if (group) {
      actions.push(
        <Tooltip key="share" title="Share group">
          <IconButton
            size="small"
            aria-label="Share group"
            onClick={() => setShareOpen(true)}
            sx={{
              ...heroBtnSx,
              width: 36,
              height: 36,
              border: "1px solid",
            }}
          >
            <IosShareOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      );
    }
    if (!actions.length) return null;
    return (
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
        {actions}
      </Stack>
    );
  }, [group, groupId, isLeader, isSuperAdmin, showJoin, membership?.membership_status, me.id, openEditGroup, joinRequest]);

  const profileMeta = useMemo(() => {
    if (!group) return null;
    const memberLabel = `${displayMemberCount} member${displayMemberCount === 1 ? "" : "s"}`;
    const visibilityLabel = isMobilizeGroupListed(group.visibility) ? "Public group" : "Private group";
    return (
      <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap alignItems="center">
        <Stack direction="row" spacing={0.75} alignItems="center">
          <GroupsOutlinedIcon sx={{ fontSize: 17, color: "text.secondary" }} />
          <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 500 }}>
            {memberLabel}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={0.75} alignItems="center">
          <PublicOutlinedIcon sx={{ fontSize: 17, color: "text.secondary" }} />
          <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 500 }}>
            {visibilityLabel}
          </Typography>
        </Stack>
      </Stack>
    );
  }, [displayMemberCount, group]);

  const fullHeader = useMemo(() => {
    if (!group) return null;
    return (
      <Box sx={{ mb: 2 }}>
        <MobilizeChapterFeedBanner
          coverSrc={groupCoverSrc}
          chapterName={group.name}
          stateInfo={groupStateInfo}
        />
        {group.description ? (
          <Box sx={{ mt: 1 }}>
            <Typography
              variant="overline"
              sx={{
                display: "block",
                letterSpacing: "0.1em",
                fontWeight: 700,
                fontSize: "0.68rem",
                color: "text.secondary",
                mb: 0.5,
              }}
            >
              Description
            </Typography>
            <Typography variant="body2">{group.description}</Typography>
          </Box>
        ) : null}
        {group.address ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {group.address}
          </Typography>
        ) : null}
        {joinCallToAction}
      </Box>
    );
  }, [group, groupCoverSrc, groupStateInfo, joinCallToAction]);

  const groupFeedAdsRail = useMemo(() => {
    if (!feedAds.length) return null;
    return <MobilizeFeedAdsRail items={feedAds} />;
  }, [feedAds]);

  const groupFeedAboutRail = useMemo(() => {
    if (!group || !canViewContent) return null;
    return (
      <Stack spacing={2}>
        {group.description ? (
          <MobilizeProfileSidebarCard title="About this group" variant="groupFeed">
            <MobilizeGroupAboutText text={group.description} />
          </MobilizeProfileSidebarCard>
        ) : null}
        <MobilizeGroupMembersPreview
          members={recentMembers}
          totalCount={displayMemberCount}
          groupId={groupId}
        />
        {groupFeedAdsRail}
      </Stack>
    );
  }, [displayMemberCount, canViewContent, group, groupFeedAdsRail, groupId, recentMembers]);

  const guestGroupAboutRail = useMemo(() => {
    if (!group || canViewContent) return null;
    const isListed = isMobilizeGroupListed(group.visibility);
    const mode = String(group.enrollment_mode ?? "request_to_join");
    const visibilityTitle = isListed ? "Public" : "Unlisted";
    let visibilityCopy: string;
    if (!isListed) {
      visibilityCopy = "This group is unlisted. You need an invite link to find it.";
    } else if (mode === "open_signup") {
      visibilityCopy = "Anyone can find this group and join instantly. No approval is required.";
    } else if (mode === "request_to_join" || !mode) {
      visibilityCopy =
        "Anyone can find this group. Request to join and a leader must approve before you can participate.";
    } else {
      visibilityCopy = "This group is not currently accepting new members.";
    }

    return (
      <MobilizeProfileSidebarCard title="About this group" variant="groupFeed">
        {group.description?.trim() ? (
          <MobilizeGroupAboutText text={group.description} />
        ) : (
          <Typography variant="body2" color="text.secondary">
            No description yet.
          </Typography>
        )}
        <Box sx={{ mt: 2.25 }}>
          <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.5 }}>
            {visibilityTitle}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
            {visibilityCopy}
          </Typography>
        </Box>
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.5 }}>
            Members Only Feed
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
            {isPendingJoin
              ? "Your join request is pending. Once approved, you can view posts, participate in discussions, and access member content."
              : "Join the group to view posts, participate in discussions, and access member content."}
          </Typography>
        </Box>
      </MobilizeProfileSidebarCard>
    );
  }, [canViewContent, group, isPendingJoin]);

  const groupAboutPanel = useMemo(() => {
    if (!group) return null;
    const memberLabel = `${displayMemberCount} member${displayMemberCount === 1 ? "" : "s"}`;
    const visibilityLabel = isMobilizeGroupListed(group.visibility) ? "Public group" : "Private group";
    return (
      <Stack spacing={2}>
        <MobilizeProfileSidebarCard title="About this group" variant="groupFeed">
          {group.description ? (
            <MobilizeGroupAboutText text={group.description} />
          ) : (
            <Typography variant="body2" color="text.secondary">
              No description yet.
            </Typography>
          )}
        </MobilizeProfileSidebarCard>
        <MobilizeProfileSidebarCard title="Details" variant="groupFeed">
          <Stack spacing={1.25}>
            <Stack direction="row" spacing={0.75} alignItems="center">
              <GroupsOutlinedIcon sx={{ fontSize: 18, color: "text.secondary" }} />
              <Typography variant="body2" color="text.secondary">
                {memberLabel}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={0.75} alignItems="center">
              <PublicOutlinedIcon sx={{ fontSize: 18, color: "text.secondary" }} />
              <Typography variant="body2" color="text.secondary">
                {visibilityLabel}
              </Typography>
            </Stack>
            {group.address ? (
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
                {group.address}
              </Typography>
            ) : null}
          </Stack>
        </MobilizeProfileSidebarCard>
      </Stack>
    );
  }, [displayMemberCount, group]);

  const groupMembersSegment = useMemo(() => {
    if (!group) return null;
    if (!displayMemberCount) {
      return (
        <MobilizeProfileSidebarCard title="Members" variant="groupFeed">
          <Typography variant="body2" color="text.secondary">
            This group does not have any approved members yet.
          </Typography>
        </MobilizeProfileSidebarCard>
      );
    }
    return (
      <MobilizeGroupMembersPreview
        members={recentMembers}
        totalCount={displayMemberCount}
        groupId={groupId}
      />
    );
  }, [displayMemberCount, group, groupId, recentMembers]);

  const groupAuthorRoleLabels = useMemo(() => {
    const labels: Record<string, string> = {};
    for (const m of approvedMembers) {
      labels[m.user_id] = capitalizeRole(m.member_role);
    }
    return labels;
  }, [approvedMembers]);

  const compactHeader = useMemo(() => {
    if (!group) return null;
    return (
      <Box sx={{ position: "relative", mb: 2 }}>
        {groupStateInfo ? (
          <Box sx={{ position: "absolute", top: 0, right: 0, zIndex: 2 }}>
            <MobilizeGroupStateFlag state={groupStateInfo} size={56} />
          </Box>
        ) : null}
        <Stack direction="row" spacing={2} alignItems="center" sx={{ pr: groupStateInfo ? 7 : 0 }}>
          <Box
            component="img"
            src={groupCoverSrc}
            alt=""
            sx={{
              width: 80,
              height: 80,
              borderRadius: 1.25,
              objectFit: "cover",
              flexShrink: 0,
              bgcolor: "rgba(0,0,0,0.25)",
              boxShadow: "0 2px 12px rgba(0,0,0,0.35)",
            }}
          />
          <Box sx={{ minWidth: 0, flex: 1, textAlign: "left" }}>
            <Typography
              variant="overline"
              sx={{
                display: "block",
                letterSpacing: 2,
                fontWeight: 800,
                color: "primary.main",
                fontSize: "0.68rem",
                lineHeight: 1.2,
              }}
            >
              FLASH POINT ARMY
            </Typography>
            <Typography variant="h5" fontWeight={800} lineHeight={1.2} noWrap title={group.name}>
              {group.name}
            </Typography>
          </Box>
        </Stack>
        {group.address ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {group.address}
          </Typography>
        ) : null}
        {joinCallToAction}
      </Box>
    );
  }, [group, groupCoverSrc, groupStateInfo, joinCallToAction]);

  if (loading || !group) {
    return <Skeleton height={320} />;
  }

  const canEditGroup = isLeader || group.created_by === me.id || isSuperAdmin;
  const canManageMembers = isLeader || group.created_by === me.id || isSuperAdmin;
  // Matches the server-side POST /members gate: site staff, group owner, or an approved leader.
  const canAddMember = isLeader || group.created_by === me.id || isSuperAdmin || me.role_names.includes("admin");
  const showMemberContacts =
    canViewMemberContacts ||
    isSuperAdmin ||
    me.role_names.includes("admin") ||
    me.role_names.includes("sub_admin") ||
    group.created_by === me.id;
  const gridSx = {
    display: "grid",
    gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
    gap: 0.5,
  } as const;

  const feedTabPanelSx = mobilizeGroupTabPanelScrollSx;
  const secondaryTabPanelSx = mobilizeGroupSecondaryTabPanelScrollSx;
  const profileTabs = mobilizeGroupTabsForNav(canViewReports, {
    canViewMemberContent: canViewContent,
  }).map((slug) => ({
    id: slug,
    label: MOBILIZE_GROUP_TAB_LABELS[slug],
  }));

  return (
    <Box
      sx={{
        ...mobilizeGroupDetailPageRootSx,
        bgcolor: SOCIAL_HUB_LIGHT_BG,
        borderRadius: { xs: 0, sm: 2 },
        border: { xs: "none", sm: "1px solid rgba(0,0,0,0.06)" },
        p: { xs: 0, sm: 1.5, md: 2 },
        boxSizing: "border-box",
      }}
    >
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          width: "100%",
          maxWidth: 1180,
          mx: "auto",
        }}
      >
      <MobilizeProfilePageShell
        coverSrc={groupCoverSrc}
        title={group.name}
        meta={profileMeta}
        avatarSrc={group.profile_image_url ?? group.cover_image_url}
        avatarFallback={group.name}
        headerActions={profileHeaderActions}
        tabs={profileTabs}
        activeTab={activeTab}
        onTabChange={(id) => {
          router.push(mobilizeGroupDetailHref(groupId, id as MobilizeGroupTabSlug));
        }}
        socialTabStyle
        tabsInContent
        fillContent
        unifiedContent
      >
      <Box sx={{ ...mobilizeGroupFeedContentScrollSx, width: "100%", bgcolor: "transparent" }}>
      {activeTab === "announcements" && !canViewContent ? (
        <Box sx={feedTabPanelSx}>
          <MobilizeSocialFeedShell
            leftRail={null}
            rightRail={guestGroupAboutRail}
            variant="groupProfile"
            fill
          >
            <Paper
              elevation={0}
              sx={{
                ...mobilizeGroupFeedPostCardSx,
                mb: 0,
                flex: 1,
                display: "flex",
                flexDirection: "column",
                minHeight: { xs: 320, md: 420 },
              }}
            >
              <MobilizeSectionEmptyState
                title={isPendingJoin ? "Join request pending" : "Join the Public Square"}
                description={
                  isPendingJoin
                    ? "A group leader must approve your request before you can unlock the feed, share posts, and participate in gatherings."
                    : "Join the community to unlock the feed, share posts, connect with others, mobilize your community, and participate in gatherings."
                }
                imageSrc={MOBILIZE_EMPTY_STATE_IMAGES.announcements}
                fill
              />
            </Paper>
          </MobilizeSocialFeedShell>
        </Box>
      ) : null}

      {activeTab === "announcements" && canViewContent ? (
        <Box sx={feedTabPanelSx}>
          <MobilizeSocialFeedShell
            leftRail={isMobileGroupFeed ? null : groupFeedAboutRail}
            rightRail={null}
            variant="groupProfile"
            fill
          >
            <MobilizeGroupFeed
              embedded
              groupId={groupId}
              authorRoleLabels={groupAuthorRoleLabels}
              messages={messages}
              canPost={canPostWall}
              canCommentOnPost={canCommentOnPost}
              isLeader={isLeader}
              isSuperAdmin={isSuperAdmin}
              canManageMessage={canManageMessage}
              posting={wallPosting}
              wallHtml={wallHtml}
              onWallHtmlChange={setWallHtml}
              wallImages={wallImages}
              onWallImagesChange={setWallImages}
              leaderCommentsPolicy={leaderCommentsPolicy}
              onLeaderCommentsPolicyChange={setLeaderCommentsPolicy}
              onPost={postWall}
              onEdit={(m) =>
                setMsgEdit({
                  id: m.id,
                  content: m.content,
                  content_html: m.content_html ?? m.content,
                  image_urls: m.image_urls ?? [],
                  comments_policy: m.comments_policy === "leaders_only" ? "leaders_only" : "everyone",
                })
              }
              onDelete={(m) =>
                setDeleteMessageDialog({
                  id: m.id,
                  preview: m.content.trim() || "this post",
                })
              }
              onPin={(m, pin) => void pinMessage(m, pin)}
              canPinPost={canPinPosts}
            />
          </MobilizeSocialFeedShell>
        </Box>
      ) : null}

      {activeTab === "events" && !canViewContent ? (
        <Box sx={secondaryTabPanelSx}>
        <JoinToViewGate
          section="events"
          onJoin={joinRequest}
          showJoinButton={showJoin}
          isPending={isPendingJoin}
        />
        </Box>
      ) : null}

      {activeTab === "events" && canViewContent ? (
        <Box sx={secondaryTabPanelSx}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }} flexWrap="wrap" gap={1}>
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
            {(isLeader || group.event_create_policy === "any_member") ? (
              <Button
                variant="outlined"
                size="small"
                onClick={() => setEventOpen(true)}
                sx={{ borderRadius: 99, textTransform: "none", fontWeight: 600, flexShrink: 0 }}
              >
                Add new event
              </Button>
            ) : null}
          </Stack>

          {eventsView === "list" ? (
            <Box sx={{ display: "flex", flexDirection: "column" }}>
              {events.map((e) => (
                <Card key={e.id} variant="outlined" sx={{ mb: 1, ...mobilizeCardSx }}>
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
                  fill
                  imageSrc={MOBILIZE_EMPTY_STATE_IMAGES.events}
                  title="No events"
                  description="There are no upcoming events scheduled for this group right now. Check back later for updates."
                />
              ) : null}
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column" }}>
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
                          ...mobilizeCalendarDaySx(inMonth),
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
            </Box>
          )}
        </Box>
      ) : null}

      {activeTab === "members" && !canViewContent ? (
        <Box sx={secondaryTabPanelSx}>
        <JoinToViewGate
          section="members"
          onJoin={joinRequest}
          showJoinButton={showJoin}
          isPending={isPendingJoin}
        />
        </Box>
      ) : null}

      {activeTab === "members" && canViewContent ? (
        <Box sx={secondaryTabPanelSx}>
          {canManageMembers ? (
            <>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Pending requests
              </Typography>
              {members
                .filter((m) => m.membership_status === "pending")
                .map((m) => (
                  <Card key={m.id} variant="outlined" sx={{ mb: 1, ...mobilizeCardSx }}>
                    <CardContent sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
                      <Button
                        component={Link}
                        href={`${mobilizeMemberProfileHref(m.user_id)}?from=group&groupId=${groupId}`}
                        size="small"
                        sx={{ textTransform: "none", p: 0, minWidth: 0, fontWeight: 600 }}
                      >
                        {m.display_name ?? m.user_id.slice(0, 8)}
                      </Button>
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
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  No pending join requests right now.
                </Typography>
              ) : null}
            </>
          ) : null}

          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            flexWrap="wrap"
            gap={1}
            sx={{ mt: 2, mb: 1 }}
          >
            <Typography variant="subtitle2">Members ({displayMemberCount})</Typography>
            {canAddMember ? (
              <Button
                size="small"
                variant="outlined"
                startIcon={<GroupAddIcon />}
                onClick={() => setAddMemberOpen(true)}
                sx={{ textTransform: "none" }}
              >
                Add member
              </Button>
            ) : null}
          </Stack>
          {approvedMembers.length ? (
          <TableContainer sx={{ ...mobilizeTableContainerSx, overflowX: "auto" }}>
              <Table size="small" sx={mobilizeGroupMembersTableMobileSx}>
                <TableHead>
                  <TableRow>
                    <TableCell>Member</TableCell>
                    {showMemberContacts ? <TableCell>Email</TableCell> : null}
                    {showMemberContacts ? <TableCell>Phone</TableCell> : null}
                    <TableCell>Role</TableCell>
                    <TableCell>Member since</TableCell>
                    {canManageMembers ? <TableCell align="right">Actions</TableCell> : null}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {approvedMembers.map((m) => {
                    const memberName = m.display_name ?? m.email ?? m.user_id.slice(0, 8);
                    const canActOnMember =
                      m.user_id !== me.id && group.created_by !== m.user_id;
                    return (
                    <TableRow key={m.id}>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <AvatarWithGraduateIcon
                            graduateRole={m.training_graduate_badge}
                            overlayStyle="directory"
                            size={isMobileMembersTable ? 25 : 36}
                            src={m.avatar_url ? publicAssetSrc(m.avatar_url) : undefined}
                            alt={memberName}
                            avatarSx={{
                              bgcolor: "rgba(233,196,106,0.18)",
                              color: "primary.main",
                              ...(isMobileMembersTable
                                ? { width: 25, height: 25, fontSize: "0.65rem" }
                                : {}),
                            }}
                          >
                            {(m.display_name ?? "?").slice(0, 1).toUpperCase()}
                          </AvatarWithGraduateIcon>
                          <Typography
                            variant="body2"
                            component={Link}
                            href={`${mobilizeMemberProfileHref(m.user_id)}?from=group&groupId=${groupId}`}
                            sx={{ fontWeight: 600, color: "inherit", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
                          >
                            {memberName}
                          </Typography>
                        </Stack>
                      </TableCell>
                      {showMemberContacts ? (
                        <TableCell>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={
                              isMobileMembersTable
                                ? {
                                    maxWidth: "19vw",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    fontSize: "12px !important",
                                    lineHeight: 1.1,
                                  }
                                : undefined
                            }
                          >
                            {m.email?.trim() || "—"}
                          </Typography>
                        </TableCell>
                      ) : null}
                      {showMemberContacts ? (
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {m.phone?.trim() || "—"}
                          </Typography>
                        </TableCell>
                      ) : null}
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={0.75} flexWrap="wrap" useFlexGap>
                          <Typography variant="body2" component="span">
                            {capitalizeRole(m.member_role)}
                          </Typography>
                          {group.created_by === m.user_id ? (
                            <Chip size="small" label="Owner" variant="outlined" />
                          ) : null}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {formatMemberSince(m.member_since ?? m.created_at)}
                        </Typography>
                      </TableCell>
                    {canManageMembers ? (
                      <TableCell align="right">
                        {canActOnMember ? (
                          <Stack direction="row" spacing={0.25} justifyContent="flex-end">
                            <Tooltip title="Edit group role">
                              <IconButton
                                size="small"
                                aria-label="Edit group role"
                                onClick={() =>
                                  setMemberRoleDialog({
                                    userId: m.user_id,
                                    name: memberName,
                                    role: m.member_role === "leader" ? "leader" : "member",
                                  })
                                }
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {m.member_role === "member" ? (
                              <Tooltip title="Make leader">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  aria-label="Make leader"
                                  onClick={() =>
                                    setPromoteLeaderConfirm({
                                      userId: m.user_id,
                                      name: memberName,
                                    })
                                  }
                                >
                                  <MilitaryTechOutlinedIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            ) : null}
                            <Tooltip title="Remove from group">
                              <IconButton
                                size="small"
                                color="error"
                                aria-label="Remove from group"
                                onClick={() =>
                                  setRemoveMemberDialog({
                                    userId: m.user_id,
                                    name: memberName,
                                  })
                                }
                              >
                                <DeleteOutlineIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        ) : null}
                      </TableCell>
                    ) : null}
                    </TableRow>
                  );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <MobilizeSectionEmptyState
              fill
              icon={<GroupsOutlinedIcon sx={{ fontSize: "inherit", color: "text.secondary" }} />}
              title="No members"
              description="This group does not have any approved members yet. Members will show up here after they join."
            />
          )}
        </Box>
      ) : null}

      {activeTab === "resources" && !canViewContent ? (
        <Box sx={secondaryTabPanelSx}>
        <JoinToViewGate
          section="resources"
          onJoin={joinRequest}
          showJoinButton={showJoin}
          isPending={isPendingJoin}
        />
        </Box>
      ) : null}

      {activeTab === "resources" && canViewContent ? (
        <Box sx={secondaryTabPanelSx}>
        <MobilizeGroupResourcesPanel
          groupId={groupId}
          currentUserId={me.id}
          isLeader={isLeader}
          isSuperAdmin={isSuperAdmin}
          canPost={canPostResources}
        />
        </Box>
      ) : null}

      {activeTab === "updates" && !canViewContent ? (
        <Box sx={secondaryTabPanelSx}>
        <JoinToViewGate
          section="updates"
          onJoin={joinRequest}
          showJoinButton={showJoin}
          isPending={isPendingJoin}
        />
        </Box>
      ) : null}

      {activeTab === "updates" && canViewContent ? (
        <Box sx={secondaryTabPanelSx}>
        <MobilizeChapterUpdatesPanel groupId={groupId} chapterName={group.name} />
        </Box>
      ) : null}

      {activeTab === "reports" && !canViewContent ? (
        <Box sx={secondaryTabPanelSx}>
        <JoinToViewGate
          section="reports"
          onJoin={joinRequest}
          showJoinButton={showJoin}
          isPending={isPendingJoin}
        />
        </Box>
      ) : null}

      {activeTab === "reports" && canViewContent && !canViewReports ? (
        <Box sx={secondaryTabPanelSx}>
        <Typography color="text.secondary">
          Reports are available to group owners and leaders only.
        </Typography>
        </Box>
      ) : null}

      {activeTab === "reports" && canViewContent && canViewReports ? (
        <Box sx={secondaryTabPanelSx}>
        <MobilizeGroupReportsPanel groupId={groupId} />
        </Box>
      ) : null}
      </Box>
      </MobilizeProfilePageShell>
      </Box>

      <MobilizeDialog open={eventOpen} onClose={() => setEventOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add new event</DialogTitle>
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
      </MobilizeDialog>

      <MobilizeDialog open={editEventOpen} onClose={() => !eventSaving && setEditEventOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Edit event</DialogTitle>
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
      </MobilizeDialog>

      <MobilizeDialog
        open={!!memberRoleDialog}
        onClose={() => !memberActionSaving && setMemberRoleDialog(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Edit group role</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Change the Mobilize group role for <strong>{memberRoleDialog?.name}</strong>. This does not
            change their dashboard system role.
          </Typography>
          <FormControl fullWidth>
            <InputLabel id="member-role-select">Group role</InputLabel>
            <Select
              labelId="member-role-select"
              label="Group role"
              value={memberRoleDialog?.role ?? "member"}
              onChange={(e) =>
                setMemberRoleDialog((s) =>
                  s ? { ...s, role: e.target.value as "leader" | "member" } : s
                )
              }
            >
              <MenuItem value="member">Member</MenuItem>
              <MenuItem value="leader">Leader</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMemberRoleDialog(null)} disabled={memberActionSaving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={requestMemberRoleSave} disabled={memberActionSaving}>
            Save
          </Button>
        </DialogActions>
      </MobilizeDialog>

      <MobilizeDialog
        open={!!promoteLeaderConfirm}
        onClose={() => !memberActionSaving && setPromoteLeaderConfirm(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Make group leader?</DialogTitle>
        <DialogContent>
          <Typography>
            Promote <strong>{promoteLeaderConfirm?.name}</strong> to group leader? They will be able to
            manage members, settings, and content according to group policies.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setPromoteLeaderConfirm(null)}
            disabled={memberActionSaving}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={confirmPromoteLeader}
            disabled={memberActionSaving}
          >
            Make leader
          </Button>
        </DialogActions>
      </MobilizeDialog>

      <MobilizeDialog
        open={!!removeMemberDialog}
        onClose={() => !memberActionSaving && setRemoveMemberDialog(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Remove member</DialogTitle>
        <DialogContent>
          <Typography>
            Remove <strong>{removeMemberDialog?.name}</strong> from this group? They will lose access to
            announcements, events, resources, and the member list.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRemoveMemberDialog(null)} disabled={memberActionSaving}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => void confirmRemoveMember()}
            disabled={memberActionSaving}
          >
            {memberActionSaving ? "Removing…" : "Remove member"}
          </Button>
        </DialogActions>
      </MobilizeDialog>

      <MobilizeTypeDeleteDialog
        open={!!deleteDialog}
        title="Delete event"
        description={
          <>
            Delete <strong>{deleteDialog?.title}</strong>? This cannot be undone.
          </>
        }
        loading={eventSaving}
        onClose={() => setDeleteDialog(null)}
        onConfirm={() => void confirmDeleteEvent()}
      />

      <MobilizeTypeDeleteDialog
        open={!!deleteMessageDialog}
        title="Delete post"
        description={
          <>
            Delete <strong>{deleteMessageDialog?.preview}</strong>? This cannot be undone.
          </>
        }
        loading={wallPosting}
        onClose={() => setDeleteMessageDialog(null)}
        onConfirm={() => void confirmDeleteMessage()}
      />

      <MobilizeDialog open={editOpen} onClose={() => !editSaving && setEditOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Edit group</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            {isSuperAdmin && group?.parent_group_id ? (
              <FormControl fullWidth>
                <InputLabel id="eg-chapter">Chapter</InputLabel>
                <Select
                  labelId="eg-chapter"
                  label="Chapter"
                  value={editForm.parent_group_id || group.parent_group_id}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, parent_group_id: String(e.target.value) }))
                  }
                >
                  {(chapterOptions.length
                    ? chapterOptions
                    : [{ id: group.parent_group_id, name: "Current chapter" }]
                  ).map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : null}
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
            <TextField
              label="Schedule"
              fullWidth
              multiline
              minRows={2}
              placeholder="e.g. Meets weekly on Saturdays from 6–8pm"
              value={editForm.schedule_meeting}
              onChange={(e) => setEditForm((f) => ({ ...f, schedule_meeting: e.target.value }))}
            />
            <FormControl fullWidth>
              <InputLabel id="enroll-edit">Enrollment</InputLabel>
              <Select
                labelId="enroll-edit"
                label="Enrollment"
                value={editForm.enrollment_mode === "auto_closed" ? "closed" : editForm.enrollment_mode}
                onChange={(e) =>
                  setEditForm((f) => ({
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
            {group?.enrollment_mode === "auto_closed" ? (
              <Typography variant="caption" color="warning.main">
                Currently auto-closed due to inactivity ({enrollmentModeLabel("auto_closed")}). Saving as Closed
                will keep it closed until you choose Open signup or Request to join.
              </Typography>
            ) : null}
            <MobilizeGroupCoverDropzone
              variant="profile"
              value={editForm.profile_image_url}
              onChange={(url) => setEditForm((f) => ({ ...f, profile_image_url: url }))}
              disabled={editSaving}
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
            {group?.parent_group_id ? (
              <MobilizeGroupListedSwitch
                listed={editForm.is_featured}
                disabled={editSaving}
                label="Featured"
                listedHint="Shown under every chapter's Groups list (same group, not copied)."
                unlistedHint="Only listed under its own chapter."
                onListedChange={(featured) => setEditForm((f) => ({ ...f, is_featured: featured }))}
              />
            ) : null}
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
              <InputLabel id="wpp">Who can post?</InputLabel>
              <Select
                labelId="wpp"
                label="Who can post?"
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
            <FormControl fullWidth>
              <InputLabel id="rpp">Who can add resources</InputLabel>
              <Select
                labelId="rpp"
                label="Who can add resources"
                value={editForm.resources_post_policy}
                onChange={(e) =>
                  setEditForm((f) => ({
                    ...f,
                    resources_post_policy: e.target.value as "all_approved" | "leaders_only",
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
      </MobilizeDialog>

      <MobilizeDialog open={!!msgEdit} onClose={() => setMsgEdit(null)} fullWidth maxWidth="sm">
        <DialogTitle>Edit announcement</DialogTitle>
        <DialogContent>
          {msgEdit ? (
            <Box
              sx={{
                mt: 1,
                border: "1px solid rgba(0,0,0,0.1)",
                borderRadius: "12px",
                overflow: "hidden",
                bgcolor: "#fff",
              }}
            >
              <MobilizeSocialPostEditor
                value={msgEdit.content_html}
                onChange={(html) => setMsgEdit((s) => (s ? { ...s, content_html: html } : s))}
                disabled={wallPosting}
                surface="light"
                brandAccent
                headingLabel="Edit post"
                avatarUrl={me.avatar_url}
                avatarFallback={me.display_name ?? me.email ?? "?"}
                imageUrls={msgEdit.image_urls}
                onImageUrlsChange={(urls) =>
                  setMsgEdit((s) => (s ? { ...s, image_urls: urls } : s))
                }
                groupId={groupId}
                commentsPolicy={
                  isLeader || isSuperAdmin ? msgEdit.comments_policy : undefined
                }
                onCommentsPolicyChange={
                  isLeader || isSuperAdmin
                    ? (policy) =>
                        setMsgEdit((s) => (s ? { ...s, comments_policy: policy } : s))
                    : undefined
                }
                showVisibility={false}
                postLabel="Save"
                onPost={() => void saveMessageEdit()}
                posting={wallPosting}
                canPost={
                  Boolean(msgEdit.content_html.replace(/<[^>]+>/g, "").trim()) ||
                  msgEdit.image_urls.length > 0
                }
              />
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMsgEdit(null)}>Cancel</Button>
        </DialogActions>
      </MobilizeDialog>

      <MobilizeAddMemberDialog
        open={addMemberOpen}
        groupId={groupId}
        groupName={group.name}
        onClose={() => setAddMemberOpen(false)}
        onAdded={() => {
          setAddMemberOpen(false);
          void loadMembers();
          void loadGroup();
        }}
      />

      <MobilizeGroupShareDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        groupName={group.name}
        publicUrl={`/g/${groupId}`}
      />
    </Box>
  );
}
