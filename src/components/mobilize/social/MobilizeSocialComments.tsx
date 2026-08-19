"use client";

import type { MobilizeSocialAuthor } from "@/components/mobilize/social/MobilizeSocialPostHeader";
import type { ReactionType } from "@/lib/mobilize/social/reaction-summary";
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

const DEFAULT_VISIBLE_COMMENTS = 2;
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
  const composerBg = light ? "#f0f2f5" : "rgba(255,255,255,0.06)";
  const nameMuted = light ? "#65676b" : TRUTH_HUB_TEXT_MUTED;
  const avatarSize = compact ? 28 : 36;
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
    <Box sx={{ mt: compact ? 1 : 1.5, overflow: "visible" }}>
      {header}
      <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start", overflow: "visible" }}>
        <Avatar
          src={viewerAvatarUrl ? publicAssetSrc(viewerAvatarUrl) : undefined}
          sx={{ width: avatarSize, height: avatarSize, mt: 0.25, bgcolor: "#263238", flexShrink: 0 }}
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
                borderRadius: "999px",
                fontSize: "0.9375rem",
                overflow: "hidden",
                alignItems: "center",
                pr: 0.5,
                "& fieldset": {
                  border: "1px solid transparent",
                  borderRadius: "999px",
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
                "& .MuiInputBase-input": { px: 1.75, py: 1.1 },
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
    setBusy(true);
    try {
      const res = await fetch(commentReactionUrl(node.id), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reaction_type: next }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Reaction failed.");
      setReactions(json.reactions);
    } finally {
      setBusy(false);
    }
  }

  const canDelete = Boolean(viewerUserId && (viewerUserId === node.author_id || viewerIsSuperAdmin));
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
            <Stack direction="row" spacing={0.75} alignItems="baseline" flexWrap="wrap" useFlexGap>
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
          {node.replies.map((reply) => (
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
  const [commentsExpanded, setCommentsExpanded] = useState(false);
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
      setCommentsExpanded(false);
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
      setCommentsExpanded(true);
      await load();
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

  // On mobile (stacked columns), show all comments expanded.
  // On desktop, show first 2 with expand/collapse.
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));

  if (!open) return null;

  const nameMuted = light ? "#65676b" : TRUTH_HUB_TEXT_MUTED;
  const avatarFallback = viewerDisplayName?.trim() || "?";

  const topComments = isDesktop ? comments.slice(0, DEFAULT_VISIBLE_COMMENTS) : [];
  const restComments = isDesktop && comments.length > DEFAULT_VISIBLE_COMMENTS
    ? comments.slice(DEFAULT_VISIBLE_COMMENTS)
    : [];
  const hiddenCount = restComments.length;
  const mobileComments = !isDesktop ? comments : [];

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
        mt: 1.25,
        pt: 1.25,
        borderTop: isDark ? `1px dashed ${TRUTH_HUB_BORDER}` : "1px solid rgba(0,0,0,0.08)",
        px: 0.25,
        overflow: "visible",
      }}
    >
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
          <CircularProgress size={22} sx={isDark ? { color: TRUTH_HUB_TEXT_MUTED } : undefined} />
        </Box>
      ) : null}
      {!loading && !comments.length ? (
        <Typography variant="body2" sx={{ mb: 1, color: nameMuted }}>
          No comments yet. Start the conversation.
        </Typography>
      ) : null}
      {/* Mobile: all comments rendered inline, no collapse */}
      {mobileComments.map((c) => (
        <CommentItem
          key={c.id}
          node={c}
          commentReactionUrl={commentReactionUrl}
          canComment={canComment}
          onReply={(id, name) => {
            setReplyParentId(id);
            setReplyToName(name);
            setCommentsExpanded(true);
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
      {/* Desktop: first 2 always visible */}
      {topComments.map((c) => (
        <CommentItem
          key={c.id}
          node={c}
          commentReactionUrl={commentReactionUrl}
          canComment={canComment}
          onReply={(id, name) => {
            setReplyParentId(id);
            setReplyToName(name);
            setCommentsExpanded(true);
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
      {restComments.length > 0 ? (
        <Box
          sx={{
            display: "grid",
            gridTemplateRows: commentsExpanded ? "1fr" : "0fr",
            transition: "grid-template-rows 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <Box sx={{ overflow: "hidden", minHeight: 0 }}>
            {restComments.map((c) => (
              <CommentItem
                key={c.id}
                node={c}
                commentReactionUrl={commentReactionUrl}
                canComment={canComment}
                onReply={(id, name) => {
                  setReplyParentId(id);
                  setReplyToName(name);
                  setCommentsExpanded(true);
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
          </Box>
        </Box>
      ) : null}
      {!loading && isDesktop && hiddenCount > 0 ? (
        <Button
          size="small"
          onClick={() => setCommentsExpanded((v) => !v)}
          sx={{
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
          }}
        >           {commentsExpanded ? "Less comments" : "More comments"}
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

  if (isDark) {
    return (
      <ThemeProvider theme={mobilizePanelTheme}>
        <Box sx={{ color: "#0d0d0d" }}>{body}</Box>
      </ThemeProvider>
    );
  }

  return body;
}
