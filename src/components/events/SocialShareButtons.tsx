"use client";

import FacebookIcon from "@mui/icons-material/Facebook";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import ShareIcon from "@mui/icons-material/Share";
import XIcon from "@mui/icons-material/X";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";

function shareHref(platform: "facebook" | "x" | "linkedin", url: string, title: string): string {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  if (platform === "facebook") return `https://www.facebook.com/sharer/sharer.php?u=${u}`;
  if (platform === "linkedin") return `https://www.linkedin.com/sharing/share-offsite/?url=${u}`;
  return `https://twitter.com/intent/tweet?url=${u}&text=${t}`;
}

export function SocialShareButtons({ url, title }: { url: string; title: string }) {
  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // no-op; share links remain available
    }
  }

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap" }}>
      <Typography variant="body2" color="text.secondary" sx={{ mr: 0.5 }}>
        Share:
      </Typography>
      <Tooltip title="Share on X">
        <IconButton
          component="a"
          href={shareHref("x", url, title)}
          target="_blank"
          rel="noopener noreferrer"
          size="small"
        >
          <XIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Share on Facebook">
        <IconButton
          component="a"
          href={shareHref("facebook", url, title)}
          target="_blank"
          rel="noopener noreferrer"
          size="small"
        >
          <FacebookIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Share on LinkedIn">
        <IconButton
          component="a"
          href={shareHref("linkedin", url, title)}
          target="_blank"
          rel="noopener noreferrer"
          size="small"
        >
          <LinkedInIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Copy link">
        <IconButton onClick={() => void copyUrl()} size="small">
          <ShareIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
}
