"use client";

import { GatheringDescriptionEditor } from "@/components/dashboard/gatherings/GatheringDescriptionEditor";
import { MobilizeFeedHtml } from "@/components/mobilize/social/MobilizeFeedHtml";
import { MobilizeSocialComments } from "@/components/mobilize/social/MobilizeSocialComments";
import { MobilizeSocialReactionBar } from "@/components/mobilize/social/MobilizeSocialReactionBar";
import { MobilizeContentPanel } from "@/components/mobilize/MobilizeContentPanel";
import { mobilizeCardSx } from "@/lib/mobilize/mobilize-ui-surface";
import type { ReactionType } from "@/lib/mobilize/social/reaction-summary";
import { publicAssetSrc } from "@/lib/media/public-asset-url";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PublicOutlinedIcon from "@mui/icons-material/PublicOutlined";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  FormControlLabel,
  IconButton,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

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

type ProfilePost = {
  id: string;
  author_id: string;
  content: string;
  content_html: string | null;
  image_urls: string[];
  created_at: string;
  author: ProfilePayload;
  reactions: {
    like: number;
    love: number;
    total: number;
    viewer_reaction: ReactionType | null;
  };
  comment_count: number;
};

type Props = {
  userId: string;
  backHref: string;
};

function ProfilePostCard({
  profileUserId,
  post,
  canComment,
}: {
  profileUserId: string;
  post: ProfilePost;
  canComment: boolean;
}) {
  const [reactions, setReactions] = useState(post.reactions);
  const [commentCount, setCommentCount] = useState(post.comment_count);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function setReaction(next: ReactionType | null) {
    setBusy(true);
    try {
      const res = await fetch(
        `/api/mobilize/social/profiles/${profileUserId}/posts/${post.id}/reactions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reaction_type: next }),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Reaction failed.");
      setReactions(json.reactions);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card variant="outlined" sx={{ mb: 1.5, ...mobilizeCardSx, borderRadius: 2 }}>
      <CardContent>
        <Typography variant="caption" color="text.secondary">
          {new Date(post.created_at).toLocaleString()}
        </Typography>
        <Box sx={{ mt: 0.75 }}>
          <MobilizeFeedHtml html={post.content_html} plain={post.content} />
        </Box>
        <MobilizeSocialReactionBar
          reactions={reactions}
          commentCount={commentCount}
          onToggleLike={() => void setReaction(reactions.viewer_reaction === "like" ? null : "like")}
          onToggleLove={() => void setReaction(reactions.viewer_reaction === "love" ? null : "love")}
          onToggleComments={() => setCommentsOpen((v) => !v)}
          commentsOpen={commentsOpen}
          disabled={busy}
        />
        <MobilizeSocialComments
          open={commentsOpen}
          canComment={canComment}
          commentsUrl={`/api/mobilize/social/profiles/${profileUserId}/posts/${post.id}/comments`}
          commentReactionUrl={(commentId) =>
            `/api/mobilize/social/profiles/${profileUserId}/posts/${post.id}/comments/${commentId}/reactions`
          }
          onCountChange={setCommentCount}
        />
      </CardContent>
    </Card>
  );
}

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
        setPosts((postsJson.posts ?? []) as ProfilePost[]);
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
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              is_following: Boolean(json.is_following),
              followers_count: prev.followers_count + (json.is_following ? 1 : -1),
            }
          : prev
      );
      if (json.is_following) await load();
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
        <Button component={Link} href={backHref} startIcon={<ArrowBackIcon />} sx={{ mt: 2 }}>
          Back
        </Button>
      </MobilizeContentPanel>
    );
  }

  if (!profile) return null;

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <IconButton component={Link} href={backHref} aria-label="Back" size="small">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" fontWeight={700}>
          Member profile
        </Typography>
      </Stack>

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      ) : null}

      <MobilizeContentPanel sx={{ mb: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "flex-start" }}>
          <Avatar
            src={profile.avatar_url ? publicAssetSrc(profile.avatar_url) : undefined}
            sx={{ width: 88, height: 88, bgcolor: "#263238", fontSize: "2rem" }}
          >
            {profile.display_name.charAt(0)}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h5" fontWeight={800}>
              {profile.display_name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {profile.handle}
            </Typography>
            {profile.bio ? (
              <Typography variant="body2" sx={{ mt: 1, whiteSpace: "pre-wrap" }}>
                {profile.bio}
              </Typography>
            ) : null}
            <Stack direction="row" spacing={2} sx={{ mt: 1.5 }}>
              <Typography variant="body2">
                <strong>{profile.followers_count}</strong> Followers
              </Typography>
              <Typography variant="body2">
                <strong>{profile.following_count}</strong> Following
              </Typography>
            </Stack>
            {profile.city || profile.state ? (
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.75 }}>
                {[profile.city, profile.state].filter(Boolean).join(", ")}
              </Typography>
            ) : null}
          </Box>
          <Box>
            {profile.is_own_profile ? (
              <Typography variant="caption" color="text.secondary">
                Your profile
              </Typography>
            ) : (
              <Button
                variant={profile.is_following ? "outlined" : "contained"}
                onClick={() => void toggleFollow()}
                disabled={followBusy}
              >
                {followBusy ? "…" : profile.is_following ? "Unfollow" : "Follow"}
              </Button>
            )}
          </Box>
        </Stack>

        {profile.is_own_profile ? (
          <Box sx={{ mt: 3, pt: 2, borderTop: "1px solid rgba(0,0,0,0.08)" }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
              Profile settings
            </Typography>
            <TextField
              fullWidth
              multiline
              minRows={2}
              label="Bio"
              value={bioDraft}
              onChange={(e) => setBioDraft(e.target.value)}
              sx={{ mb: 1.5 }}
            />
            <FormControl>
              <RadioGroup
                row
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
            <Button
              variant="outlined"
              size="small"
              sx={{ mt: 1 }}
              disabled={savingSettings}
              onClick={() => void saveSettings()}
            >
              {savingSettings ? "Saving…" : "Save settings"}
            </Button>
          </Box>
        ) : null}
      </MobilizeContentPanel>

      <MobilizeContentPanel>
        {profile.is_private_locked ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            This profile is private. Follow to see posts and full details.
          </Alert>
        ) : null}
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
          {profile.is_own_profile ? "Your posts" : "Posts"}
        </Typography>

        {profile.is_own_profile && !profile.is_private_locked ? (
          <Box sx={{ mb: 2 }}>
            <GatheringDescriptionEditor
              value={composerHtml}
              onChange={setComposerHtml}
              label="Share an update"
              showHelper={false}
              compact
              disabled={posting}
            />
            <Button
              variant="contained"
              sx={{ mt: 1 }}
              disabled={posting || !composerHtml.replace(/<[^>]+>/g, "").trim()}
              onClick={() => void publishPost()}
            >
              {posting ? "Posting…" : "Post"}
            </Button>
          </Box>
        ) : null}

        {!profile.is_private_locked
          ? posts.map((post) => (
              <ProfilePostCard
                key={post.id}
                profileUserId={userId}
                post={post}
                canComment
              />
            ))
          : null}

        {!profile.is_private_locked && !posts.length ? (
          <Typography color="text.secondary">
            {profile.is_own_profile ? "You have not posted yet." : "No posts yet."}
          </Typography>
        ) : null}
      </MobilizeContentPanel>
    </Box>
  );
}
