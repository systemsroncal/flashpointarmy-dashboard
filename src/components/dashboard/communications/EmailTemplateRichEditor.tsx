"use client";

import { Box, Chip, Paper, Stack, Typography } from "@mui/material";
import dynamic from "next/dynamic";
import { useCallback, useMemo, useRef } from "react";

const TINYMCE_BASE = "/tinymce";

const INSERT_SHORTCODES = [
  { label: "First name", code: "{user_first_name}" },
  { label: "Full name", code: "{user_fullname}" },
  { label: "Email", code: "{user_email}" },
  { label: "Chapter", code: "{chapter_name}" },
] as const;

function EditorLoading() {
  return (
    <Box
      sx={{
        height: 420,
        bgcolor: "rgba(0,0,0,0.35)",
        borderRadius: 1,
        border: "1px solid rgba(255,215,0,0.14)",
      }}
    />
  );
}

const Editor = dynamic(() => import("@tinymce/tinymce-react").then((m) => m.Editor), {
  ssr: false,
  loading: () => <EditorLoading />,
});

type TinyEditor = {
  insertContent: (html: string) => void;
  focus: () => void;
};

export function EmailTemplateRichEditor({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
}) {
  const editorRef = useRef<TinyEditor | null>(null);

  const init = useMemo(
    () => ({
      height: 420,
      base_url: TINYMCE_BASE,
      suffix: ".min",
      menubar: false,
      branding: false,
      promotion: false,
      statusbar: true,
      resize: false,
      plugins: ["lists", "link", "autolink"].join(" "),
      toolbar:
        "undo redo | blocks | bold italic underline | alignleft aligncenter alignright | bullist numlist | link | removeformat",
      block_formats: "Paragraph=p; Heading 1=h1; Heading 2=h2; Heading 3=h3",
      paste_data_images: false,
      relative_urls: false,
      convert_urls: true,
      content_style:
        "body { font-family: Arial, Helvetica, sans-serif; font-size: 16px; line-height: 1.55; margin: 12px; color: #222; } p { margin: 0 0 1em 0; }",
      setup: (ed: TinyEditor) => {
        editorRef.current = ed;
      },
    }),
    []
  );

  const insertShortcode = useCallback((code: string) => {
    const ed = editorRef.current;
    if (ed) {
      ed.insertContent(code);
      ed.focus();
      return;
    }
    onChange(`${value} ${code}`);
  }, [onChange, value]);

  return (
    <Stack spacing={1.5} sx={{ width: "100%" }}>
      <Paper
        variant="outlined"
        sx={{
          p: 1.5,
          bgcolor: "rgba(0,0,0,0.25)",
          borderColor: "rgba(255,215,0,0.12)",
        }}
      >
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Click to insert a personalized field into your message:
        </Typography>
        <Stack direction="row" flexWrap="wrap" gap={0.75}>
          {INSERT_SHORTCODES.map(({ label, code }) => (
            <Chip
              key={code}
              label={label}
              size="medium"
              clickable
              disabled={disabled}
              onClick={() => insertShortcode(code)}
              sx={{ fontWeight: 600 }}
            />
          ))}
        </Stack>
      </Paper>

      <Box
        sx={{
          width: "100%",
          height: 420,
          borderRadius: 1,
          overflow: "hidden",
          border: "1px solid rgba(255,215,0,0.18)",
          bgcolor: "rgba(0,0,0,0.35)",
          "& .tox-tinymce": {
            border: "none !important",
            height: "420px !important",
          },
          "& .tox .tox-edit-area__iframe": {
            minHeight: "380px !important",
          },
        }}
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

      <Paper
        sx={{
          p: 2,
          bgcolor: "#f7f7f7",
          color: "#1a1a1a",
          borderRadius: 1,
          border: "1px solid rgba(255,255,255,0.12)",
          maxHeight: 220,
          overflow: "auto",
        }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
          Preview (how your email may look)
        </Typography>
        <Box
          sx={{ fontSize: "1rem", lineHeight: 1.55, "& p": { margin: "0 0 0.75em 0" } }}
          dangerouslySetInnerHTML={{
            __html: value.trim() || "<p><em>Your message will appear here.</em></p>",
          }}
        />
      </Paper>

      <Typography variant="caption" color="text.secondary">
        Type like in a word processor: use bold, lists, and headings. For advanced changes, switch to
        HTML code.
      </Typography>
    </Stack>
  );
}
