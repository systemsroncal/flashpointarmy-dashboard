"use client";

import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import type { UnifiedFeedPost } from "@/lib/mobilize/social/feed-types";
import { absoluteMobilizePostShareUrl } from "@/lib/mobilize/social/post-share-url";
import { useCallback, useMemo, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  post: UnifiedFeedPost;
};

export function MobilizePostShareDialog({ open, onClose, post }: Props) {
  const [copied, setCopied] = useState(false);

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return absoluteMobilizePostShareUrl(window.location.origin, post) ?? "";
  }, [post]);

  const copyLink = useCallback(async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }, [shareUrl]);

  const authorName = post.author.display_name?.trim() || post.author.handle || "this member";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>Share post</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.65 }}>
          Anyone with this link can open the post after signing in to FlashPoint Army Chapters.
        </Typography>
        <TextField
          fullWidth
          size="small"
          label={`Link to ${authorName}'s post`}
          value={shareUrl}
          InputProps={{
            readOnly: true,
            endAdornment: (
              <InputAdornment position="end">
                <Tooltip title={copied ? "Copied!" : "Copy link"}>
                  <IconButton onClick={() => void copyLink()} edge="end" aria-label="Copy link" disabled={!shareUrl}>
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </InputAdornment>
            ),
          }}
        />
        {copied ? (
          <Typography variant="caption" color="primary.main" sx={{ display: "block", mt: 1 }}>
            Link copied.
          </Typography>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}