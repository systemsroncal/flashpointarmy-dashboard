"use client";

import { GatheringDescriptionEditor } from "@/components/dashboard/gatherings/GatheringDescriptionEditor";
import MobilizeAnnouncementImagePicker from "@/components/mobilize/MobilizeAnnouncementImagePicker";
import { MobilizeFeedHtml } from "@/components/mobilize/social/MobilizeFeedHtml";
import { MobilizeSocialComments } from "@/components/mobilize/social/MobilizeSocialComments";
import { MobilizeSocialPostHeader } from "@/components/mobilize/social/MobilizeSocialPostHeader";
import { MobilizeSocialReactionBar } from "@/components/mobilize/social/MobilizeSocialReactionBar";
import { MobilizeSectionEmptyState } from "@/components/mobilize/MobilizeSectionEmptyState";
import type { EnrichedGroupMessage } from "@/lib/mobilize/social/enrich-group-messages";
import type { ReactionType } from "@/lib/mobilize/social/reaction-summary";
import { MOBILIZE_EMPTY_STATE_IMAGES } from "@/lib/mobilize/mobilize-empty-state-icons";
import { mobilizeCardSx } from "@/lib/mobilize/mobilize-ui-surface";
import { MobilizeAnnouncementMediaGrid } from "@/components/mobilize/MobilizeAnnouncementMediaGrid";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from "@mui/material";
import { useCallback, useState } from "react";

type Props = {
  groupId: string;
  messages: EnrichedGroupMessage[];
  canPost: boolean;
  canCommentOnPost: (post: EnrichedGroupMessage) => boolean;
  isLeader: boolean;
  isSuperAdmin: boolean;
  canManageMessage: (post: EnrichedGroupMessage) => boolean;
  onRefresh: () => Promise<void>;
  onEdit?: (post: EnrichedGroupMessage) => void;
  onDelete?: (post: EnrichedGroupMessage) => void;
  posting: boolean;
  wallHtml: string;
  onWallHtmlChange: (html: string) => void;
  wallImages: string[];
  onWallImagesChange: (urls: string[]) => void;
  leaderCommentsPolicy: "everyone" | "leaders_only";
  onLeaderCommentsPolicyChange: (v: "everyone" | "leaders_only") => void;
  onPost: () => Promise<void>;
};

function GroupFeedPostCard({
  groupId,
  post,
  canComment,
  isLeader,
  isSuperAdmin,
  canManage,
  onEdit,
  onDelete,
}: {
  groupId: string;
  post: EnrichedGroupMessage;
  canComment: boolean;
  isLeader: boolean;
  isSuperAdmin: boolean;
  canManage: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const [reactions, setReactions] = useState(post.reactions);
  const [commentCount, setCommentCount] = useState(post.comment_count);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [reacting, setReacting] = useState(false);

  async function setReaction(next: ReactionType | null) {
    setReacting(true);
    try {
      const res = await fetch(`/api/mobilize/groups/${groupId}/messages/${post.id}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reaction_type: next }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Reaction failed.");
      setReactions(json.reactions);
    } finally {
      setReacting(false);
    }
  }

  const pol = post.comments_policy === "leaders_only" ? "Leaders only" : "Everyone";

  return (
    <Card variant="outlined" sx={{ mb: 1.5, ...mobilizeCardSx, borderRadius: 2 }}>
      <CardContent sx={{ p: { xs: 1.5, sm: 2 }, "&:last-child": { pb: { xs: 1.5, sm: 2 } } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <MobilizeSocialPostHeader author={post.author} createdAt={post.created_at} />
            {isLeader || isSuperAdmin ? (
              <Chip size="small" label={`Comments: ${pol}`} sx={{ mt: 1 }} variant="outlined" />
            ) : null}
            <Box sx={{ mt: 1 }}>
              <MobilizeFeedHtml html={post.content_html} plain={post.content} />
            </Box>
            <MobilizeAnnouncementMediaGrid urls={post.image_urls ?? []} />
            <MobilizeSocialReactionBar
              reactions={reactions}
              commentCount={commentCount}
              onToggleLike={() => void setReaction(reactions.viewer_reaction === "like" ? null : "like")}
              onToggleLove={() => void setReaction(reactions.viewer_reaction === "love" ? null : "love")}
              onToggleComments={() => setCommentsOpen((v) => !v)}
              commentsOpen={commentsOpen}
              disabled={reacting}
            />
            <MobilizeSocialComments
              open={commentsOpen}
              canComment={canComment}
              commentsUrl={`/api/mobilize/groups/${groupId}/messages/${post.id}/comments`}
              commentReactionUrl={(commentId) =>
                `/api/mobilize/groups/${groupId}/messages/${post.id}/comments/${commentId}/reactions`
              }
              onCountChange={setCommentCount}
            />
          </Box>
          {canManage ? (
            <Stack direction="row" spacing={0.5} flexShrink={0}>
              <Button size="small" startIcon={<EditIcon />} onClick={onEdit}>
                Edit
              </Button>
              <Button size="small" color="error" startIcon={<DeleteOutlineIcon />} onClick={onDelete}>
                Delete
              </Button>
            </Stack>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
}

export function MobilizeGroupFeed({
  groupId,
  messages,
  canPost,
  canCommentOnPost,
  isLeader,
  isSuperAdmin,
  canManageMessage,
  onRefresh,
  onEdit,
  onDelete,
  posting,
  wallHtml,
  onWallHtmlChange,
  wallImages,
  onWallImagesChange,
  leaderCommentsPolicy,
  onLeaderCommentsPolicyChange,
  onPost,
}: Props) {
  const hasComposerContent = useCallback(() => {
    const plain = wallHtml.replace(/<[^>]+>/g, "").trim();
    return Boolean(plain || wallImages.length);
  }, [wallHtml, wallImages.length]);

  return (
    <Box>
      {canPost ? (
        <Box
          sx={{
            mb: 2,
            p: 2,
            borderRadius: 2,
            border: "1px solid rgba(0,0,0,0.1)",
            bgcolor: "#fff",
          }}
        >
          <GatheringDescriptionEditor
            value={wallHtml}
            onChange={onWallHtmlChange}
            disabled={posting}
            label="What's happening?"
            showHelper={false}
            compact
          />
          <MobilizeAnnouncementImagePicker
            groupId={groupId}
            value={wallImages}
            onChange={onWallImagesChange}
            disabled={posting}
          />
          {isLeader || isSuperAdmin ? (
            <FormControl component="fieldset" sx={{ mt: 1.5 }} variant="standard">
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                Who can comment on this post
              </Typography>
              <RadioGroup
                row
                value={leaderCommentsPolicy}
                onChange={(_, v) => onLeaderCommentsPolicyChange(v as "everyone" | "leaders_only")}
              >
                <FormControlLabel value="everyone" control={<Radio size="small" />} label="Everyone" />
                <FormControlLabel value="leaders_only" control={<Radio size="small" />} label="Leaders only" />
              </RadioGroup>
            </FormControl>
          ) : null}
          <Button
            sx={{ mt: 1 }}
            variant="contained"
            onClick={() => void onPost()}
            disabled={posting || !hasComposerContent()}
          >
            {posting ? "Posting…" : "Post"}
          </Button>
        </Box>
      ) : (
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Only leaders can post announcements.
        </Typography>
      )}

      {messages.map((m) => (
        <GroupFeedPostCard
          key={m.id}
          groupId={groupId}
          post={m}
          canComment={canCommentOnPost(m)}
          isLeader={isLeader}
          isSuperAdmin={isSuperAdmin}
          canManage={canManageMessage(m)}
          onEdit={onEdit ? () => onEdit(m) : undefined}
          onDelete={onDelete ? () => onDelete(m) : undefined}
        />
      ))}

      {!messages.length ? (
        <MobilizeSectionEmptyState
          imageSrc={MOBILIZE_EMPTY_STATE_IMAGES.announcements}
          message="There are no feed posts in this chapter yet."
        />
      ) : null}
    </Box>
  );
}
