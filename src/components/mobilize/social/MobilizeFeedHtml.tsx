"use client";

import { findAllVideoMarkers } from "@/components/dashboard/notifications/announcement-video-markers";
import { CourseVideoPlyr } from "@/components/courses/CourseVideoPlyr";
import { resolveVideoForPlyr } from "@/lib/media/resolve-plyr-video";
import { trimTrailingFeedHtml } from "@/lib/mobilize/social/sanitize-feed-html";
import DOMPurify from "isomorphic-dompurify";
import { Box, Stack, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import { useMemo } from "react";

type Props = {
  html?: string | null;
  plain?: string | null;
  sx?: SxProps<Theme>;
};

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

function HtmlFragment({
  html,
  sx,
}: {
  html: string;
  sx?: SxProps<Theme>;
}) {
  const safe = DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
  if (!safe.trim()) return null;
  return (
    <Box
      className="mobilize-feed-html"
      sx={{
        typography: "body2",
        color: "#1a1a1a",
        "& p": { mt: 0, pt: 0, mb: 1 },
        "& p:first-of-type": { mt: 0, pt: 0 },
        "& p:last-child": { mb: 0 },
        "& a": { color: "#1565c0", wordBreak: "break-word" },
        "& img": { maxWidth: "100%", height: "auto", borderRadius: 1 },
        ...sx,
      }}
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}

export function MobilizeFeedHtml({ html, plain, sx }: Props) {
  const rawHtml = typeof html === "string" ? trimTrailingFeedHtml(html.trim()) : "";
  const parts = useMemo(() => (rawHtml ? splitParts(rawHtml) : []), [rawHtml]);

  if (parts.length > 0) {
    const hasRenderable = parts.some((p) => {
      if (p.kind === "video") return resolveVideoForPlyr(p.url).kind !== "none";
      return Boolean(DOMPurify.sanitize(p.html, { USE_PROFILES: { html: true } }).trim());
    });
    if (hasRenderable) {
      return (
        <Stack spacing={1.25} sx={{ width: "100%" }}>
          {parts.map((part, i) => {
            if (part.kind === "video") {
              const resolved = resolveVideoForPlyr(part.url);
              if (resolved.kind === "none") {
                return (
                  <Typography key={`vid-${i}`} variant="caption" color="warning.main">
                    Invalid video URL.
                  </Typography>
                );
              }
              return (
                <Box
                  key={`vid-${i}-${part.url}`}
                  sx={{ width: "100%", "& .course-video-plyr-mount": { maxWidth: "100%" } }}
                >
                  <CourseVideoPlyr
                    videoUrl={part.url}
                    initialSeconds={0}
                    onPersistSeconds={() => {}}
                    autoplayMuted={false}
                    showProgressHint={false}
                  />
                </Box>
              );
            }
            return <HtmlFragment key={`html-${i}`} html={part.html} sx={sx} />;
          })}
        </Stack>
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
