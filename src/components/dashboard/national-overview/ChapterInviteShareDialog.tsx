"use client";

import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import FacebookIcon from "@mui/icons-material/Facebook";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import TelegramIcon from "@mui/icons-material/Telegram";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import XIcon from "@mui/icons-material/X";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useCallback, useState } from "react";

export const CHAPTER_INVITE_SHARE_URL = "https://fparmychapters.com/join-a-chapter/";

export const CHAPTER_INVITE_SHARE_SUBJECT = "Join a FlashPoint Army Chapter near you";

export const CHAPTER_INVITE_SHARE_MESSAGE =
  "God is raising up believers in every state. Know someone who should be part of it? Invite them to find or join a chapter near them.";

export function chapterInviteShareText() {
  return `${CHAPTER_INVITE_SHARE_MESSAGE}\n\n${CHAPTER_INVITE_SHARE_URL}`;
}

type SharePlatform = "whatsapp" | "facebook" | "x" | "linkedin" | "telegram" | "email";

function shareHref(platform: SharePlatform, url: string, message: string, subject: string): string {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(message);
  const full = encodeURIComponent(`${message} ${url}`);

  switch (platform) {
    case "whatsapp":
      return `https://wa.me/?text=${full}`;
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${u}&quote=${t}`;
    case "linkedin":
      return `https://www.linkedin.com/sharing/share-offsite/?url=${u}`;
    case "telegram":
      return `https://t.me/share/url?url=${u}&text=${t}`;
    case "email":
      return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`${message}\n\n${url}`)}`;
    default:
      return `https://twitter.com/intent/tweet?url=${u}&text=${t}`;
  }
}

const SOCIAL_BUTTONS: {
  platform: SharePlatform;
  label: string;
  color?: string;
  hoverBg?: string;
  icon: React.ReactNode;
}[] = [
  { platform: "whatsapp", label: "WhatsApp", color: "#25d366", hoverBg: "rgba(37,211,102,0.16)", icon: <WhatsAppIcon /> },
  { platform: "facebook", label: "Facebook", color: "#1877f2", hoverBg: "rgba(24,119,242,0.16)", icon: <FacebookIcon /> },
  { platform: "x", label: "X", icon: <XIcon /> },
  { platform: "linkedin", label: "LinkedIn", color: "#0a66c2", hoverBg: "rgba(10,102,194,0.16)", icon: <LinkedInIcon /> },
  { platform: "telegram", label: "Telegram", color: "#229ed9", hoverBg: "rgba(34,158,217,0.16)", icon: <TelegramIcon /> },
  { platform: "email", label: "Email", icon: <EmailOutlinedIcon /> },
];

type Props = {
  open: boolean;
  onClose: () => void;
};

export function ChapterInviteShareDialog({ open, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  const copyInvite = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(chapterInviteShareText());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }, []);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: "#141418",
          border: "1px solid rgba(255,215,0,0.18)",
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>Share this invitation</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, lineHeight: 1.7 }}>
          {CHAPTER_INVITE_SHARE_MESSAGE}
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 1.25,
            mb: 2.5,
          }}
        >
          {SOCIAL_BUTTONS.map(({ platform, label, color, hoverBg, icon }) => (
            <Tooltip key={platform} title={label}>
              <Button
                component="a"
                href={shareHref(
                  platform,
                  CHAPTER_INVITE_SHARE_URL,
                  CHAPTER_INVITE_SHARE_MESSAGE,
                  CHAPTER_INVITE_SHARE_SUBJECT
                )}
                target={platform === "email" ? undefined : "_blank"}
                rel={platform === "email" ? undefined : "noopener noreferrer"}
                variant="outlined"
                size="small"
                startIcon={icon}
                sx={{
                  justifyContent: "center",
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "0.78rem",
                  color: color ?? "inherit",
                  borderColor: "rgba(255,255,255,0.14)",
                  py: 1,
                  "&:hover": {
                    borderColor: color ?? "primary.main",
                    bgcolor: hoverBg ?? "rgba(255,255,255,0.06)",
                  },
                }}
              >
                {label}
              </Button>
            </Tooltip>
          ))}
        </Box>

        <TextField
          fullWidth
          size="small"
          label="Invitation link"
          value={CHAPTER_INVITE_SHARE_URL}
          InputProps={{
            readOnly: true,
            endAdornment: (
              <InputAdornment position="end">
                <Tooltip title={copied ? "Copied!" : "Copy invitation"}>
                  <IconButton onClick={() => void copyInvite()} edge="end">
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </InputAdornment>
            ),
          }}
        />
        {copied ? (
          <Typography variant="caption" color="primary.main" sx={{ display: "block", mt: 1 }}>
            Invitation copied — ready to share by text, Instagram, or anywhere else.
          </Typography>
        ) : (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1, lineHeight: 1.5 }}>
            Copy includes the message and link. Paste it in Instagram DMs or any app.
          </Typography>
        )}
      </DialogContent>
    </Dialog>
  );
}
