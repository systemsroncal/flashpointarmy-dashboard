"use client";

import { Box, InputLabel, Typography } from "@mui/material";
import dynamic from "next/dynamic";
import { useMemo } from "react";

const Editor = dynamic(() => import("@tinymce/tinymce-react").then((m) => m.Editor), {
  ssr: false,
  loading: () => (
    <Box
      sx={{
        minHeight: 400,
        bgcolor: "action.hover",
        borderRadius: 1,
        border: 1,
        borderColor: "divider",
      }}
    />
  ),
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
};

export function GatheringDescriptionEditor({
  value,
  onChange,
  disabled,
  label = "Description",
  showHelper = true,
}: Props) {
  const init = useMemo(
    () => ({
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
    }),
    []
  );

  return (
    <Box sx={{ mb: 2 }}>
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
          Self-hosted TinyMCE (GPL). HTML is saved to the database. For images, prefer HTTPS URLs.
        </Typography>
      ) : null}
    </Box>
  );
}
