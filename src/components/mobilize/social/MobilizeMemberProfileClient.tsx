"use client";

import { MobilizeSocialPostEditor } from "@/components/mobilize/social/MobilizeSocialPostEditor";
import { MobilizeSocialHubContent } from "@/components/mobilize/social/MobilizeSocialHubContent";
import { MobilizeSocialHubLayout } from "@/components/mobilize/social/MobilizeSocialHubLayout";
import { MobilizeProfilePageShell } from "@/components/mobilize/social/MobilizeProfilePageShell";
import { MobilizeProfileSidebarCard } from "@/components/mobilize/social/MobilizeProfileSidebarCard";
import { MobilizeSocialPostCard } from "@/components/mobilize/social/MobilizeSocialPostCard";
import { MobilizeSectionEmptyState } from "@/components/mobilize/MobilizeSectionEmptyState";
import { MOBILIZE_EMPTY_STATE_IMAGES } from "@/lib/mobilize/mobilize-empty-state-icons";
import {
  PRIVATE_PROFILE_TAB_MESSAGE,
  PROFILE_TAB_EMPTY,
} from "@/lib/mobilize/social/social-empty-copy";
import { mobilizeChapterDetailRootSx } from "@/lib/mobilize/mobilize-ui-surface";
import type { UnifiedFeedPost } from "@/lib/mobilize/social/feed-types";
import { feedPostCommentConfig, feedPostReactionUrl } from "@/lib/mobilize/social/feed-post-urls";
import { publicAssetSrc } from "@/lib/media/public-asset-url";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import PublicOutlinedIcon from "@mui/icons-material/PublicOutlined";
import { MobilizeDialog } from "@/components/mobilize/MobilizeDialog";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

const PROFILE_COVER =
  "https://fparmychapters.com/wp-content/uploads/2026/07/image-cover-profile-right-scaled.jpg";

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
};

type ProfilePost = UnifiedFeedPost;

type Props = {
  userId: string;
  backHref: string;
};

const profileContentGridSx = {
  display: "grid",
  gridTemplateColumns: { xs: "1fr", lg: "minmax(280px, 360px) minmax(0, 1fr)" },
  gap: { xs: 2, lg: 2.5 },
  alignItems: "start",
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

  const load = useCallback(async () => {
    setLoading(true);
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
      setLoading(false);
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
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Follow action failed.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Follow action failed.");
    } finally {
      setFollowBusy(false);
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
      await load();
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

  const headerActions = p.is_own_profile ? (
    <Button
      variant="outlined"
      onClick={() => setEditOpen(true)}
      sx={{
        borderRadius: 99,
        textTransform: "none",
        fontWeight: 700,
        color: "text.primary",
        borderColor: "rgba(0,0,0,0.2)",
      }}
    >
      Edit profile
    </Button>
  ) : (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
      <Button
        variant={p.is_following ? "outlined" : "contained"}
        onClick={() => void toggleFollow()}
        disabled={followBusy}
        sx={{
          borderRadius: 99,
          textTransform: "none",
          fontWeight: 700,
          minWidth: 110,
          ...(p.is_following
            ? { color: "text.primary", borderColor: "rgba(0,0,0,0.2)" }
            : { bgcolor: "#1877f2", "&:hover": { bgcolor: "#166fe5" } }),
        }}
      >
        {followBusy ? "…" : p.is_following ? "Following" : "Follow"}
      </Button>
      {p.can_message ? (
        <Button
          component={Link}
          href={`/dashboard/mobilize/messages?with=${userId}`}
          variant="outlined"
          startIcon={<MailOutlineIcon />}
          sx={{
            borderRadius: 99,
            textTransform: "none",
            fontWeight: 700,
            color: "text.primary",
            borderColor: "rgba(0,0,0,0.2)",
          }}
        >
          Message
        </Button>
      ) : null}
    </Stack>
  );

  const profileMeta = [
    `Joined ${formatJoinedDate(p.joined_at)}`,
    locationLabel || null,
    `${p.followers_count.toLocaleString()} Followers`,
    `${p.following_count.toLocaleString()} Following`,
  ]
    .filter(Boolean)
    .join(" · ");

  const profileTabs = p.is_own_profile
    ? [...VISITOR_PROFILE_TABS, ...OWN_PROFILE_EXTRA_TABS]
    : [...VISITOR_PROFILE_TABS];

  const introCard = (
    <MobilizeProfileSidebarCard title="Intro">
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
    <Stack spacing={1.5}>
      {p.is_own_profile ? (
        <MobilizeSocialPostEditor
          value={composerHtml}
          onChange={setComposerHtml}
          disabled={posting}
          surface="light"
          avatarUrl={p.avatar_url}
          avatarFallback={p.display_name}
          imageUrls={composerImages}
          onImageUrlsChange={setComposerImages}
          postLabel="Post"
          onPost={() => void publishPost()}
          posting={posting}
          canPost={Boolean(composerHtml.replace(/<[^>]+>/g, "").trim()) || composerImages.length > 0}
        />
      ) : null}

      {posts.map((post) => (
        <MobilizeSocialPostCard
          key={post.id}
          post={post}
          canComment
          commentConfig={feedPostCommentConfig(post)}
          reactionUrl={feedPostReactionUrl(post)}
          showGroupBadge={false}
        />
      ))}

      {!posts.length ? (
        <Paper
          elevation={0}
          sx={{
            borderRadius: 2,
            border: "1px solid rgba(0,0,0,0.08)",
            bgcolor: "#fff",
            overflow: "hidden",
          }}
        >
          <MobilizeSectionEmptyState
            fill
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
    bgcolor: "#f0f2f5",
    borderRadius: 2,
    p: { xs: 1, sm: 2 },
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
            <MobilizeSectionEmptyState fill title="Nothing to see here" description={PRIVATE_PROFILE_TAB_MESSAGE} />
          </Paper>
        </Box>
      );
    }

    const renderPostList = (items: ProfilePost[], emptyCopy: { title: string; description: string }) => (
      <Stack spacing={1.5}>
        {items.map((post) => (
          <MobilizeSocialPostCard
            key={post.id}
            post={post}
            canComment
            commentConfig={feedPostCommentConfig(post)}
            reactionUrl={feedPostReactionUrl(post)}
            showGroupBadge={post.kind === "group_message"}
          />
        ))}
        {!items.length && !tabLoading ? (
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
            <MobilizeSectionEmptyState fill title={emptyCopy.title} description={emptyCopy.description} />
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
                    component="img"
                    src={publicAssetSrc(url)}
                    alt=""
                    sx={{
                      width: "100%",
                      aspectRatio: "1",
                      objectFit: "cover",
                      borderRadius: 1.5,
                      bgcolor: "#e4e6eb",
                      display: "block",
                    }}
                  />
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
                  title={PROFILE_TAB_EMPTY.media.title}
                  description={
                    p.is_own_profile
                      ? PROFILE_TAB_EMPTY.media.description
                      : "Photos and media shared in posts will appear here."
                  }
                />
              </Paper>
            )}
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

      <MobilizeSocialHubLayout>
        <MobilizeSocialHubContent tone="light">
          <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", p: { xs: 1, sm: 1.5 } }}>
          <MobilizeProfilePageShell
        coverSrc={PROFILE_COVER}
        title={p.display_name}
        subtitle={handleLabel}
        meta={profileMeta}
        avatarSrc={p.avatar_url}
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

      <MobilizeDialog open={editOpen} onClose={() => !savingSettings && setEditOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Edit profile</DialogTitle>
        <DialogContent>
          <FormControl sx={{ mt: 1, width: "100%" }}>
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
          <Button onClick={() => setEditOpen(false)} disabled={savingSettings}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={savingSettings}
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
    </Box>
  );
}
