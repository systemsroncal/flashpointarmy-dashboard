import DOMPurify from "isomorphic-dompurify";
import { Box, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";

type Props = {
  html: string | null | undefined;
  /** MUI sx applied to the wrapper around sanitized HTML */
  sx?: SxProps<Theme>;
};

/**
 * Renders stored event description HTML (sanitized) for dashboard and public pages.
 */
export function EventDescriptionHtml({ html, sx }: Props) {
  const raw = typeof html === "string" ? html.trim() : "";
  if (!raw) {
    return (
      <Typography variant="body1" color="text.secondary" component="span">
        —
      </Typography>
    );
  }

  const safe = DOMPurify.sanitize(raw, {
    USE_PROFILES: { html: true },
  });

  if (!safe.trim()) {
    return (
      <Typography variant="body1" color="text.secondary" component="span">
        —
      </Typography>
    );
  }

  return (
    <Box
      className="event-description-html"
      sx={{
        typography: "body1",
        "& p": { mb: 1.25 },
        "& p:last-child": { mb: 0 },
        "& ul, & ol": { pl: 3, my: 1 },
        "& h1, & h2, & h3": { mt: 2, mb: 1, fontWeight: 700 },
        "& a": { color: "primary.main", wordBreak: "break-word" },
        "& img": { maxWidth: "100%", height: "auto", borderRadius: 1 },
        "& table": { width: "100%", borderCollapse: "collapse", my: 1 },
        "& th, & td": { border: 1, borderColor: "divider", p: 0.75 },
        ...sx,
      }}
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}
