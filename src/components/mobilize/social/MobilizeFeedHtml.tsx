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

/**
 * Strip inline font-family styles from pasted content so the system font is used.
 * Removes font-family from style attributes and inline elements that copy-paste
 * from external websites.
 */
function stripForeignFontFamily(html: string): string {
  // Remove font-family declarations from style attributes
  let result = html.replace(
    /style\s*=\s*["'][^"']*font-family\s*:[^"']*["']/gi,
    (match) => {
      // Remove just the font-family part from the style
      const cleaned = match.replace(/font-family\s*:\s*[^;]+;?\s*/gi, "").trim();
      // If style attribute is now empty, remove it entirely
      if (cleaned.match(/style\s*=\s*["']\s*["']$/) || cleaned === 'style=""' || cleaned === "style=''") {
        return "";
      }
      return cleaned;
    },
  );

  // Also strip <font> tags that carry face attributes
  result = result.replace(/<font[^>]*face\s*=\s*["'][^"']*["'][^>]*>/gi, "<font>");

  return result;
}

/**
 * Auto-link plain-text URLs, emails, and phone numbers that are not already
 * inside <a> tags.
 */
function autoLinkPlainText(html: string): string {
  // Only process text nodes (not inside HTML tags)
  // Split by tags, process only the text parts
  const parts = html.split(/(<[^>]+>)/);
  return parts
    .map((part) => {
      // Skip HTML tags
      if (part.startsWith("<")) return part;
      // Skip if already inside an anchor
      let result = part;

      // Auto-link URLs (http/https)
      result = result.replace(
        /(?<!["\'>])(https?:\/\/[^\s<>"')\]]+)/gi,
        (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`,
      );

      // Auto-link email addresses
      result = result.replace(
        /(?<!["'>\/])([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(?![^<]*<\/a>)/g,
        (email) => `<a href="mailto:${email}" target="_blank">${email}</a>`,
      );

      // Auto-link phone numbers (US formats: +1-xxx-xxx-xxxx, (xxx) xxx-xxxx, etc.)
      result = result.replace(
        /(?<!["'>\/])(\+?1?[\s.-]?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})(?![^<]*<\/a>)/g,
        (phone) => {
          const digits = phone.replace(/\D/g, "");
          return `<a href="tel:${digits}">${phone}</a>`;
        },
      );

      return result;
    })
    .join("");
}

function addTargetBlankToExternalLinks(html: string): string {
  return html.replace(
    /<a\b([^>]*?)href="(https?:\/\/[^"']+)\"([^>]*?)>/gi,
    (_match, before, href, after) => {
      if (/target\s*=\s*["']_blank["']/i.test(before + after)) return _match;
      return `<a${before}href="${href}"${after} target="_blank" rel="noopener noreferrer">`;
    },
  );
}

function processHtml(html: string): string {
  let result = html;
  result = stripForeignFontFamily(result);
  result = autoLinkPlainText(result);
  result = addTargetBlankToExternalLinks(result);
  return result;
}

function HtmlFragment({
  html,
  sx,
}: {
  html: string;
  sx?: SxProps<Theme>;
}) {
  const processed = useMemo(() => processHtml(html), [html]);
  const safe = DOMPurify.sanitize(processed, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ["target", "rel"],
  });
  if (!safe.trim()) return null;
  return (
    <Box
      className="mobilize-feed-html"
      sx={{
        typography: "body2",
        color: "#1a1a1a",
        fontFamily: "inherit",
        "& *": { fontFamily: "inherit !important" },
        "& h1, & h2, & h3, & h4, & h5, & h6": { mt: 0, pt: 0, mb: 0.75, lineHeight: 1.3 },
        "& h1:first-child, & h2:first-child, & h3:first-child, & h4:first-child, & h5:first-child, & h6:first-child": { mt: 0, pt: 0 },
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

  // Plain text fallback — also auto-link
  const text = typeof plain === "string" ? plain.trim() : "";
  if (!text) return null;

  // Auto-link in plain text fallback
  const linked = text
    .replace(/(https?:\/\/[^\s<>"')\]]+)/gi, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, '<a href="mailto:$1">$1</a>')
    .replace(/(\+?1?[\s.-]?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})/g, (_m, phone) => {
      const digits = phone.replace(/\D/g, "");
      return `<a href="tel:${digits}">${phone}</a>`;
    });

  return (
    <Typography
      variant="body2"
      sx={{ whiteSpace: "pre-wrap", color: "#1a1a1a", fontFamily: "inherit", ...sx }}
      dangerouslySetInnerHTML={{ __html: linked }}
    />
  );
}
