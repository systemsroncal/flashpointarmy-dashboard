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
  /** Shorter toolbar and height (e.g. quiz fields). Sin botón «código fuente» en la barra. */
  compact?: boolean;
  /** Texto de ayuda bajo el editor si `showHelper` es true (sustituye el texto por defecto en inglés). */
  helperText?: string;
};

export function GatheringDescriptionEditor({
  value,
  onChange,
  disabled,
  label = "Description",
  showHelper = true,
  compact = false,
  helperText,
}: Props) {
  const init = useMemo(() => {
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
        toolbar: "undo redo | bold italic underline | bullist numlist | link | removeformat",
        autoresize_bottom_margin: 8,
        autoresize_max_height: 280,
        min_height: 88,
        paste_data_images: false,
        relative_urls: false,
        convert_urls: true,
        content_style:
          'body { font-family: var(--font-barlow, Barlow, Helvetica, Arial, sans-serif); font-size: 14px; line-height: 1.45; margin: 6px; } p { margin: 0 0 0.5em 0; } p:last-child { margin-bottom: 0; }',
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
        "undo redo | blocks | bold italic underline strikethrough | alignleft aligncenter alignright | bullist numlist outdent indent | link table | removeformat | code",
      autoresize_bottom_margin: 16,
      min_height: 320,
      paste_data_images: false,
      relative_urls: false,
      convert_urls: true,
      content_style:
        'body { font-family: var(--font-barlow, Barlow, Helvetica, Arial, sans-serif); font-size: 14px; line-height: 1.5; }',
    };
  }, [compact]);

  const defaultHelper =
    "Self-hosted TinyMCE (GPL). HTML is saved to the database. For images, prefer HTTPS URLs.";

  return (
    <Box sx={{ mb: compact ? 1.25 : 2 }}>
      <InputLabel shrink sx={{ mb: 0.75, position: "relative", transform: "none" }}>
        {label}
      </InputLabel>
      <Editor
        tinymceScriptSrc={`${TINYMCE_BASE}/tinymce.min.js`}
        licenseKey="gpl"
        value={value}
        onEditorChange={onChange}
        disabled={disabled ?? false}
        init={init}
      />
      {showHelper ? (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: "block" }}>
          {helperText ?? defaultHelper}
        </Typography>
      ) : null}
    </Box>
  );
}
