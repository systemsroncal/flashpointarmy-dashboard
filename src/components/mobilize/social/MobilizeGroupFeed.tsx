"use client";

import { MobilizeSocialPostEditor } from "@/components/mobilize/social/MobilizeSocialPostEditor";
import { MobilizeSocialFeedShell } from "@/components/mobilize/social/MobilizeSocialFeedShell";
import { MobilizeSocialPostCard } from "@/components/mobilize/social/MobilizeSocialPostCard";
import { MobilizeSectionEmptyState } from "@/components/mobilize/MobilizeSectionEmptyState";
import type { EnrichedGroupMessage } from "@/lib/mobilize/social/enrich-group-messages";
import type { UnifiedFeedPost } from "@/lib/mobilize/social/feed-types";
import { feedPostCommentConfig, feedPostReactionUrl } from "@/lib/mobilize/social/feed-post-urls";
import { MOBILIZE_EMPTY_STATE_IMAGES } from "@/lib/mobilize/mobilize-empty-state-icons";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import {
  Box,
  Button,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from "@mui/material";
import { useDashboardUser } from "@/contexts/DashboardUserContext";
import { useCallback } from "react";

type Props = {
  groupId: string;
  messages: EnrichedGroupMessage[];
  canPost: boolean;
  canCommentOnPost: (post: EnrichedGroupMessage) => boolean;
  isLeader: boolean;
  isSuperAdmin: boolean;
  canManageMessage: (post: EnrichedGroupMessage) => boolean;
  posting: boolean;
  wallHtml: string;
  onWallHtmlChange: (html: string) => void;
  wallImages: string[];
  onWallImagesChange: (urls: string[]) => void;
  leaderCommentsPolicy: "everyone" | "leaders_only";
  onLeaderCommentsPolicyChange: (v: "everyone" | "leaders_only") => void;
  onPost: () => Promise<void>;
  onEdit?: (post: EnrichedGroupMessage) => void;
  onDelete?: (post: EnrichedGroupMessage) => void;
  /** When true, wraps feed in Truth-style shell only (no extra left rail). */
  embedded?: boolean;
};

function toUnifiedPost(m: EnrichedGroupMessage, groupId: string, groupName?: string): UnifiedFeedPost {
  return {
    id: `gm-${m.id}`,
    kind: "group_message",
    created_at: m.created_at,
    author: m.author,
    content: m.content,
    content_html: m.content_html,
    image_urls: m.image_urls,
    reactions: m.reactions,
    comment_count: m.comment_count,
    comments_policy: m.comments_policy,
    group_id: groupId,
    message_id: m.id,
    group: groupName ? { id: groupId, name: groupName } : undefined,
  };
}

export function MobilizeGroupFeed({
  groupId,
  messages,
  canPost,
  canCommentOnPost,
  isLeader,
  isSuperAdmin,
  canManageMessage,
  posting,
  wallHtml,
  onWallHtmlChange,
  wallImages,
  onWallImagesChange,
  leaderCommentsPolicy,
  onLeaderCommentsPolicyChange,
  onPost,
  onEdit,
  onDelete,
  embedded = false,
}: Props) {
  const me = useDashboardUser();
  const hasComposerContent = useCallback(() => {
    const plain = wallHtml.replace(/<[^>]+>/g, "").trim();
    return Boolean(plain || wallImages.length);
  }, [wallHtml, wallImages.length]);

  const feedBody = (
    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      {canPost ? (
        <MobilizeSocialPostEditor
          value={wallHtml}
          onChange={onWallHtmlChange}
          disabled={posting}
          surface="light"
          avatarUrl={me.avatar_url}
          avatarFallback={me.display_name ?? me.email ?? "?"}
          imageUrls={wallImages}
          onImageUrlsChange={onWallImagesChange}
          groupId={groupId}
          postLabel="Post"
          onPost={() => void onPost()}
          posting={posting}
          canPost={hasComposerContent()}
        >
          {isLeader || isSuperAdmin ? (
            <FormControl component="fieldset" sx={{ mt: 1 }} variant="standard">
              <Typography variant="caption" sx={{ mb: 0.5, display: "block", color: "rgba(0,0,0,0.65)" }}>
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
        </MobilizeSocialPostEditor>
      ) : (
        <Typography sx={{ mb: 2, px: 2, color: "rgba(0,0,0,0.65)" }}>
          Only leaders can post on this group feed.
        </Typography>
      )}

      {messages.map((m) => {
        const unified = toUnifiedPost(m, groupId);
        const canManage = canManageMessage(m);
        return (
          <MobilizeSocialPostCard
            key={m.id}
            post={{ ...unified, group: undefined }}
            canComment={canCommentOnPost(m)}
            commentConfig={feedPostCommentConfig(unified)}
            reactionUrl={feedPostReactionUrl(unified)}
            showGroupBadge={false}
            manageActions={
              canManage ? (
                <Stack direction="row" spacing={0.5}>
                  {onEdit ? (
                    <Button size="small" startIcon={<EditIcon />} onClick={() => onEdit(m)}>
                      Edit
                    </Button>
                  ) : null}
                  {onDelete ? (
                    <Button
                      size="small"
                      color="error"
                      startIcon={<DeleteOutlineIcon />}
                      onClick={() => onDelete(m)}
                    >
                      Delete
                    </Button>
                  ) : null}
                </Stack>
              ) : undefined
            }
          />
        );
      })}

      {!messages.length ? (
        <MobilizeSectionEmptyState
          fill
          imageSrc={MOBILIZE_EMPTY_STATE_IMAGES.announcements}
          title="No posts yet"
          description="When leaders or members post to the feed, updates will appear here."
        />
      ) : null}
    </Box>
  );

  if (embedded) return feedBody;
  return <MobilizeSocialFeedShell>{feedBody}</MobilizeSocialFeedShell>;
}
