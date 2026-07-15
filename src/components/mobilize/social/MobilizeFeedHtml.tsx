import DOMPurify from "isomorphic-dompurify";
import { Box, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";

type Props = {
  html?: string | null;
  plain?: string | null;
  sx?: SxProps<Theme>;
};

export function MobilizeFeedHtml({ html, plain, sx }: Props) {
  const rawHtml = typeof html === "string" ? html.trim() : "";
  if (rawHtml) {
    const safe = DOMPurify.sanitize(rawHtml, { USE_PROFILES: { html: true } });
    if (safe.trim()) {
      return (
        <Box
          className="mobilize-feed-html"
          sx={{
            typography: "body2",
            color: "#1a1a1a",
            "& p": { mb: 1 },
            "& p:last-child": { mb: 0 },
            "& a": { color: "#1565c0", wordBreak: "break-word" },
            "& img": { maxWidth: "100%", height: "auto", borderRadius: 1 },
            ...sx,
          }}
          dangerouslySetInnerHTML={{ __html: safe }}
        />
      );
    }
  }
  const text = typeof plain === "string" ? plain.trim() : "";
  if (!text) return null;
  return (
    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", color: "#1a1a1a", ...sx }}>
      {text}
    </Typography>
  );
}
