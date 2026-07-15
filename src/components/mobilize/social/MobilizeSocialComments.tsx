"use client";

import { MobilizeSocialPostHeader, type MobilizeSocialAuthor } from "@/components/mobilize/social/MobilizeSocialPostHeader";
import { MobilizeSocialReactionBar } from "@/components/mobilize/social/MobilizeSocialReactionBar";
import type { ReactionType } from "@/lib/mobilize/social/reaction-summary";
import { Box, Button, CircularProgress, TextField, Typography } from "@mui/material";
import { useCallback, useEffect, useState } from "react";

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
};

function countComments(nodes: SocialCommentNode[]): number {
  return nodes.reduce((sum, n) => sum + 1 + countComments(n.replies), 0);
}

function CommentItem({
  node,
  commentReactionUrl,
  canComment,
  onReply,
  depth,
}: {
  node: SocialCommentNode;
  commentReactionUrl: (commentId: string) => string;
  canComment: boolean;
  onReply: (parentId: string) => void;
  depth: number;
}) {
  const [reactions, setReactions] = useState(node.reactions);
  const [busy, setBusy] = useState(false);

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

  function toggleLike() {
    void setReaction(reactions.viewer_reaction === "like" ? null : "like");
  }

  function toggleLove() {
    void setReaction(reactions.viewer_reaction === "love" ? null : "love");
  }

  return (
    <Box sx={{ pl: depth > 0 ? 2 : 0, mt: depth > 0 ? 1.25 : 1.5 }}>
      <MobilizeSocialPostHeader author={node.author} createdAt={node.created_at} size="sm" />
      <Typography variant="body2" sx={{ mt: 0.5, color: "#1a1a1a", whiteSpace: "pre-wrap" }}>
        {node.content}
      </Typography>
      <MobilizeSocialReactionBar
        reactions={reactions}
        commentCount={node.replies.length}
        onToggleLike={toggleLike}
        onToggleLove={toggleLove}
        disabled={busy}
      />
      {canComment && node.depth < 3 ? (
        <Button size="small" sx={{ mt: 0.5, textTransform: "none" }} onClick={() => onReply(node.id)}>
          Reply
        </Button>
      ) : null}
      {node.replies.map((reply) => (
        <CommentItem
          key={reply.id}
          node={reply}
          commentReactionUrl={commentReactionUrl}
          canComment={canComment}
          onReply={onReply}
          depth={depth + 1}
        />
      ))}
    </Box>
  );
}

export function MobilizeSocialComments({
  commentsUrl,
  commentReactionUrl,
  canComment,
  open,
  onCountChange,
}: Props) {
  const [comments, setComments] = useState<SocialCommentNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [draft, setDraft] = useState("");
  const [replyParentId, setReplyParentId] = useState<string | null>(null);

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
    if (open) void load();
  }, [open, load]);

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
      await load();
    } finally {
      setPosting(false);
    }
  }

  if (!open) return null;

  return (
    <Box sx={{ mt: 1.5, pt: 1.5, borderTop: "1px dashed rgba(0,0,0,0.1)" }}>
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
          <CircularProgress size={22} />
        </Box>
      ) : null}
      {!loading && !comments.length ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          No comments yet. Start the conversation.
        </Typography>
      ) : null}
      {comments.map((c) => (
        <CommentItem
          key={c.id}
          node={c}
          commentReactionUrl={commentReactionUrl}
          canComment={canComment}
          onReply={(id) => setReplyParentId(id)}
          depth={0}
        />
      ))}
      {canComment ? (
        <Box sx={{ mt: 2 }}>
          {replyParentId ? (
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
              Replying to a comment{" "}
              <Button size="small" sx={{ minWidth: 0, p: 0, textTransform: "none" }} onClick={() => setReplyParentId(null)}>
                Cancel
              </Button>
            </Typography>
          ) : null}
          <TextField
            fullWidth
            size="small"
            multiline
            minRows={2}
            placeholder="Write a comment…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={posting}
          />
          <Button
            variant="contained"
            size="small"
            sx={{ mt: 1 }}
            disabled={posting || !draft.trim()}
            onClick={() => void submitComment()}
          >
            {posting ? "Posting…" : "Comment"}
          </Button>
        </Box>
      ) : null}
    </Box>
  );
}
