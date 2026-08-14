"use client";

import { MobilizeSocialPostEditor } from "@/components/mobilize/social/MobilizeSocialPostEditor";
import { MobilizeSocialHubContent } from "@/components/mobilize/social/MobilizeSocialHubContent";
import { MobilizeSocialHubLayout } from "@/components/mobilize/social/MobilizeSocialHubLayout";
import { MobilizeProfilePageShell } from "@/components/mobilize/social/MobilizeProfilePageShell";
import { MobilizeProfileSidebarCard } from "@/components/mobilize/social/MobilizeProfileSidebarCard";
import { MobilizeSocialPostCard } from "@/components/mobilize/social/MobilizeSocialPostCard";
import { MobilizeConnectionsDialog, type ConnectionKind } from "@/components/mobilize/social/MobilizeConnectionsDialog";
import { MobilizeImageLightbox } from "@/components/mobilize/MobilizeImageLightbox";
import { MobilizeSectionEmptyState } from "@/components/mobilize/MobilizeSectionEmptyState";
import { VerifiedUserBadge } from "@/components/user/VerifiedUserBadge";
import { useDashboardUser } from "@/contexts/DashboardUserContext";
import { MOBILIZE_EMPTY_STATE_IMAGES } from "@/lib/mobilize/mobilize-empty-state-icons";
import {
  PRIVATE_PROFILE_TAB_MESSAGE,
  PROFILE_TAB_EMPTY,
} from "@/lib/mobilize/social/social-empty-copy";
import {
  mobilizeChapterDetailRootSx,
  mobilizeGroupFeedCardSx,
} from "@/lib/mobilize/mobilize-ui-surface";
import { flashpointYellow } from "@/theme/tokens";
import type { UnifiedFeedPost } from "@/lib/mobilize/social/feed-types";
import { feedPostCommentConfig, feedPostReactionUrl } from "@/lib/mobilize/social/feed-post-urls";
import { SHOW_MOBILIZE_DIRECT_MESSAGES } from "@/lib/mobilize/mobilize-nav-config";
import { publicAssetSrc, cacheBustAssetUrl } from "@/lib/media/public-asset-url";
import { resolveProfileCoverUrl } from "@/lib/user/default-profile-cover";
import {
  emitProfileMediaUpdated,
  subscribeProfileMediaUpdated,
} from "@/lib/user/profile-media-events";
import { ImageCropDialog, type ImageCropKind } from "@/components/media/ImageCropDialog";
import {
  DEFAULT_MOBILIZE_IMAGE_UPLOAD_LIMITS,
  mbToBytes,
} from "@/lib/mobilize/image-upload-limits";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import PhotoCameraOutlinedIcon from "@mui/icons-material/PhotoCameraOutlined";
import PublicOutlinedIcon from "@mui/icons-material/PublicOutlined";
import { MobilizeDialog } from "@/components/mobilize/MobilizeDialog";
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const VISITOR_PROFILE_TABS = [
  { id: "posts", label: "Posts" },
  { id: "replies", label: "Replies" },
  { id: "media", label: "Media" },
] as const;

const OWN_PROFILE_EXTRA_TABS = [{ id: "likes", label: "Likes" }] as const;

type ProfileTabId = "posts" | "replies" | "media" | "likes";

type ProfilePayload = {
  id: string;
  display_name: string;
  handle: string;
  avatar_url: string | null;
  cover_url: string | null;
  bio: string | null;
  profile_visibility: "public" | "private";
  city: string | null;
  state: string | null;
  joined_at: string;
  followers_count: number;
  following_count: number;
  is_own_profile: boolean;
  is_following: boolean;
  is_followed_by?: boolean;
  is_mutual_follow?: boolean;
  can_message?: boolean;
  is_private_locked?: boolean;
  verified?: boolean;
  verified_at?: string | null;
};

type ProfilePost = UnifiedFeedPost;

type Props = {
  userId: string;
  backHref: string;
};

const profileContentGridSx = {
  display: "grid",
  gridTemplateColumns: { xs: "1fr", lg: "minmax(220px, 260px) minmax(0, 685px)" },
  gap: { xs: 2, lg: 2.5 },
  alignItems: "start",
  justifyContent: "center",
} as const;

function formatJoinedDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatHandle(handle: string) {
  const trimmed = handle.trim();
  if (!trimmed) return null;
  return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
}

export function MobilizeMemberProfileClient({ userId, backHref }: Props) {
  const router = useRouter();
  const me = useDashboardUser();
  const [profile, setProfile] = useState<ProfilePayload | null>(null);
  const [posts, setPosts] = useState<ProfilePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTabId>("posts");
  const [tabPosts, setTabPosts] = useState<ProfilePost[]>([]);
  const [tabLoading, setTabLoading] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [composerHtml, setComposerHtml] = useState("");
  const [composerImages, setComposerImages] = useState<string[]>([]);
  const [posting, setPosting] = useState(false);
  const [bioDraft, setBioDraft] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [savingSettings, setSavingSettings] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [unfollowConfirmOpen, setUnfollowConfirmOpen] = useState(false);
  const [connectionsDialog, setConnectionsDialog] = useState<ConnectionKind | null>(null);
  const [deletePostTarget, setDeletePostTarget] = useState<ProfilePost | null>(null);
  const [deletingPost, setDeletingPost] = useState(false);
  const [editPostTarget, setEditPostTarget] = useState<ProfilePost | null>(null);
  const [editPostHtml, setEditPostHtml] = useState("");
  const [editPostImages, setEditPostImages] = useState<string[]>([]);
  const [editPostSaving, setEditPostSaving] = useState(false);
  const [mediaUploading, setMediaUploading] = useState<"avatar" | "cover" | null>(null);
  const [cropKind, setCropKind] = useState<ImageCropKind | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [mediaNonce, setMediaNonce] = useState(() => Date.now());
  const [mediaLightboxOpen, setMediaLightboxOpen] = useState(false);
  const [mediaLightboxIndex, setMediaLightboxIndex] = useState(0);
  const [profileMaxMb, setProfileMaxMb] = useState(
    DEFAULT_MOBILIZE_IMAGE_UPLOAD_LIMITS.profile_image_max_mb
  );
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return subscribeProfileMediaUpdated((detail) => {
      setProfile((prev) => {
        if (!prev?.is_own_profile) return prev;
        return {
          ...prev,
          avatar_url:
            detail.avatar_url !== undefined ? detail.avatar_url : prev.avatar_url,
          cover_url: detail.cover_url !== undefined ? detail.cover_url : prev.cover_url,
        };
      });
      setMediaNonce(Date.now());
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/mobilize/upload-limits");
        if (!res.ok) return;
        const j = (await res.json()) as { profile_image_max_mb?: number };
        const mb = Number(j.profile_image_max_mb);
        if (!cancelled && Number.isFinite(mb) && mb > 0) setProfileMaxMb(mb);
      } catch {
        /* default */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    setError(null);
    try {
      const [profileRes, postsRes] = await Promise.all([
        fetch(`/api/mobilize/social/profiles/${userId}`),
        fetch(`/api/mobilize/social/profiles/${userId}/posts`),
      ]);
      const profileJson = await profileRes.json();
      const postsJson = postsRes.ok ? await postsRes.json() : { posts: [] };
      if (!profileRes.ok) throw new Error(profileJson.error || "Profile unavailable.");
      const p = profileJson.profile as ProfilePayload;
      setProfile(p);
      if (!p.is_private_locked) {
        if (!postsRes.ok) throw new Error(postsJson.error || "Failed to load posts.");
        const rawPosts = (postsJson.posts ?? []) as Array<{
          id: string;
          author_id: string;
          content: string;
          content_html: string | null;
          image_urls: string[];
          created_at: string;
          author: ProfilePayload;
          reactions: ProfilePost["reactions"];
          comment_count: number;
        }>;
        setPosts(
          rawPosts.map((row) => ({
            id: `pp-${row.id}`,
            kind: "profile_post" as const,
            created_at: row.created_at,
            author: row.author,
            content: row.content,
            content_html: row.content_html,
            image_urls: row.image_urls,
            reactions: row.reactions,
            comment_count: row.comment_count,
            profile_user_id: userId,
            post_id: row.id,
          }))
        );
      } else {
        setPosts([]);
      }
      setBioDraft(p.bio ?? "");
      setVisibility(p.profile_visibility);
    } catch (e) {
      setProfile(null);
      setPosts([]);
      setError(e instanceof Error ? e.message : "Failed to load profile.");
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const loadTabFeed = useCallback(async () => {
    if (profile?.is_private_locked || activeTab === "posts" || activeTab === "media") return;
    setTabLoading(true);
    try {
      const tab = activeTab === "likes" ? "likes" : "replies";
      const res = await fetch(`/api/mobilize/social/profiles/${userId}/activity?tab=${tab}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load tab.");
      setTabPosts((json.posts ?? []) as ProfilePost[]);
    } catch {
      setTabPosts([]);
    } finally {
      setTabLoading(false);
    }
  }, [activeTab, profile?.is_private_locked, userId]);

  useEffect(() => {
    if (activeTab === "replies" || activeTab === "likes") void loadTabFeed();
  }, [activeTab, loadTabFeed]);

  const photoUrls = useMemo(() => {
    const urls: string[] = [];
    for (const post of posts) {
      for (const url of post.image_urls ?? []) {
        if (url) urls.push(url);
      }
    }
    return urls;
  }, [posts]);

  async function toggleFollow() {
    if (!profile || profile.is_own_profile) return;
    setFollowBusy(true);
    try {
      const method = profile.is_following ? "DELETE" : "POST";
      const res = await fetch(`/api/mobilize/social/profiles/${userId}/follow`, { method });
      const json = (await res.json()) as { error?: string; is_following?: boolean };
      if (!res.ok) throw new Error(json.error || "Follow action failed.");
      const nextFollowing = Boolean(json.is_following);
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              is_following: nextFollowing,
              followers_count: Math.max(
                0,
                prev.followers_count + (nextFollowing ? 1 : -1)
              ),
            }
          : prev
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Follow action failed.");
    } finally {
      setFollowBusy(false);
      setUnfollowConfirmOpen(false);
    }
  }

  function handleFollowClick() {
    if (!profile || profile.is_own_profile) return;
    if (profile.is_following) {
      setUnfollowConfirmOpen(true);
      return;
    }
    void toggleFollow();
  }

  async function confirmDeletePost() {
    if (!deletePostTarget || !profile) return;
    setDeletingPost(true);
    try {
      const res = await fetch(
        `/api/mobilize/social/profiles/${profile.id}/posts/${deletePostTarget.post_id}`,
        { method: "DELETE" }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Delete failed.");
      setDeletePostTarget(null);
      await load({ silent: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed.");
    } finally {
      setDeletingPost(false);
    }
  }

  function openEditPost(post: ProfilePost) {
    setEditPostTarget(post);
    setEditPostHtml(post.content_html || post.content || "");
    setEditPostImages(post.image_urls ?? []);
  }

  async function saveEditPost() {
    if (!editPostTarget || !profile?.id || !editPostTarget.post_id) return;
    const plain = editPostHtml.replace(/<[^>]+>/g, "").trim();
    if (!plain && !editPostImages.length) return;
    setEditPostSaving(true);
    try {
      const res = await fetch(
        `/api/mobilize/social/profiles/${profile.id}/posts/${editPostTarget.post_id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content_html: editPostHtml, image_urls: editPostImages }),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Update failed.");
      setEditPostTarget(null);
      await load({ silent: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed.");
    } finally {
      setEditPostSaving(false);
    }
  }

  async function publishPost() {
    const plain = composerHtml.replace(/<[^>]+>/g, "").trim();
    if (!plain && !composerImages.length) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/mobilize/social/profiles/${userId}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content_html: composerHtml, image_urls: composerImages }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Post failed.");
      setComposerHtml("");
      setComposerImages([]);
      await load({ silent: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Post failed.");
    } finally {
      setPosting(false);
    }
  }

  async function saveSettings() {
    setSavingSettings(true);
    try {
      const res = await fetch("/api/mobilize/social/profile-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio: bioDraft, profile_visibility: visibility }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Save failed.");
      await load();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
      return false;
    } finally {
      setSavingSettings(false);
    }
  }

  async function uploadProfileMedia(kind: "avatar" | "cover", file: File) {
    setMediaUploading(kind);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(kind === "avatar" ? "/api/profile/avatar" : "/api/profile/cover", {
        method: "POST",
        body: fd,
      });
      const json = (await res.json()) as {
        error?: string;
        avatar_url?: string;
        cover_url?: string;
      };
      if (!res.ok) throw new Error(json.error || "Upload failed.");
      const nextAvatar =
        kind === "avatar" ? json.avatar_url ?? null : undefined;
      const nextCover = kind === "cover" ? json.cover_url ?? null : undefined;
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              avatar_url: nextAvatar !== undefined ? nextAvatar : prev.avatar_url,
              cover_url: nextCover !== undefined ? nextCover : prev.cover_url,
            }
          : prev
      );
      setMediaNonce(Date.now());
      emitProfileMediaUpdated({
        ...(nextAvatar !== undefined ? { avatar_url: nextAvatar } : {}),
        ...(nextCover !== undefined ? { cover_url: nextCover } : {}),
      });
      router.refresh();
      await load({ silent: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setMediaUploading(null);
      if (kind === "avatar" && avatarInputRef.current) avatarInputRef.current.value = "";
      if (kind === "cover" && coverInputRef.current) coverInputRef.current.value = "";
    }
  }

  function pickProfileMedia(kind: ImageCropKind, files: FileList | null) {
    const f = files?.[0];
    if (!f) return;
    setCropKind(kind);
    setCropFile(f);
  }

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !profile) {
    return (
      <Box sx={mobilizeChapterDetailRootSx}>
        <Alert severity="warning">{error}</Alert>
        <Button component={Link} href="/dashboard" sx={{ mt: 2 }}>
          Dashboard
        </Button>
      </Box>
    );
  }

  if (!profile) return null;

  const p = profile;
  const handleLabel = formatHandle(p.handle);
  const locationLabel = [p.city, p.state].filter(Boolean).join(", ");
  const locked = Boolean(p.is_private_locked);
  const coverSrc = resolveProfileCoverUrl(p.cover_url);
  const coverDisplaySrc = p.cover_url?.trim()
    ? cacheBustAssetUrl(p.cover_url.trim(), mediaNonce)
    : coverSrc;
  const avatarDisplaySrc = p.avatar_url?.trim()
    ? cacheBustAssetUrl(p.avatar_url.trim(), mediaNonce)
    : undefined;

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

  const headerActions = p.is_own_profile ? (
    <Button variant="outlined" onClick={() => setEditOpen(true)} sx={heroBtnSx}>
      Edit profile
    </Button>
  ) : (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
      <Button
        variant={p.is_following ? "outlined" : "contained"}
        onClick={() => handleFollowClick()}
        disabled={followBusy}
        sx={{
          ...heroBtnSx,
          minWidth: 110,
          ...(p.is_following
            ? {}
            : {
                bgcolor: flashpointYellow,
                color: "#0d0d0d",
                borderColor: flashpointYellow,
                "&:hover": { bgcolor: "#ffe44d", borderColor: flashpointYellow },
              }),
        }}
      >
        {followBusy ? "…" : p.is_following ? "Following" : p.is_followed_by ? "Follow back" : "Follow"}
      </Button>
      {SHOW_MOBILIZE_DIRECT_MESSAGES && p.can_message ? (
        <Button
          component={Link}
          href={`/dashboard/mobilize/messages?with=${userId}`}
          variant="outlined"
          startIcon={<MailOutlineIcon />}
          sx={heroBtnSx}
        >
          Message
        </Button>
      ) : null}
    </Stack>
  );

  const canViewConnections = p.is_own_profile || p.profile_visibility === "public";
  const connectionStatSx = {
    fontWeight: 500,
    color: "text.secondary",
    fontFamily: "inherit",
    fontSize: "inherit",
    lineHeight: "inherit",
    textAlign: "left" as const,
    ...(canViewConnections
      ? {
          cursor: "pointer",
          border: "none",
          bgcolor: "transparent",
          p: 0,
          borderRadius: 1,
          "&:hover": { color: "#0866ff" },
        }
      : {}),
  };

  const profileMeta = (
    <Box>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: { xs: 1.5, sm: 2 }, mt: 0.15 }}>
        <Box
          component={canViewConnections ? "button" : "span"}
          type={canViewConnections ? "button" : undefined}
          onClick={canViewConnections ? () => setConnectionsDialog("followers") : undefined}
          aria-label="View followers"
          sx={connectionStatSx}
        >
          <Box component="span" sx={{ fontWeight: 800, color: "text.primary" }}>
            {p.followers_count.toLocaleString()}
          </Box>{" "}
          Followers
        </Box>
        <Box
          component={canViewConnections ? "button" : "span"}
          type={canViewConnections ? "button" : undefined}
          onClick={canViewConnections ? () => setConnectionsDialog("following") : undefined}
          aria-label="View following"
          sx={connectionStatSx}
        >
          <Box component="span" sx={{ fontWeight: 800, color: "text.primary" }}>
            {p.following_count.toLocaleString()}
          </Box>{" "}
          Following
        </Box>
      </Box>
      {(locationLabel || p.joined_at) && (
        <Typography variant="body2" sx={{ mt: 0.5, color: "text.secondary" }}>
          {[locationLabel ? `Lives in ${locationLabel}` : null, `Joined ${formatJoinedDate(p.joined_at)}`]
            .filter(Boolean)
            .join(" · ")}
        </Typography>
      )}
    </Box>
  );

  const profileTabs = p.is_own_profile
    ? [...VISITOR_PROFILE_TABS, ...OWN_PROFILE_EXTRA_TABS]
    : [...VISITOR_PROFILE_TABS];

  const introCard = (
    <MobilizeProfileSidebarCard title="Intro" variant="groupFeed">
      {p.bio ? (
        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
          {p.bio}
        </Typography>
      ) : (
        <Typography variant="body2" color="text.secondary">
          {p.is_own_profile ? "Add a short bio so others know more about you." : "No bio yet."}
        </Typography>
      )}
      {handleLabel ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.25 }}>
          {handleLabel}
        </Typography>
      ) : null}
      {locationLabel ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
          Lives in {locationLabel}
        </Typography>
      ) : null}
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
        Joined {formatJoinedDate(p.joined_at)}
      </Typography>
    </MobilizeProfileSidebarCard>
  );

  const postsFeed = (
    <Stack spacing={{ xs: "15px", sm: 1.5 }}>
      {p.is_own_profile ? (
        <Paper
          elevation={0}
          sx={{
            bgcolor: "#fff",
            color: "#0d0d0d",
            overflow: "hidden",
            p: 0,
            mt: { xs: 0, sm: "1rem" },
            borderRadius: { xs: 0, sm: "1rem" },
            boxShadow: { xs: "none", sm: "0 0 9px 1px #d2d2d2" },
            border: "none",
            borderBottom: { xs: "1px solid rgba(0,0,0,0.08)", sm: "none" },
          }}
        >
          <MobilizeSocialPostEditor
            value={composerHtml}
            onChange={setComposerHtml}
            disabled={posting}
            surface="light"
            brandAccent
            avatarUrl={avatarDisplaySrc ?? p.avatar_url}
            avatarFallback={p.display_name}
            imageUrls={composerImages}
            onImageUrlsChange={setComposerImages}
            postLabel="Post"
            onPost={() => void publishPost()}
            posting={posting}
            canPost={Boolean(composerHtml.replace(/<[^>]+>/g, "").trim()) || composerImages.length > 0}
          />
        </Paper>
      ) : null}

      {posts.map((post) => (
        <MobilizeSocialPostCard
          key={post.id}
          post={post}
          canComment
          commentConfig={feedPostCommentConfig(post)}
          reactionUrl={feedPostReactionUrl(post)}
          showGroupBadge={false}
          layout="groupFeedCard"
          viewerAvatarUrl={me.avatar_url}
          viewerDisplayName={me.display_name ?? me.email}
          viewerUserId={me.id}
          viewerIsSuperAdmin={me.role_names.includes("super_admin")}
          manageActions={
            post.author.id === me.id || me.role_names.includes("super_admin") ? (
              <Stack direction="row" spacing={0.25}>
                <Tooltip title="Edit post">
                  <IconButton
                    size="small"
                    onClick={() => openEditPost(post)}
                    aria-label="Edit post"
                  >
                    <EditOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete post">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => setDeletePostTarget(post)}
                    aria-label="Delete post"
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            ) : undefined
          }
        />
      ))}

      {!posts.length ? (
        <Paper elevation={0} sx={{ ...mobilizeGroupFeedCardSx, overflow: "hidden" }}>
          <MobilizeSectionEmptyState
            fill
            layout="stacked"
            imageSrc={MOBILIZE_EMPTY_STATE_IMAGES.announcements}
            title={PROFILE_TAB_EMPTY.posts.title}
            description={
              p.is_own_profile
                ? PROFILE_TAB_EMPTY.posts.description
                : "This member has not posted anything yet."
            }
          />
        </Paper>
      ) : null}
    </Stack>
  );

  const tabPanelSx = {
    flex: 1,
    minHeight: 0,
    bgcolor: "transparent",
    borderRadius: { xs: 0, sm: 2 },
    p: { xs: 0, sm: 2 },
    display: "flex",
    flexDirection: "column",
  } as const;

  function renderTabContent() {
    if (locked) {
      return (
        <Box sx={tabPanelSx}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 2,
              border: "1px solid rgba(0,0,0,0.08)",
              bgcolor: "#fff",
              flex: 1,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <MobilizeSectionEmptyState fill layout="stacked" title="Private profile" description={PRIVATE_PROFILE_TAB_MESSAGE} />
          </Paper>
        </Box>
      );
    }

    const renderPostList = (items: ProfilePost[], emptyCopy: { title: string; description: string }) => (
      <Stack spacing={{ xs: "15px", sm: 1.5 }}>
        {items.map((post) => (
          <MobilizeSocialPostCard
            key={post.id}
            post={post}
            canComment
            commentConfig={feedPostCommentConfig(post)}
            reactionUrl={feedPostReactionUrl(post)}
            showGroupBadge={post.kind === "group_message"}
            layout="groupFeedCard"
            viewerAvatarUrl={me.avatar_url}
            viewerDisplayName={me.display_name ?? me.email}
            viewerUserId={me.id}
            viewerIsSuperAdmin={me.role_names.includes("super_admin")}
          />
        ))}
        {!items.length && !tabLoading ? (
          <Paper elevation={0} sx={{ ...mobilizeGroupFeedCardSx, overflow: "hidden", flex: 1, display: "flex", flexDirection: "column" }}>
            <MobilizeSectionEmptyState fill layout="stacked" title={emptyCopy.title} description={emptyCopy.description} />
          </Paper>
        ) : null}
        {tabLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : null}
      </Stack>
    );

    switch (activeTab) {
      case "posts":
        return (
          <Box sx={tabPanelSx}>
            <Box sx={{ ...profileContentGridSx, flex: 1, minHeight: 0 }}>
              <Box sx={{ display: { xs: "none", lg: "block" } }}>{introCard}</Box>
              <Box sx={{ minWidth: 0 }}>
                <Box sx={{ display: { xs: "block", lg: "none" }, mb: 1.5 }}>{introCard}</Box>
                {postsFeed}
              </Box>
            </Box>
          </Box>
        );

      case "replies":
        return (
          <Box sx={tabPanelSx}>
            {renderPostList(tabPosts, PROFILE_TAB_EMPTY.replies)}
          </Box>
        );

      case "likes":
        return (
          <Box sx={tabPanelSx}>
            {renderPostList(tabPosts, PROFILE_TAB_EMPTY.likes)}
          </Box>
        );

      case "media":
        return (
          <Box sx={tabPanelSx}>
            {photoUrls.length ? (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "repeat(2, 1fr)",
                    sm: "repeat(3, 1fr)",
                    md: "repeat(4, 1fr)",
                  },
                  gap: 1,
                }}
              >
                {photoUrls.map((url, i) => (
                  <Box
                    key={`${url}-${i}`}
                    component="button"
                    type="button"
                    onClick={() => {
                      setMediaLightboxIndex(i);
                      setMediaLightboxOpen(true);
                    }}
                    aria-label="Open image"
                    sx={{
                      p: 0,
                      border: "none",
                      cursor: "pointer",
                      borderRadius: 1.5,
                      overflow: "hidden",
                      bgcolor: "#e4e6eb",
                      display: "block",
                    }}
                  >
                    <Box
                      component="img"
                      src={publicAssetSrc(url)}
                      alt=""
                      sx={{
                        width: "100%",
                        aspectRatio: "1",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  </Box>
                ))}
              </Box>
            ) : (
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 2,
                  border: "1px solid rgba(0,0,0,0.08)",
                  bgcolor: "#fff",
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <MobilizeSectionEmptyState
                  fill
                  layout="stacked"
                  title={PROFILE_TAB_EMPTY.media.title}
                  description={
                    p.is_own_profile
                      ? PROFILE_TAB_EMPTY.media.description
                      : "Photos and media shared in posts will appear here."
                  }
                />
              </Paper>
            )}
          <MobilizeImageLightbox
            urls={photoUrls}
            open={mediaLightboxOpen}
            initialIndex={mediaLightboxIndex}
            onClose={() => setMediaLightboxOpen(false)}
          />
          </Box>
        );

      default:
        return null;
    }
  }

  return (
    <Box sx={{ ...mobilizeChapterDetailRootSx, display: "flex", flexDirection: "column", minHeight: 0 }}>
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      ) : null}

      <MobilizeSocialHubLayout showInternalNav={false} showRightRail={false}>
        <MobilizeSocialHubContent tone="light">
          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              width: "100%",
              maxWidth: 1180,
              mx: "auto",
              p: { xs: 0, sm: 1.5, md: 2 },
            }}
          >
          <MobilizeProfilePageShell
        coverSrc={coverDisplaySrc}
        title={p.display_name}
        titleAddon={p.verified ? <VerifiedUserBadge size={20} verifiedAt={p.verified_at} /> : null}
        subtitle={handleLabel}
        meta={profileMeta}
        avatarSrc={avatarDisplaySrc ?? p.avatar_url}
        avatarFallback={p.display_name}
        headerActions={headerActions}
        tabs={profileTabs.map((t) => ({ id: t.id, label: t.label }))}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as ProfileTabId)}
        socialTabStyle
        tabsInContent
        fillContent
        unifiedContent
      >
        <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "auto" }}>
          {renderTabContent()}
        </Box>
      </MobilizeProfilePageShell>
          </Box>
        </MobilizeSocialHubContent>
      </MobilizeSocialHubLayout>

      <MobilizeDialog
        open={editOpen}
        onClose={() => !savingSettings && !mediaUploading && setEditOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Edit profile</DialogTitle>
        <DialogContent>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            hidden
            onChange={(e) => {
              pickProfileMedia("cover", e.target.files);
              e.target.value = "";
            }}
          />
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            hidden
            onChange={(e) => {
              pickProfileMedia("profile", e.target.files);
              e.target.value = "";
            }}
          />

          <Box sx={{ position: "relative", mt: 1 }}>
            <Box sx={{ position: "relative", borderRadius: 2, overflow: "hidden" }}>
              <Box
                sx={{
                  height: 140,
                  backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.45) 100%), url(${coverDisplaySrc})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
              <Button
                size="small"
                variant="contained"
                startIcon={
                  mediaUploading === "cover" ? (
                    <CircularProgress size={14} color="inherit" />
                  ) : (
                    <PhotoCameraOutlinedIcon fontSize="small" />
                  )
                }
                disabled={Boolean(mediaUploading) || savingSettings}
                onClick={() => coverInputRef.current?.click()}
                sx={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  textTransform: "none",
                  bgcolor: "rgba(0,0,0,0.65)",
                  "&:hover": { bgcolor: "rgba(0,0,0,0.8)" },
                }}
              >
                Change cover
              </Button>
            </Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "flex-end",
                gap: 1.25,
                mt: -4,
                ml: 2,
                position: "relative",
                zIndex: 1,
              }}
            >
              <Avatar
                key={avatarDisplaySrc || "edit-avatar"}
                src={avatarDisplaySrc}
                sx={{
                  width: 72,
                  height: 72,
                  border: "3px solid #fff",
                  bgcolor: "primary.dark",
                  fontWeight: 700,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
                }}
              >
                {p.display_name.slice(0, 2).toUpperCase()}
              </Avatar>
              <Button
                size="small"
                variant="outlined"
                startIcon={
                  mediaUploading === "avatar" ? (
                    <CircularProgress size={14} />
                  ) : (
                    <PhotoCameraOutlinedIcon fontSize="small" />
                  )
                }
                disabled={Boolean(mediaUploading) || savingSettings}
                onClick={() => avatarInputRef.current?.click()}
                sx={{
                  mb: 0.75,
                  textTransform: "none",
                  bgcolor: "#fff",
                  borderColor: "rgba(0,0,0,0.2)",
                }}
              >
                Change photo
              </Button>
            </Box>
          </Box>

          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5 }}>
            JPEG, PNG, WebP or GIF · max {profileMaxMb} MB · square crop for photo, 21:9 for cover
          </Typography>

          <FormControl sx={{ mt: 2, width: "100%" }}>
            <RadioGroup
              value={visibility}
              onChange={(_, v) => setVisibility(v as "public" | "private")}
            >
              <FormControlLabel
                value="public"
                control={<Radio size="small" />}
                label={
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <PublicOutlinedIcon fontSize="small" />
                    <span>Public</span>
                  </Stack>
                }
              />
              <FormControlLabel
                value="private"
                control={<Radio size="small" />}
                label={
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <LockOutlinedIcon fontSize="small" />
                    <span>Private</span>
                  </Stack>
                }
              />
            </RadioGroup>
          </FormControl>
          <TextField
            fullWidth
            multiline
            minRows={3}
            label="Bio"
            value={bioDraft}
            onChange={(e) => setBioDraft(e.target.value)}
            sx={{ mt: 2 }}
            size="small"
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setEditOpen(false)}
            disabled={savingSettings || Boolean(mediaUploading)}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={savingSettings || Boolean(mediaUploading)}
            onClick={() => {
              void saveSettings().then((ok) => {
                if (ok) setEditOpen(false);
              });
            }}
          >
            {savingSettings ? "Saving…" : "Save"}
          </Button>
        </DialogActions>
      </MobilizeDialog>

      <MobilizeDialog
        open={unfollowConfirmOpen}
        onClose={() => !followBusy && setUnfollowConfirmOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Unfollow {p.display_name}?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Their posts will no longer appear in your Following feed.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUnfollowConfirmOpen(false)} disabled={followBusy}>
            No
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={followBusy}
            onClick={() => void toggleFollow()}
          >
            {followBusy ? "…" : "Yes, unfollow"}
          </Button>
        </DialogActions>
      </MobilizeDialog>

      <ImageCropDialog
        open={Boolean(cropFile)}
        file={cropFile}
        kind={cropKind ?? "profile"}
        maxBytes={mbToBytes(profileMaxMb)}
        onCancel={() => {
          setCropFile(null);
          setCropKind(null);
        }}
        onConfirm={(file) => {
          const kind = cropKind;
          setCropFile(null);
          setCropKind(null);
          if (kind === "profile") void uploadProfileMedia("avatar", file);
          else if (kind === "cover") void uploadProfileMedia("cover", file);
        }}
      />

      <MobilizeConnectionsDialog
        open={Boolean(connectionsDialog)}
        kind={connectionsDialog ?? "followers"}
        userId={p.id}
        onClose={() => setConnectionsDialog(null)}
      />

      <MobilizeDialog
        open={Boolean(deletePostTarget)}
        onClose={() => !deletingPost && setDeletePostTarget(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Delete post?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            This post will be permanently removed. This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeletePostTarget(null)} disabled={deletingPost}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={deletingPost}
            onClick={() => void confirmDeletePost()}
          >
            {deletingPost ? "Deleting…" : "Delete"}
          </Button>
        </DialogActions>
      </MobilizeDialog>

      <MobilizeDialog
        open={Boolean(editPostTarget)}
        onClose={() => !editPostSaving && setEditPostTarget(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Edit post</DialogTitle>
        <DialogContent>
          {editPostTarget ? (
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
                value={editPostHtml}
                onChange={setEditPostHtml}
                disabled={editPostSaving}
                surface="light"
                brandAccent
                headingLabel="Edit post"
                avatarUrl={avatarDisplaySrc ?? p.avatar_url}
                avatarFallback={p.display_name}
                imageUrls={editPostImages}
                onImageUrlsChange={setEditPostImages}
                postLabel="Save"
                onPost={() => void saveEditPost()}
                posting={editPostSaving}
                canPost={
                  Boolean(editPostHtml.replace(/<[^>]+>/g, "").trim()) || editPostImages.length > 0
                }
              />
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditPostTarget(null)} disabled={editPostSaving}>
            Cancel
          </Button>
        </DialogActions>
      </MobilizeDialog>
    </Box>
  );
}
