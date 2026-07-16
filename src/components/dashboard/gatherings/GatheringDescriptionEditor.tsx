"use client";

import { Box, InputLabel, Typography } from "@mui/material";
import dynamic from "next/dynamic";
import { useMemo } from "react";

function EditorLoading() {
  return (
    <Box
      sx={{
        minHeight: 200,
        bgcolor: "action.hover",
        borderRadius: 1,
        border: 1,
        borderColor: "divider",
      }}
    />
  );
}

const Editor = dynamic(() => import("@tinymce/tinymce-react").then((m) => m.Editor), {
  ssr: false,
  loading: () => <EditorLoading />,
});

const TINYMCE_BASE = "/tinymce";

type Props = {
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
  /** Field label above the editor (default: Description). */
  label?: string;
  /** TinyMCE helper line under the editor (default: true). */
  showHelper?: boolean;
  /** Shorter toolbar and height (e.g. quiz fields). Omits the “source code” button from the toolbar. */
  compact?: boolean;
  /** Truth Social–style: no formatting bar; placeholder + autoresize only. */
  variant?: "default" | "social";
  /** Chrome for `variant="social"`. */
  socialSurface?: "dark" | "light";
  /** Called when TinyMCE initializes (social footer: emoji picker). */
  onEditorInit?: (editor: { execCommand: (cmd: string) => void }) => void;
  /** Helper line under the editor when `showHelper` is true (replaces the default English hint). */
  helperText?: string;
  /** Adds a “Video” toolbar control that inserts a Plyr-ready embed block (YouTube, Vimeo, MP4, etc.). */
  videoEmbedButton?: boolean;
  /** Dark chrome + white text in the editing surface (course editor). */
  darkSurface?: boolean;
};

export function GatheringDescriptionEditor({
  value,
  onChange,
  disabled,
  label = "Description",
  showHelper = true,
  compact = false,
  variant = "default",
  socialSurface = "dark",
  onEditorInit,
  helperText,
  videoEmbedButton = false,
  darkSurface = false,
}: Props) {
  const isSocial = variant === "social";
  const socialDark = socialSurface === "dark";
  const init = useMemo(() => {
    const lightBodyStyle =
      'body { font-family: var(--font-barlow, Barlow, Helvetica, Arial, sans-serif); font-size: 14px; line-height: 1.45; margin: 6px; } p { margin: 0 0 0.5em 0; } p:last-child { margin-bottom: 0; }';
    const darkBodyStyle =
      'body { font-family: var(--font-barlow, Barlow, Helvetica, Arial, sans-serif); font-size: 14px; line-height: 1.45; margin: 8px; background-color: #121212; color: #f5f5f5; } p { margin: 0 0 0.5em 0; color: #f5f5f5; } p:last-child { margin-bottom: 0; } a { color: #f5d547; }';
    const darkChrome = darkSurface
      ? { skin: "oxide-dark" as const, content_css: "dark" as const, content_style: darkBodyStyle }
      : {};
    const videoToolbar = videoEmbedButton ? " | fplyrvideo" : "";
    const videoSchema = videoEmbedButton
      ? {
          extended_valid_elements:
            "div[class|data-video-url|data-mce-bogus|contenteditable|id|style],span[class|style|data-mce-bogus]",
          verify_html: false,
          code_dialog_width: 900,
          code_dialog_height: 560,
        }
      : {};
    const registerVideo = (ed: {
      insertContent: (html: string) => void;
      ui: { registry: { addButton: (id: string, spec: { text: string; tooltip: string; onAction: () => void }) => void } };
      execCommand: (cmd: string) => void;
    }) => {
      onEditorInit?.(ed);
      if (!videoEmbedButton) return;
      ed.ui.registry.addButton("fplyrvideo", {
        text: "Video",
        tooltip: "Insert [fpa_video]…[/fpa_video] shortcode (Plyr: YouTube, Vimeo, MP4…)",
        onAction: () => {
          const raw = typeof window !== "undefined" ? window.prompt("Paste video URL (YouTube, Vimeo, or direct MP4):") : null;
          if (!raw?.trim()) return;
          const safe = raw.trim().replace(/\]/g, "%5D");
          ed.insertContent(`<p>[fpa_video]${safe}[/fpa_video]</p><p><br></p>`);
        },
      });
    };
    if (isSocial) {
      const socialBodyStyle = socialDark
        ? "body { font-family: var(--font-barlow, Barlow, Helvetica, Arial, sans-serif); font-size: 15px; line-height: 1.5; margin: 0; padding: 4px 2px; background: transparent; color: #e7e9ea; } p { margin: 0 0 0.5em 0; color: #e7e9ea; }"
        : "body { font-family: var(--font-barlow, Barlow, Helvetica, Arial, sans-serif); font-size: 15px; line-height: 1.5; margin: 0; padding: 4px 2px; background: transparent; color: #0d0d0d; } p { margin: 0 0 0.5em 0; }";
      const socialChrome = socialDark
        ? { skin: "oxide-dark" as const, content_css: "dark" as const }
        : {};
      return {
        height: 96,
        base_url: TINYMCE_BASE,
        suffix: ".min",
        menubar: false,
        branding: false,
        promotion: false,
        statusbar: false,
        toolbar: false,
        plugins: ["autoresize", "emoticons", "lists", "link"].join(" "),
        placeholder: "What's on your mind?",
        autoresize_bottom_margin: 4,
        autoresize_max_height: 360,
        min_height: 72,
        paste_data_images: false,
        relative_urls: false,
        convert_urls: true,
        content_style: socialBodyStyle,
        setup: registerVideo,
        ...socialChrome,
      };
    }
    if (compact) {
      return {
        height: 140,
        base_url: TINYMCE_BASE,
        suffix: ".min",
        menubar: false,
        branding: false,
        promotion: false,
        statusbar: false,
        plugins: ["lists", "link", "autoresize"].join(" "),
        toolbar: `undo redo | bold italic underline | bullist numlist | link | removeformat${videoToolbar}`,
        autoresize_bottom_margin: 8,
        autoresize_max_height: 280,
        min_height: 88,
        paste_data_images: false,
        relative_urls: false,
        convert_urls: true,
        content_style: lightBodyStyle,
        setup: registerVideo,
        ...videoSchema,
        ...darkChrome,
      };
    }
    return {
      height: 440,
      base_url: TINYMCE_BASE,
      suffix: ".min",
      menubar: false,
      branding: false,
      promotion: false,
      plugins: [
        "advlist",
        "autolink",
        "lists",
        "link",
        "charmap",
        "anchor",
        "searchreplace",
        "visualblocks",
        "code",
        "fullscreen",
        "insertdatetime",
        "table",
        "help",
        "wordcount",
        "autoresize",
      ].join(" "),
      toolbar:
        `undo redo | blocks | bold italic underline strikethrough | alignleft aligncenter alignright | bullist numlist outdent indent | link table | removeformat | code${videoToolbar}`,
      autoresize_bottom_margin: 16,
      min_height: 320,
      paste_data_images: false,
      relative_urls: false,
      convert_urls: true,
      content_style: darkSurface
        ? 'body { font-family: var(--font-barlow, Barlow, Helvetica, Arial, sans-serif); font-size: 14px; line-height: 1.5; background-color: #121212; color: #f5f5f5; } p { color: #f5f5f5; }'
        : 'body { font-family: var(--font-barlow, Barlow, Helvetica, Arial, sans-serif); font-size: 14px; line-height: 1.5; }',
      setup: registerVideo,
      ...videoSchema,
      ...darkChrome,
    };
  }, [compact, videoEmbedButton, darkSurface, isSocial, socialDark, onEditorInit]);

  const defaultHelper =
    "Self-hosted TinyMCE (GPL). HTML is saved to the database. For images, prefer HTTPS URLs.";

  return (
    <Box sx={{ mb: isSocial ? 0 : compact ? 1.25 : 2 }}>
      {label ? (
        <InputLabel
          shrink
          sx={{
            mb: 0.75,
            position: "relative",
            transform: "none",
            color: darkSurface || (isSocial && socialDark) ? "text.secondary" : "rgba(0,0,0,0.75)",
          }}
        >
          {label}
        </InputLabel>
      ) : null}
      <Box
        sx={
          isSocial && socialDark
            ? {
                borderRadius: 0,
                overflow: "hidden",
                border: "none",
                bgcolor: "transparent",
                "& .tox-tinymce": { border: "none !important", bgcolor: "transparent !important" },
                "& .tox .tox-editor-container": { bgcolor: "transparent !important" },
                "& .tox .tox-edit-area": { bgcolor: "transparent !important" },
                "& .tox .tox-editor-header": { display: "none !important" },
                "& .tox .tox-statusbar": { display: "none !important" },
              }
            : isSocial
              ? {
                  borderRadius: 0,
                  overflow: "hidden",
                  "& .tox-tinymce": { border: "none !important", boxShadow: "none !important" },
                  "& .tox .tox-editor-header": { display: "none !important" },
                  "& .tox .tox-statusbar": { display: "none !important" },
                }
              : darkSurface
                ? {
                    borderRadius: 1,
                    overflow: "hidden",
                    border: "1px solid rgba(255, 215, 0, 0.28)",
                    bgcolor: "rgba(0,0,0,0.55)",
                    "& .tox-tinymce": { border: "none !important" },
                    "& .tox .tox-editor-header": {
                      background: "rgba(0,0,0,0.65) !important",
                      borderBottom: "1px solid rgba(255,215,0,0.2) !important",
                    },
                    "& .tox .tox-toolbar__primary": {
                      background: "transparent !important",
                    },
                    "& .tox .tox-statusbar": {
                      background: "rgba(0,0,0,0.5) !important",
                      borderTop: "1px solid rgba(255,215,0,0.15) !important",
                    },
                  }
                : undefined
        }
      >
        <Editor
          tinymceScriptSrc={`${TINYMCE_BASE}/tinymce.min.js`}
          licenseKey="gpl"
          value={value}
          onEditorChange={onChange}
          disabled={disabled ?? false}
          init={init}
        />
      </Box>
      {showHelper ? (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: "block" }}>
          {helperText ?? defaultHelper}
        </Typography>
      ) : null}
    </Box>
  );
}
