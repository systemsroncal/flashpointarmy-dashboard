"use client";

import { CourseVideoPlyr } from "@/components/courses/CourseVideoPlyr";
import { resolveVideoForPlyr } from "@/lib/media/resolve-plyr-video";
import DOMPurify from "isomorphic-dompurify";
import { Box, Stack, Typography } from "@mui/material";
import { useMemo } from "react";
import { findAllVideoMarkers } from "./announcement-video-markers";

/** Pale gold used for links in dashboard rich text (matches GatheringDescriptionEditor dark surface). */
const DASHBOARD_LINK_COLOR = "#f5d547";
const DASHBOARD_LINK_HOVER = "#FFD700";

export { ANNOUNCEMENT_PLYR_BLOCK_CLASS, announcementPlainTextPreview } from "./announcement-video-markers";

type Part = { kind: "html"; html: string } | { kind: "video"; url: string };

function splitParts(html: string): Part[] {
  const s = typeof html === "string" ? html : "";
  if (!s.trim()) return [];
  const markers = findAllVideoMarkers(s);
  if (!markers.length) return [{ kind: "html", html: s }];
  const parts: Part[] = [];
  let last = 0;
  for (const mk of markers) {
    if (mk.start > last) parts.push({ kind: "html", html: s.slice(last, mk.start) });
    parts.push({ kind: "video", url: mk.url });
    last = mk.end;
  }
  if (last < s.length) parts.push({ kind: "html", html: s.slice(last) });
  return parts;
}

/** TinyMCE often saves light-theme inline colors; strip them so dark dashboard cards stay readable. */
function stripInlineTextColors(html: string): string {
  const withoutStyleColors = html.replace(/\sstyle=(["'])([\s\S]*?)\1/gi, (_, quote, styles: string) => {
    const kept = styles
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s && !/^color\s*:/i.test(s));
    if (!kept.length) return "";
    return ` style=${quote}${kept.join("; ")}${quote}`;
  });
  return withoutStyleColors.replace(/(<font\b[^>]*)\scolor=(["'])[^"']*\2/gi, "$1");
}

function sanitizeHtmlFragment(fragment: string): string {
  const safe = DOMPurify.sanitize(fragment, { USE_PROFILES: { html: true } });
  return stripInlineTextColors(safe);
}

const darkHtmlSx = {
  color: "grey.300",
  "& p, & span, & div, & li, & td, & th, & font, & em, & strong, & b, & i, & u, & blockquote": {
    color: "grey.300 !important",
  },
  "& h1, & h2, & h3, & h4": {
    color: "grey.100 !important",
  },
  "& a, & a:visited": {
    color: `${DASHBOARD_LINK_COLOR} !important`,
    textDecorationColor: "rgba(245, 213, 71, 0.55)",
    wordBreak: "break-word",
    "&:hover": {
      color: `${DASHBOARD_LINK_HOVER} !important`,
      textDecorationColor: DASHBOARD_LINK_HOVER,
    },
  },
} as const;

type Props = {
  html: string;
  /** Tighter vertical spacing between blocks */
  compact?: boolean;
};

/**
 * Renders notification description HTML with optional Plyr blocks (YouTube, Vimeo, MP4, etc.).
 */
export function AnnouncementDescriptionBody({ html, compact }: Props) {
  const parts = useMemo(() => splitParts(html), [html]);
  const gap = compact ? 1.5 : 2.5;

  return (
    <Stack spacing={gap} sx={{ color: "grey.300" }}>
      {parts.map((part, i) => {
        if (part.kind === "video") {
          const resolved = resolveVideoForPlyr(part.url);
          if (resolved.kind === "none") {
            return (
              <Typography key={`vid-${i}`} variant="caption" color="warning.light">
                Invalid video URL.
              </Typography>
            );
          }
          return (
            <Box key={`vid-${i}-${part.url}`} sx={{ width: "100%", "& .course-video-plyr-mount": { maxWidth: "100%" } }}>
              <CourseVideoPlyr
                videoUrl={part.url}
                initialSeconds={0}
                onPersistSeconds={() => {}}
                autoplayMuted={false}
              />
            </Box>
          );
        }
        const safe = sanitizeHtmlFragment(part.html);
        if (!safe.trim()) return null;
        const plainFragment = !/<[a-z]/i.test(part.html.trim());
        return (
          <Box
            key={`html-${i}`}
            className="announcement-description-html"
            sx={{
              typography: "body2",
              lineHeight: 1.65,
              ...(plainFragment ? { whiteSpace: "pre-wrap" as const } : {}),
              ...darkHtmlSx,
              "& p": { mb: 1.25 },
              "& p:last-child": { mb: 0 },
              "& ul, & ol": { pl: 3, my: 1 },
              "& h1, & h2, & h3": { mt: 1.5, mb: 1, fontWeight: 700 },
              "& img": { maxWidth: "100%", height: "auto", borderRadius: 1 },
              "& table": { width: "100%", borderCollapse: "collapse", my: 1 },
              "& th, & td": { border: 1, borderColor: "divider", p: 0.75 },
            }}
            dangerouslySetInnerHTML={{ __html: safe }}
          />
        );
      })}
    </Stack>
  );
}
