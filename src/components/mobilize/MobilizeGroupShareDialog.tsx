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
import { useCallback, useMemo, useState } from "react";

type SharePlatform = "whatsapp" | "facebook" | "x" | "linkedin" | "telegram" | "email";
type ShareChannel = SharePlatform | "direct_link";

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

function logGroupShare(groupId: string, channel: ShareChannel) {
  void fetch(`/api/mobilize/groups/${groupId}/share`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ channel }),
  }).catch(() => {
    /* non-blocking */
  });
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
  groupId: string;
  groupName: string;
  /** Absolute or path public URL, e.g. /g/{id} or full https URL. */
  publicUrl: string;
};

export function MobilizeGroupShareDialog({ open, onClose, groupId, groupName, publicUrl }: Props) {
  const [copied, setCopied] = useState(false);

  const absoluteUrl = useMemo(() => {
    if (publicUrl.startsWith("http://") || publicUrl.startsWith("https://")) return publicUrl;
    if (typeof window === "undefined") return publicUrl;
    return `${window.location.origin}${publicUrl.startsWith("/") ? "" : "/"}${publicUrl}`;
  }, [publicUrl]);

  const subject = `Join ${groupName} on FlashPoint Army`;
  const message = `Check out ${groupName} on FlashPoint Army Mobilize.`;

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(absoluteUrl);
      setCopied(true);
      logGroupShare(groupId, "direct_link");
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }, [absoluteUrl, groupId]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullWidth
      PaperProps={{
        sx: {
          width: "100%",
          maxWidth: 720,
          bgcolor: "#141418",
          border: "1px solid rgba(255,215,0,0.18)",
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>Share this group</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, lineHeight: 1.7 }}>
          Invite others to join <strong style={{ color: "inherit" }}>{groupName}</strong> using the
          public group link.
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
                href={shareHref(platform, absoluteUrl, message, subject)}
                target={platform === "email" ? undefined : "_blank"}
                rel={platform === "email" ? undefined : "noopener noreferrer"}
                variant="outlined"
                size="small"
                startIcon={icon}
                onClick={() => logGroupShare(groupId, platform)}
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
          label="Public group link"
          value={absoluteUrl}
          InputProps={{
            readOnly: true,
            endAdornment: (
              <InputAdornment position="end">
                <Tooltip title={copied ? "Copied!" : "Copy link"}>
                  <IconButton onClick={() => void copyLink()} edge="end" aria-label="Copy link">
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </InputAdornment>
            ),
          }}
        />
        {copied ? (
          <Typography variant="caption" color="primary.main" sx={{ display: "block", mt: 1 }}>
            Link copied — ready to share.
          </Typography>
        ) : (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1, lineHeight: 1.5 }}>
            Copy the public link or share it on social networks.
          </Typography>
        )}
      </DialogContent>
    </Dialog>
  );
}
