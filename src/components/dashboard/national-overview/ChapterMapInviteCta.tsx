"use client";

import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import FacebookIcon from "@mui/icons-material/Facebook";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import XIcon from "@mui/icons-material/X";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";

const SHARE_TITLE = "Join FlashPoint Army Chapters — train, mobilize, and stand firm together.";

function shareHref(platform: "facebook" | "x" | "linkedin", url: string, title: string): string {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  if (platform === "facebook") return `https://www.facebook.com/sharer/sharer.php?u=${u}`;
  if (platform === "linkedin") return `https://www.linkedin.com/sharing/share-offsite/?url=${u}`;
  return `https://twitter.com/intent/tweet?url=${u}&text=${t}`;
}

export function ChapterMapInviteCta() {
  const [open, setOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setShareUrl(`${window.location.origin}/register`);
  }, []);

  const copyUrl = useCallback(async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [shareUrl]);

  return (
    <>
      <Box
        sx={{
          mt: 2.5,
          pt: 2,
          borderTop: "1px solid rgba(255,215,0,0.14)",
          textAlign: "center",
        }}
      >
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.25, lineHeight: 1.65 }}>
          The movement is growing across the nation. Know someone who should be part of it? Invite them to
          join FlashPoint Army Chapters.
        </Typography>
        <Button
          variant="outlined"
          color="primary"
          size="small"
          startIcon={<ShareOutlinedIcon />}
          onClick={() => setOpen(true)}
          sx={{
            fontWeight: 700,
            borderRadius: 999,
            px: 2.25,
            textTransform: "none",
          }}
        >
          Invite others to join
        </Button>
      </Box>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: "#141418",
            border: "1px solid rgba(255,215,0,0.18)",
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>Share the mission</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, lineHeight: 1.65 }}>
            Send this link so others can register and join a chapter near them.
          </Typography>

          <Stack direction="row" spacing={1} justifyContent="center" sx={{ mb: 2.5 }}>
            <Tooltip title="Share on X">
              <IconButton
                component="a"
                href={shareUrl ? shareHref("x", shareUrl, SHARE_TITLE) : undefined}
                target="_blank"
                rel="noopener noreferrer"
                disabled={!shareUrl}
                sx={{
                  bgcolor: "rgba(255,255,255,0.06)",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.12)" },
                }}
              >
                <XIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Share on Facebook">
              <IconButton
                component="a"
                href={shareUrl ? shareHref("facebook", shareUrl, SHARE_TITLE) : undefined}
                target="_blank"
                rel="noopener noreferrer"
                disabled={!shareUrl}
                sx={{
                  bgcolor: "rgba(255,255,255,0.06)",
                  color: "#1877f2",
                  "&:hover": { bgcolor: "rgba(24,119,242,0.16)" },
                }}
              >
                <FacebookIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Share on LinkedIn">
              <IconButton
                component="a"
                href={shareUrl ? shareHref("linkedin", shareUrl, SHARE_TITLE) : undefined}
                target="_blank"
                rel="noopener noreferrer"
                disabled={!shareUrl}
                sx={{
                  bgcolor: "rgba(255,255,255,0.06)",
                  color: "#0a66c2",
                  "&:hover": { bgcolor: "rgba(10,102,194,0.16)" },
                }}
              >
                <LinkedInIcon />
              </IconButton>
            </Tooltip>
          </Stack>

          <TextField
            fullWidth
            size="small"
            label="Registration link"
            value={shareUrl}
            InputProps={{
              readOnly: true,
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title={copied ? "Copied!" : "Copy link"}>
                    <IconButton onClick={() => void copyUrl()} edge="end" disabled={!shareUrl}>
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              ),
            }}
          />
          {copied ? (
            <Typography variant="caption" color="primary.main" sx={{ display: "block", mt: 1 }}>
              Link copied to clipboard.
            </Typography>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
