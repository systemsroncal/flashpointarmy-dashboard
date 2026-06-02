"use client";

import { exportGrapesEmailHtml } from "@/lib/broadcast/email-template-html";
import { Box } from "@mui/material";
import { useEffect, useRef } from "react";
import "grapesjs/dist/css/grapes.min.css";

type GrapesEditor = ReturnType<typeof import("grapesjs").default.init>;

type EmailTemplateGrapesEditorProps = {
  initialHtml: string;
  onHtmlChange: (html: string) => void;
  /** Bump when switching from code → visual to remount with latest HTML. */
  mountKey: number;
};

export function EmailTemplateGrapesEditor({
  initialHtml,
  onHtmlChange,
  mountKey,
}: EmailTemplateGrapesEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onHtmlChangeRef = useRef(onHtmlChange);
  onHtmlChangeRef.current = onHtmlChange;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let editor: GrapesEditor | null = null;
    let cancelled = false;

    void (async () => {
      const grapesjs = (await import("grapesjs")).default;
      const preset = (await import("grapesjs-preset-newsletter")).default;

      if (cancelled || !containerRef.current) return;

      editor = grapesjs.init({
        container,
        height: "100%",
        width: "auto",
        fromElement: false,
        storageManager: false,
        noticeOnUnload: false,
        plugins: [preset],
        pluginsOpts: {
          "grapesjs-preset-newsletter": {
            modalTitleImport: "Import template",
            modalLabelImport: "Paste HTML",
          },
        },
      });

      const html = initialHtml.trim();
      if (html) {
        try {
          editor.setComponents(html);
        } catch {
          editor.setComponents(`<div>${html}</div>`);
        }
      }

      const sync = () => {
        if (!editor) return;
        onHtmlChangeRef.current(
          exportGrapesEmailHtml(
            editor as {
              getHtml: () => string;
              getCss: () => string;
              runCommand: (cmd: string, opts?: object) => unknown;
            }
          )
        );
      };

      editor.on("update", sync);
      editor.on("component:add", sync);
      editor.on("component:remove", sync);
      sync();
    })();

    return () => {
      cancelled = true;
      editor?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- remount only via mountKey
  }, [mountKey]);

  return (
    <Box
      ref={containerRef}
      sx={{
        flex: 1,
        minHeight: 420,
        height: "100%",
        border: "1px solid rgba(255,215,0,0.14)",
        borderRadius: 1,
        overflow: "hidden",
        bgcolor: "#1e1e22",
        "& .gjs-one-bg": { backgroundColor: "#25252b" },
        "& .gjs-two-color": { color: "rgba(255,255,255,0.85)" },
        "& .gjs-three-bg": { backgroundColor: "#1a1a1e" },
        "& .gjs-four-color": { color: "rgba(255,255,255,0.55)" },
        "& .gjs-pn-panel": { borderColor: "rgba(255,255,255,0.08)" },
      }}
    />
  );
}
