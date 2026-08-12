"use client";

import { MobilizeSocialPostEditor } from "@/components/mobilize/social/MobilizeSocialPostEditor";
import { MobilizeSocialFeedShell } from "@/components/mobilize/social/MobilizeSocialFeedShell";
import { MobilizeSocialPostCard } from "@/components/mobilize/social/MobilizeSocialPostCard";
import { MobilizeSectionEmptyState } from "@/components/mobilize/MobilizeSectionEmptyState";
import type { EnrichedGroupMessage } from "@/lib/mobilize/social/enrich-group-messages";
import type { UnifiedFeedPost } from "@/lib/mobilize/social/feed-types";
import { feedPostCommentConfig, feedPostReactionUrl } from "@/lib/mobilize/social/feed-post-urls";
import { MOBILIZE_EMPTY_STATE_IMAGES } from "@/lib/mobilize/mobilize-empty-state-icons";
import {
  mobilizeGroupFeedCardSx,
  mobilizeGroupFeedPaperSx,
  mobilizeGroupFeedPostsListSx,
  mobilizeGroupFeedPostsStackSx,
} from "@/lib/mobilize/mobilize-ui-surface";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import PushPinIcon from "@mui/icons-material/PushPin";
import {
  Box,
  IconButton,
  Paper,
  Stack,
  Tooltip,
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
  onPin?: (post: EnrichedGroupMessage, pin: boolean) => void;
  canPinPost?: boolean;
  /** When true, wraps feed in Truth-style shell only (no extra left rail). */
  embedded?: boolean;
  authorRoleLabels?: Record<string, string>;
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
  onPin,
  canPinPost = false,
  embedded = false,
  authorRoleLabels,
}: Props) {
  const me = useDashboardUser();
  const hasComposerContent = useCallback(() => {
    const plain = wallHtml.replace(/<[^>]+>/g, "").trim();
    return Boolean(plain || wallImages.length);
  }, [wallHtml, wallImages.length]);

  const embeddedPaperSx = { ...mobilizeGroupFeedPaperSx, overflow: "hidden" as const };
  const standalonePaperSx = { ...mobilizeGroupFeedCardSx, overflow: "hidden" as const };

  const feedBody = (
    <Box
      sx={
        embedded
          ? mobilizeGroupFeedPostsStackSx
          : { flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }
      }
    >
      {canPost ? (
        <Paper
          elevation={0}
          sx={{
            ...(embedded ? embeddedPaperSx : standalonePaperSx),
            flexShrink: 0,
            border: "1px solid rgba(0,0,0,0.08)",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          }}
        >
          <MobilizeSocialPostEditor
            value={wallHtml}
            onChange={onWallHtmlChange}
            disabled={posting}
            surface="light"
            brandAccent={embedded}
            showVisibility={!embedded}
            commentsPolicy={isLeader || isSuperAdmin ? leaderCommentsPolicy : undefined}
            onCommentsPolicyChange={
              isLeader || isSuperAdmin ? onLeaderCommentsPolicyChange : undefined
            }
            avatarUrl={me.avatar_url}
            avatarFallback={me.display_name ?? me.email ?? "?"}
            imageUrls={wallImages}
            onImageUrlsChange={onWallImagesChange}
            groupId={groupId}
            postLabel="Post"
            onPost={() => void onPost()}
            posting={posting}
            canPost={hasComposerContent()}
          />
        </Paper>
      ) : (
        <Paper elevation={0} sx={{ ...(embedded ? embeddedPaperSx : standalonePaperSx), p: 2, flexShrink: 0 }}>
          <Typography sx={{ color: "rgba(0,0,0,0.65)" }}>
            Only leaders can post on this group feed.
          </Typography>
        </Paper>
      )}

      {messages.length ? (
        <Paper
          elevation={0}
          sx={embedded ? mobilizeGroupFeedPostsListSx : standalonePaperSx}
        >
          {messages.map((m) => {
            const unified = toUnifiedPost(m, groupId);
            const canManage = canManageMessage(m);
            const isPinned = Boolean(m.pinned_at);
            return (
              <MobilizeSocialPostCard
                key={m.id}
                post={{ ...unified, group: undefined }}
                canComment={canCommentOnPost(m)}
                commentConfig={feedPostCommentConfig(unified)}
                reactionUrl={feedPostReactionUrl(unified)}
                showGroupBadge={false}
                layout={embedded ? "groupFeedCard" : "card"}
                authorRoleLabel={authorRoleLabels?.[m.author.id]}
                viewerAvatarUrl={me.avatar_url}
                viewerDisplayName={me.display_name ?? me.email}
                viewerUserId={me.id}
                viewerIsSuperAdmin={isSuperAdmin}
                manageActions={
                  canManage || canPinPost ? (
                    <Stack direction="row" spacing={0.25}>
                      {canPinPost && onPin ? (
                        <Tooltip title={isPinned ? "Unpin post" : "Pin post"}>
                          <IconButton
                            size="small"
                            color={isPinned ? "primary" : "default"}
                            onClick={() => onPin(m, !isPinned)}
                            aria-label={isPinned ? "Unpin post" : "Pin post"}
                          >
                            <PushPinIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ) : null}
                      {onEdit ? (
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => onEdit(m)} aria-label="Edit post">
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ) : null}
                      {onDelete ? (
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => onDelete(m)}
                            aria-label="Delete post"
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ) : null}
                    </Stack>
                  ) : undefined
                }
              />
            );
          })}
        </Paper>
      ) : (
        <Paper
          elevation={0}
          sx={
            embedded
              ? mobilizeGroupFeedPostsListSx
              : { ...mobilizeGroupFeedCardSx, overflow: "hidden" }
          }
        >
          <MobilizeSectionEmptyState
            fill
            layout="stacked"
            imageSrc={MOBILIZE_EMPTY_STATE_IMAGES.announcements}
            title="No posts yet"
            description="When leaders or members post to the feed, updates will appear here."
          />
        </Paper>
      )}
    </Box>
  );

  if (embedded) return feedBody;
  return <MobilizeSocialFeedShell>{feedBody}</MobilizeSocialFeedShell>;
}
