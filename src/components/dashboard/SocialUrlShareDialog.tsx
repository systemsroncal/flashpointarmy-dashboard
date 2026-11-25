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
import { useCallback, useState, type ReactNode } from "react";

type SharePlatform = "whatsapp" | "facebook" | "x" | "linkedin" | "telegram" | "email";

function shareHref(platform: SharePlatform, url: string, subject: string, message: string): string {
  const u = encodeURIComponent(url);
  const bodyText = message.trim() || subject;
  const t = encodeURIComponent(bodyText);
  const full = encodeURIComponent(`${bodyText}\n\n${url}`);

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
      return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`${bodyText}\n\n${url}`)}`;
    default:
      return `https://twitter.com/intent/tweet?url=${u}&text=${t}`;
  }
}

const SOCIAL_BUTTONS: {
  platform: SharePlatform;
  label: string;
  color?: string;
  hoverBg?: string;
  icon: ReactNode;
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
  shareUrl: string;
  subject: string;
  /** Plain text prepended in WhatsApp, Telegram, X, and email body (not only the URL). */
  shareMessage?: string;
  title: string;
  description: ReactNode;
  linkLabel?: string;
  /** Match Chapter Invite share modal (dark panel); default light for post share. */
  variant?: "light" | "dark";
};

export function SocialUrlShareDialog({
  open,
  onClose,
  shareUrl,
  subject,
  shareMessage,
  title,
  description,
  linkLabel = "Link",
  variant = "light",
}: Props) {
  const isDark = variant === "dark";
  const [copied, setCopied] = useState(false);

  const clipboardText =
    shareMessage?.trim() && shareUrl ? `${shareMessage.trim()}\n\n${shareUrl}` : shareUrl;

  const copyLink = useCallback(async () => {
    if (!clipboardText) return;
    try {
      await navigator.clipboard.writeText(clipboardText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }, [clipboardText]);

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
          bgcolor: isDark ? "#141418" : "#ffffff",
          border: isDark ? "1px solid rgba(255,215,0,0.18)" : "1px solid rgba(0,0,0,0.1)",
          borderRadius: 2,
          boxShadow: isDark ? "0 8px 32px rgba(0,0,0,0.45)" : "0 8px 32px rgba(0,0,0,0.12)",
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 800, pb: 1, color: isDark ? "grey.100" : "#1a1a1a" }}>
        {title}
      </DialogTitle>
      <DialogContent>
        <Typography
          variant="body2"
          component="div"
          sx={{
            mb: 2.5,
            lineHeight: 1.7,
            color: isDark ? "text.secondary" : "#65676b",
            "& strong": isDark ? { color: "text.primary" } : undefined,
          }}
        >
          {description}
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
                href={shareHref(platform, shareUrl, subject, shareMessage?.trim() || subject)}
                target={platform === "email" ? undefined : "_blank"}
                rel={platform === "email" ? undefined : "noopener noreferrer"}
                variant="outlined"
                size="small"
                startIcon={icon}
                disabled={!shareUrl}
                sx={{
                  justifyContent: "center",
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "0.78rem",
                  color: color ?? (isDark ? "inherit" : "#1a1a1a"),
                  borderColor: isDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.12)",
                  bgcolor: isDark ? "transparent" : "#fafafa",
                  py: 1,
                  "&:hover": {
                    borderColor: color ?? "primary.main",
                    bgcolor: hoverBg ?? (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"),
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
          label={linkLabel}
          value={shareUrl}
          sx={
            isDark
              ? {
                  "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.6)" },
                  "& .MuiOutlinedInput-root": {
                    color: "grey.100",
                    "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                  },
                }
              : undefined
          }
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
            Link copied — ready to share.
          </Typography>
        ) : (
          <Typography
            variant="caption"
            sx={{
              display: "block",
              mt: 1,
              lineHeight: 1.5,
              color: isDark ? "text.secondary" : "#65676b",
            }}
          >
            Copy the link or share it on social networks.
          </Typography>
        )}
      </DialogContent>
    </Dialog>
  );
}