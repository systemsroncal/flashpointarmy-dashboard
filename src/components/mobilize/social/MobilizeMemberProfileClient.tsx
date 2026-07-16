"use client";

import { GatheringDescriptionEditor } from "@/components/dashboard/gatherings/GatheringDescriptionEditor";
import { MobilizeProfilePageShell } from "@/components/mobilize/social/MobilizeProfilePageShell";
import { MobilizeProfileSidebarCard } from "@/components/mobilize/social/MobilizeProfileSidebarCard";
import { MobilizeSocialFeedShell } from "@/components/mobilize/social/MobilizeSocialFeedShell";
import { MobilizeSocialPostCard } from "@/components/mobilize/social/MobilizeSocialPostCard";
import { MobilizeContentPanel } from "@/components/mobilize/MobilizeContentPanel";
import type { UnifiedFeedPost } from "@/lib/mobilize/social/feed-types";
import { feedPostCommentConfig, feedPostReactionUrl } from "@/lib/mobilize/social/feed-post-urls";
import { publicAssetSrc } from "@/lib/media/public-asset-url";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PublicOutlinedIcon from "@mui/icons-material/PublicOutlined";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const PROFILE_COVER =
  "https://fparmychapters.com/wp-content/uploads/2026/07/image-cover-profile-right-scaled.jpg";

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
  is_private_locked?: boolean;
};

type ProfilePost = UnifiedFeedPost;

type Props = {
  userId: string;
  backHref: string;
};

export function MobilizeMemberProfileClient({ userId, backHref }: Props) {
  const [profile, setProfile] = useState<ProfilePayload | null>(null);
  const [posts, setPosts] = useState<ProfilePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [followBusy, setFollowBusy] = useState(false);
  const [composerHtml, setComposerHtml] = useState("");
  const [posting, setPosting] = useState(false);
  const [bioDraft, setBioDraft] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [savingSettings, setSavingSettings] = useState(false);

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
    if (!plain) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/mobilize/social/profiles/${userId}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content_html: composerHtml }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Post failed.");
      setComposerHtml("");
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
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
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
      <MobilizeContentPanel>
        <Alert severity="warning">{error}</Alert>
        <Button component={Link} href={backHref} sx={{ mt: 2 }}>
          Back
        </Button>
      </MobilizeContentPanel>
    );
  }

  if (!profile) return null;

  const headerActions = profile.is_own_profile ? (
    <Typography variant="caption" color="text.secondary">
      Your profile
    </Typography>
  ) : (
    <Button
      variant={profile.is_following ? "outlined" : "contained"}
      onClick={() => void toggleFollow()}
      disabled={followBusy}
      sx={{ borderRadius: 99, textTransform: "none", fontWeight: 700 }}
    >
      {followBusy ? "…" : profile.is_following ? "Following" : "Follow"}
    </Button>
  );

  const leftRail = (
    <>
      <MobilizeProfileSidebarCard title="About">
        {profile.bio ? (
          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
            {profile.bio}
          </Typography>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No bio yet.
          </Typography>
        )}
        <Stack direction="row" spacing={2} sx={{ mt: 1.5 }}>
          <Typography variant="body2">
            <strong>{profile.followers_count}</strong> Followers
          </Typography>
          <Typography variant="body2">
            <strong>{profile.following_count}</strong> Following
          </Typography>
        </Stack>
        {profile.city || profile.state ? (
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
            {[profile.city, profile.state].filter(Boolean).join(", ")}
          </Typography>
        ) : null}
      </MobilizeProfileSidebarCard>
      {profile.is_own_profile ? (
        <MobilizeProfileSidebarCard title="Privacy">
          <FormControl>
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
            minRows={2}
            label="Bio"
            value={bioDraft}
            onChange={(e) => setBioDraft(e.target.value)}
            sx={{ mt: 1, mb: 1 }}
            size="small"
          />
          <Button size="small" variant="outlined" disabled={savingSettings} onClick={() => void saveSettings()}>
            {savingSettings ? "Saving…" : "Save settings"}
          </Button>
        </MobilizeProfileSidebarCard>
      ) : null}
    </>
  );

  return (
    <Box>
      <Button component={Link} href={backHref} size="small" sx={{ mb: 1 }}>
        Back
      </Button>

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      ) : null}

      <MobilizeProfilePageShell
        coverSrc={PROFILE_COVER}
        title={profile.display_name}
        subtitle={profile.handle}
        avatarSrc={profile.avatar_url}
        avatarFallback={profile.display_name}
        headerActions={headerActions}
      >
        <Box>
          {profile.is_private_locked ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              This profile is private. Follow to see posts and full details.
            </Alert>
          ) : null}

          {!profile.is_private_locked ? (
            <MobilizeSocialFeedShell leftRail={leftRail}>
                {profile.is_own_profile ? (
                  <Box
                    sx={{
                      mb: 1.5,
                      p: 2,
                      borderRadius: 2.5,
                      bgcolor: "#fff",
                      border: "1px solid rgba(0,0,0,0.08)",
                    }}
                  >
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      What&apos;s on your mind?
                    </Typography>
                    <GatheringDescriptionEditor
                      value={composerHtml}
                      onChange={setComposerHtml}
                      label=""
                      showHelper={false}
                      compact
                      disabled={posting}
                    />
                    <Button
                      variant="contained"
                      sx={{ mt: 1, borderRadius: 99, textTransform: "none" }}
                      disabled={posting || !composerHtml.replace(/<[^>]+>/g, "").trim()}
                      onClick={() => void publishPost()}
                    >
                      {posting ? "Posting…" : "Post"}
                    </Button>
                  </Box>
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
                  <Typography color="text.secondary" sx={{ p: 2, bgcolor: "#fff", borderRadius: 2 }}>
                    {profile.is_own_profile ? "You have not posted yet." : "No posts yet."}
                  </Typography>
                ) : null}
              </MobilizeSocialFeedShell>
          ) : null}
        </Box>
      </MobilizeProfilePageShell>
    </Box>
  );
}
