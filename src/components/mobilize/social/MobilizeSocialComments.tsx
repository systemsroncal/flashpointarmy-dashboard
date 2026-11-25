"use client";

import type { MobilizeSocialAuthor } from "@/components/mobilize/social/MobilizeSocialPostHeader";
import { VerifiedUserBadge } from "@/components/user/VerifiedUserBadge";
import { applyReactionToggle, type ReactionType } from "@/lib/mobilize/social/reaction-summary";
import { TRUTH_HUB_BORDER, TRUTH_HUB_TEXT_MUTED } from "@/lib/mobilize/social/social-hub-surface";
import { publicAssetSrc } from "@/lib/media/public-asset-url";
import { mobilizeMemberProfileHref } from "@/lib/mobilize/social/profile-href";
import {
  CLAMP_ACCORDION_TRANSITION,
  useClampAccordion,
} from "@/lib/mobilize/social/use-clamp-accordion";
import { mobilizePanelTheme } from "@/theme/mobilize-content-theme";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ThumbUpAltIcon from "@mui/icons-material/ThumbUpAlt";
import ThumbUpOffAltIcon from "@mui/icons-material/ThumbUpOffAlt";
import ThumbDownOffAltIcon from "@mui/icons-material/ThumbDownOffAlt";
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Link as MuiLink,
  Popover,
  Stack,
  TextField,
  ThemeProvider,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import EmojiEmotionsOutlinedIcon from "@mui/icons-material/EmojiEmotionsOutlined";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";

const INITIAL_VISIBLE_TOP_COMMENTS = 1;
const LOAD_MORE_TOP_COMMENTS = 5;
const INITIAL_VISIBLE_REPLIES = 2;
const LOAD_MORE_REPLIES = 5;

function commentThreadToggleSx(light: boolean) {
  return {
    mt: 0.75,
    ml: 5.5,
    px: 0,
    minWidth: 0,
    textTransform: "none",
    fontWeight: 700,
    fontSize: "0.8125rem",
    color: light ? "#525252" : "#b0b3b8",
    textDecoration: "underline",
    "&:hover": {
      bgcolor: "transparent",
      textDecoration: "underline",
      color: light ? "#3a3a3a" : "#d0d2d6",
    },
  } as const;
}

function replyToggleSx(light: boolean, depth: number) {
  return {
    ...commentThreadToggleSx(light),
    mt: 0.35,
    ml: depth > 0 ? 4.5 : 5.5,
  };
}

const COMMENT_CLAMP_LINES = 3;
const COMMENT_EMOJI_OPTIONS = [
  "😀",
  "😂",
  "❤️",
  "👍",
  "🙏",
  "🔥",
  "🇺🇸",
  "✝️",
  "🙌",
  "💪",
  "🎉",
  "👏",
] as const;

export type SocialCommentNode = {
  id: string;
  author_id: string;
  parent_id: string | null;
  depth: number;
  content: string;
  created_at: string;
  author: MobilizeSocialAuthor;
  reactions: {
    like: number;
    love: number;
    total: number;
    viewer_reaction: ReactionType | null;
  };
  replies: SocialCommentNode[];
};

type Props = {
  commentsUrl: string;
  commentReactionUrl: (commentId: string) => string;
  canComment: boolean;
  open: boolean;
  onCountChange?: (count: number) => void;
  tone?: "light" | "dark";
  viewerAvatarUrl?: string | null;
  viewerDisplayName?: string | null;
  /** Viewer id — enables comment deletion for comment authors / super admins. */
  viewerUserId?: string;
  /** Viewer is a super admin — may delete any comment. */
  viewerIsSuperAdmin?: boolean;
};

function countComments(nodes: SocialCommentNode[]): number {
  return nodes.reduce((sum, n) => sum + 1 + countComments(n.replies), 0);
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  if (d < 30) return `${Math.floor(d / 7)}w`;
  return new Date(iso).toLocaleDateString();
}

function CommentComposer({
  viewerAvatarUrl,
  avatarFallback = "?",
  draft,
  onDraftChange,
  posting,
  onSubmit,
  light,
  placeholder,
  header,
  inputRef,
  compact,
}: {
  viewerAvatarUrl?: string | null;
  avatarFallback?: string;
  draft: string;
  onDraftChange: (value: string) => void;
  posting: boolean;
  onSubmit: () => void;
  light: boolean;
  placeholder: string;
  header?: ReactNode;
  inputRef?: RefObject<HTMLInputElement | null>;
  compact?: boolean;
}) {
  const theme = useTheme();
  const isMobileFeed = useMediaQuery(theme.breakpoints.down("md"));
  const composerBg = light ? "#f0f2f5" : "rgba(255,255,255,0.06)";
  const nameMuted = light ? "#65676b" : TRUTH_HUB_TEXT_MUTED;
  const avatarSize = compact || isMobileFeed ? 32 : 36;
  const fieldRadius = isMobileFeed ? "10px" : "999px";
  const hasDraft = Boolean(draft.trim());
  const [emojiAnchor, setEmojiAnchor] = useState<HTMLElement | null>(null);
  const localInputRef = useRef<HTMLInputElement | null>(null);
  const fieldRef = inputRef ?? localInputRef;

  function insertEmoji(emoji: string) {
    const el = fieldRef.current;
    if (el && typeof el.selectionStart === "number") {
      const start = el.selectionStart;
      const end = el.selectionEnd ?? start;
      const next = `${draft.slice(0, start)}${emoji}${draft.slice(end)}`;
      onDraftChange(next);
      window.requestAnimationFrame(() => {
        const pos = start + emoji.length;
        el.focus();
        el.setSelectionRange(pos, pos);
      });
    } else {
      onDraftChange(`${draft}${emoji}`);
    }
    setEmojiAnchor(null);
  }

  return (
    <Box sx={{ mt: compact ? 0.75 : { xs: 0.5, sm: 1.5 }, overflow: "visible" }}>
      {header}
      <Box
        sx={{
          display: "flex",
          gap: { xs: 0.75, sm: 1 },
          alignItems: isMobileFeed ? "center" : "flex-start",
          overflow: "visible",
        }}
      >
        <Avatar
          src={viewerAvatarUrl ? publicAssetSrc(viewerAvatarUrl) : undefined}
          sx={{
            width: avatarSize,
            height: avatarSize,
            mt: isMobileFeed ? 0 : 0.25,
            bgcolor: "#263238",
            flexShrink: 0,
          }}
        >
          {avatarFallback[0]?.toUpperCase()}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0, overflow: "visible" }}>
          <TextField
            inputRef={fieldRef}
            fullWidth
            size="small"
            multiline
            maxRows={4}
            minRows={1}
            placeholder={placeholder}
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            disabled={posting}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSubmit();
              }
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end" sx={{ mr: 0.25, alignSelf: "center" }}>
                  <IconButton
                    size="small"
                    disabled={posting}
                    aria-label="Add emoji"
                    onClick={(e) => setEmojiAnchor(e.currentTarget)}
                    sx={{ color: nameMuted }}
                  >
                    <EmojiEmotionsOutlinedIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                bgcolor: composerBg,
                borderRadius: fieldRadius,
                fontSize: isMobileFeed ? "0.875rem" : "0.9375rem",
                overflow: "hidden",
                alignItems: "center",
                pr: 0.5,
                minHeight: isMobileFeed ? 36 : undefined,
                "& fieldset": {
                  border: "1px solid transparent",
                  borderRadius: fieldRadius,
                },
                "&:hover fieldset": {
                  borderColor: "transparent",
                },
                "&.Mui-focused": {
                  bgcolor: composerBg,
                  boxShadow: "none",
                },
                "&.Mui-focused fieldset": {
                  borderColor: light ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.16)",
                  borderWidth: "1px",
                },
                "& .MuiInputBase-input": {
                  px: { xs: 1.25, sm: 1.75 },
                  py: { xs: 0.55, sm: 1.1 },
                  lineHeight: 1.35,
                },
              },
            }}
          />
          {hasDraft || posting ? (
            <Stack direction="row" justifyContent="flex-end" sx={{ mt: 0.65, px: 0.75 }}>
              <Button
                size="small"
                variant="contained"
                disabled={posting || !hasDraft}
                onClick={onSubmit}
                sx={{
                  textTransform: "none",
                  fontWeight: 700,
                  borderRadius: 5,
                  bgcolor: light ? "#0866ff" : undefined,
                  boxShadow: "none",
                  "&:hover": { boxShadow: "none", bgcolor: light ? "#0654d0" : undefined },
                }}
              >
                {posting ? "…" : "Post"}
              </Button>
            </Stack>
          ) : null}
        </Box>
      </Box>

      <Popover
        open={Boolean(emojiAnchor)}
        anchorEl={emojiAnchor}
        onClose={() => setEmojiAnchor(null)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        transformOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Box sx={{ p: 1, display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 0.25 }}>
          {COMMENT_EMOJI_OPTIONS.map((emoji) => (
            <IconButton
              key={emoji}
              size="small"
              onClick={() => insertEmoji(emoji)}
              aria-label={`Insert ${emoji}`}
              className="fp-emoji-text"
              sx={{ fontSize: "1.15rem" }}
            >
              {emoji}
            </IconButton>
          ))}
        </Box>
      </Popover>
    </Box>
  );
}

function CommentContent({ content, light }: { content: string; light: boolean }) {
  const accordion = useClampAccordion(COMMENT_CLAMP_LINES);

  const clampSx = {
    display: "-webkit-box",
    WebkitLineClamp: COMMENT_CLAMP_LINES,
    WebkitBoxOrient: "vertical",
  } as const;

  return (
    <>
      <Box
        ref={accordion.ref}
        onTransitionEnd={accordion.onTransitionEnd}
        sx={{
          overflow: "hidden",
          maxHeight: accordion.maxHeight ?? "none",
          transition:
            accordion.ready && accordion.needsCollapse ? CLAMP_ACCORDION_TRANSITION : "none",
          ...(accordion.showClamp ? clampSx : {}),
        }}
      >
        <Typography
          sx={{
            fontSize: "0.9375rem",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            mt: 0.15,
            lineHeight: 1.35,
            color: light ? "#050505" : "#e7e9ea",
          }}
        >
          {content}
        </Typography>
      </Box>
      {accordion.needsCollapse ? (
        <Button
          size="small"
          onClick={accordion.toggle}
          sx={{
            minWidth: 0,
            px: 0,
            mt: 0.25,
            textTransform: "none",
            fontWeight: 700,
            fontSize: "0.75rem",
            color: light ? "#0866ff" : "#6eb5ff",
            "&:hover": { bgcolor: "transparent", textDecoration: "underline" },
          }}
        >
          {accordion.expanded ? "See less" : "See more"}
        </Button>
      ) : null}
    </>
  );
}

function CommentItem({
  node,
  commentReactionUrl,
  canComment,
  onReply,
  replyParentId,
  replyComposer,
  depth,
  light,
  viewerUserId,
  viewerIsSuperAdmin,
  deleting,
  onDelete,
}: {
  node: SocialCommentNode;
  commentReactionUrl: (commentId: string) => string;
  canComment: boolean;
  onReply: (parentId: string, authorName: string) => void;
  replyParentId: string | null;
  replyComposer: ReactNode;
  depth: number;
  light: boolean;
  viewerUserId?: string;
  viewerIsSuperAdmin: boolean;
  deleting: boolean;
  onDelete: (commentId: string) => void;
}) {
  const [reactions, setReactions] = useState(node.reactions);
  const [busy, setBusy] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const profileHref = mobilizeMemberProfileHref(node.author.id);

  async function setReaction(next: ReactionType | null) {
    const previous = reactions;
    setReactions(applyReactionToggle(previous, next));
    try {
      const res = await fetch(commentReactionUrl(node.id), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reaction_type: next }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Reaction failed.");
      setReactions(json.reactions);
    } catch {
      setReactions(previous);
    }
  }

  const canDelete = Boolean(viewerUserId && (viewerUserId === node.author_id || viewerIsSuperAdmin));
  const [visibleReplyCount, setVisibleReplyCount] = useState(INITIAL_VISIBLE_REPLIES);
  const replies = node.replies ?? [];
  const shownReplies = replies.slice(0, visibleReplyCount);
  const hiddenReplyCount = replies.length - shownReplies.length;

  useEffect(() => {
    setVisibleReplyCount(INITIAL_VISIBLE_REPLIES);
  }, [node.id, replies.length]);

  const liked = reactions.viewer_reaction === "like";
  const bubbleBg = light ? "#f0f2f5" : "rgba(255,255,255,0.08)";
  const nameMuted = light ? "#65676b" : "rgba(255,255,255,0.45)";
  const actionMuted = light ? "#65676b" : "rgba(255,255,255,0.55)";
  const likeBlue = "#0866ff";
  const avatarSize = depth > 0 ? 28 : 36;

  return (
    <Box sx={{ mt: depth > 0 ? 1 : 1.25, ml: depth > 0 ? 1 : 0 }}>
      <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
        <MuiLink component={Link} href={profileHref} underline="none" sx={{ flexShrink: 0, mt: 0.25 }}>
          <Avatar
            src={node.author.avatar_url ? publicAssetSrc(node.author.avatar_url) : undefined}
            sx={{ width: avatarSize, height: avatarSize, bgcolor: "#263238" }}
          >
            {node.author.display_name?.[0]}
          </Avatar>
        </MuiLink>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box
            sx={{
              bgcolor: bubbleBg,
              borderRadius: "18px",
              px: 1.5,
              py: 0.85,
              display: "inline-block",
              maxWidth: "100%",
            }}
          >
            <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
              <MuiLink
                component={Link}
                href={profileHref}
                underline="hover"
                sx={{
                  fontWeight: 700,
                  fontSize: depth > 0 ? "0.75rem" : "0.8125rem",
                  lineHeight: 1.3,
                  color: light ? "#050505" : "#e7e9ea",
                }}
              >
                {node.author.display_name}
              </MuiLink>
              {node.author.verified ? (
                <VerifiedUserBadge
                  size={depth > 0 ? 14 : 16}
                  verifiedAt={node.author.verified_at}
                />
              ) : null}
              <Typography component="span" sx={{ fontSize: depth > 0 ? "0.7rem" : "0.75rem", color: nameMuted }}>
                {timeAgo(node.created_at)}
              </Typography>
            </Stack>
            <CommentContent content={node.content} light={light} />
          </Box>
          <Stack direction="row" spacing={0.25} alignItems="center" sx={{ mt: 0.35, ml: 0.5 }}>
            {confirmingDelete ? (
              <>
                <Typography variant="caption" sx={{ color: actionMuted, mr: 0.25 }}>
                  Delete this comment?
                </Typography>
                <Button
                  size="small"
                  disabled={deleting}
                  onClick={() => onDelete(node.id)}
                  sx={{
                    minWidth: 0,
                    px: 0.75,
                    py: 0,
                    textTransform: "none",
                    fontWeight: 700,
                    fontSize: "0.75rem",
                    color: "#d32f2f",
                    "&:hover": { bgcolor: "transparent", textDecoration: "underline" },
                  }}
                >
                  {deleting ? "…" : "Yes"}
                </Button>
                <Button
                  size="small"
                  disabled={deleting}
                  onClick={() => setConfirmingDelete(false)}
                  sx={{
                    minWidth: 0,
                    px: 0.75,
                    py: 0,
                    textTransform: "none",
                    fontWeight: 700,
                    fontSize: "0.75rem",
                    color: actionMuted,
                    "&:hover": { bgcolor: "transparent", textDecoration: "underline" },
                  }}
                >
                  No
                </Button>
              </>
            ) : (
              <>
                <IconButton
                  size="small"
                  disabled={busy}
                  onClick={() => void setReaction(liked ? null : "like")}
                  aria-label={liked ? "Unlike" : "Like"}
                  sx={{ p: 0.35, color: liked ? likeBlue : actionMuted }}
                >
                  {liked ? <ThumbUpAltIcon sx={{ fontSize: 16 }} /> : <ThumbUpOffAltIcon sx={{ fontSize: 16 }} />}
                </IconButton>
                {reactions.like > 0 ? (
                  <Typography variant="caption" sx={{ color: actionMuted, mr: 0.25, minWidth: 10 }}>
                    {reactions.like}
                  </Typography>
                ) : null}
                <IconButton size="small" disabled aria-label="Dislike" sx={{ p: 0.35, color: actionMuted, opacity: 0.65 }}>
                  <ThumbDownOffAltIcon sx={{ fontSize: 16 }} />
                </IconButton>
                {canComment && node.depth < 3 ? (
                  <Button
                    size="small"
                    onClick={() => onReply(node.id, node.author.display_name)}
                    sx={{
                      minWidth: 0,
                      px: 0.75,
                      py: 0,
                      textTransform: "none",
                      fontWeight: 700,
                      fontSize: "0.75rem",
                      color: replyParentId === node.id ? likeBlue : actionMuted,
                      "&:hover": { bgcolor: "transparent", textDecoration: "underline" },
                    }}
                  >
                    Reply
                  </Button>
                ) : null}
                {canDelete ? (
                  <Button
                    size="small"
                    onClick={() => setConfirmingDelete(true)}
                    startIcon={<DeleteOutlineIcon sx={{ fontSize: 14 }} />}
                    sx={{
                      minWidth: 0,
                      px: 0.75,
                      py: 0,
                      textTransform: "none",
                      fontWeight: 700,
                      fontSize: "0.75rem",
                      color: actionMuted,
                      "&:hover": { bgcolor: "transparent", color: "#d32f2f" },
                    }}
                  >
                    Delete
                  </Button>
                ) : null}
              </>
            )}
          </Stack>
          {shownReplies.map((reply) => (
            <CommentItem
              key={reply.id}
              node={reply}
              commentReactionUrl={commentReactionUrl}
              canComment={canComment}
              onReply={onReply}
              replyParentId={replyParentId}
              replyComposer={replyComposer}
              depth={depth + 1}
              light={light}
              viewerUserId={viewerUserId}
              viewerIsSuperAdmin={viewerIsSuperAdmin}
              deleting={deleting}
              onDelete={onDelete}
            />
          ))}
          {hiddenReplyCount > 0 ? (
            <Button
              size="small"
              onClick={() =>
                setVisibleReplyCount((c) => Math.min(c + LOAD_MORE_REPLIES, replies.length))
              }
              sx={replyToggleSx(light, depth + 1)}
            >
              Read more
            </Button>
          ) : null}
          {visibleReplyCount > INITIAL_VISIBLE_REPLIES && replies.length > INITIAL_VISIBLE_REPLIES ? (
            <Button
              size="small"
              onClick={() => setVisibleReplyCount(INITIAL_VISIBLE_REPLIES)}
              sx={replyToggleSx(light, depth + 1)}
            >
              Read less
            </Button>
          ) : null}
          {replyParentId === node.id ? replyComposer : null}
        </Box>
      </Box>
    </Box>
  );
}

export function MobilizeSocialComments({
  commentsUrl,
  commentReactionUrl,
  canComment,
  open,
  onCountChange,
  tone = "light",
  viewerAvatarUrl,
  viewerDisplayName,
  viewerUserId,
  viewerIsSuperAdmin = false,
}: Props) {
  const light = tone === "light";
  const isDark = tone === "dark";
  const [comments, setComments] = useState<SocialCommentNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [replyParentId, setReplyParentId] = useState<string | null>(null);
  const [replyToName, setReplyToName] = useState<string | null>(null);
  const [visibleTopCount, setVisibleTopCount] = useState(INITIAL_VISIBLE_TOP_COMMENTS);
  const replyInputRef = useRef<HTMLInputElement | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(commentsUrl);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load comments.");
      const list = (json.comments ?? []) as SocialCommentNode[];
      setComments(list);
      onCountChange?.(countComments(list));
    } catch {
      setComments([]);
      onCountChange?.(0);
    } finally {
      setLoading(false);
    }
  }, [commentsUrl, onCountChange]);

  useEffect(() => {
    if (open) {
      setVisibleTopCount(INITIAL_VISIBLE_TOP_COMMENTS);
      setReplyParentId(null);
      setReplyToName(null);
      void load();
    }
  }, [open, load]);

  useEffect(() => {
    if (!replyParentId) return;
    const id = window.requestAnimationFrame(() => {
      replyInputRef.current?.focus();
      replyInputRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    });
    return () => window.cancelAnimationFrame(id);
  }, [replyParentId]);

  async function submitComment() {
    const content = draft.trim();
    if (!content) return;
    setPosting(true);
    try {
      const res = await fetch(commentsUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, parent_id: replyParentId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Comment failed.");
      setDraft("");
      setReplyParentId(null);
      setReplyToName(null);
      await load();
      setVisibleTopCount((c) => c + LOAD_MORE_TOP_COMMENTS);
    } finally {
      setPosting(false);
    }
  }

  async function deleteComment(commentId: string) {
    setDeletingId(commentId);
    try {
      const res = await fetch(`${commentsUrl}/${commentId}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Delete failed.");
      await load();
    } finally {
      setDeletingId(null);
    }
  }

  if (!open) return null;

  const nameMuted = light ? "#65676b" : TRUTH_HUB_TEXT_MUTED;
  const avatarFallback = viewerDisplayName?.trim() || "?";

  const visibleComments = comments.slice(0, visibleTopCount);
  const hiddenTopCount = comments.length - visibleComments.length;

  const replyComposer = (
    <CommentComposer
      viewerAvatarUrl={viewerAvatarUrl}
      avatarFallback={avatarFallback}
      draft={draft}
      onDraftChange={setDraft}
      posting={posting}
      onSubmit={() => void submitComment()}
      light={light}
      compact
      inputRef={replyInputRef}
      placeholder={`Reply to ${replyToName || "comment"}`}
      header={
        <Typography variant="caption" display="block" sx={{ mb: 0.5, color: nameMuted }}>
          Replying to {replyToName || "comment"}…{" "}
          <Button
            size="small"
            sx={{ minWidth: 0, p: 0, textTransform: "none", fontWeight: 700 }}
            onClick={() => {
              setReplyParentId(null);
              setReplyToName(null);
            }}
          >
            Cancel
          </Button>
        </Typography>
      }
    />
  );

  const body = (
    <Box
      sx={{
        mt: { xs: 0.35, sm: 1.25 },
        pt: { xs: 0, sm: 1.25 },
        borderTop: {
          xs: "none",
          sm: isDark ? `1px dashed ${TRUTH_HUB_BORDER}` : "1px solid rgba(0,0,0,0.08)",
        },
        px: 0.25,
        overflow: "visible",
      }}
    >
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
          <CircularProgress size={22} sx={isDark ? { color: TRUTH_HUB_TEXT_MUTED } : undefined} />
        </Box>
      ) : null}
      {visibleComments.map((c) => (
        <CommentItem
          key={c.id}
          node={c}
          commentReactionUrl={commentReactionUrl}
          canComment={canComment}
          onReply={(id, name) => {
            setReplyParentId(id);
            setReplyToName(name);
          }}
          replyParentId={replyParentId}
          replyComposer={replyComposer}
          depth={0}
          light={light}
          viewerUserId={viewerUserId}
          viewerIsSuperAdmin={viewerIsSuperAdmin}
          deleting={deletingId === c.id}
          onDelete={(id) => void deleteComment(id)}
        />
      ))}
      {!loading && hiddenTopCount > 0 ? (
        <Button
          size="small"
          onClick={() =>
            setVisibleTopCount((c) => Math.min(c + LOAD_MORE_TOP_COMMENTS, comments.length))
          }
          sx={commentThreadToggleSx(light)}
        >
          Read more
        </Button>
      ) : null}
      {!loading && visibleTopCount > INITIAL_VISIBLE_TOP_COMMENTS && comments.length > INITIAL_VISIBLE_TOP_COMMENTS ? (
        <Button
          size="small"
          onClick={() => setVisibleTopCount(INITIAL_VISIBLE_TOP_COMMENTS)}
          sx={commentThreadToggleSx(light)}
        >
          Read less
        </Button>
      ) : null}
      {canComment && !replyParentId ? (
        <CommentComposer
          viewerAvatarUrl={viewerAvatarUrl}
          avatarFallback={avatarFallback}
          draft={draft}
          onDraftChange={setDraft}
          posting={posting}
          onSubmit={() => void submitComment()}
          light={light}
          placeholder="Write a comment…"
        />
      ) : null}
    </Box>
  );

  return (
    <ThemeProvider theme={mobilizePanelTheme}>
      <Box sx={{ color: isDark ? "#0d0d0d" : "#0d0d0d" }}>{body}</Box>
    </ThemeProvider>
  );
}
