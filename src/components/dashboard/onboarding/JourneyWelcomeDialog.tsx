"use client";

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import { useCallback, useState } from "react";

type Props = {
  open: boolean;
  kind: "mission_briefing" | "missions";
  title: string;
  paragraphs?: string[];
  contentHtml?: string;
  maxWidthPx?: number;
  ctaLabel?: string;
  onDismissed: () => void;
};

const RICH_CONTENT_SX = {
  color: "rgba(255,255,255,0.85)",
  lineHeight: 1.7,
  fontSize: "0.95rem",
  "& p": { m: 0, mb: 1.5 },
  "& p:last-child": { mb: 0 },
  "& h3": {
    m: 0,
    mt: 2,
    mb: 1.25,
    fontWeight: 700,
    fontSize: "1rem",
    color: "primary.main",
  },
  "& strong": { color: "#fff", fontWeight: 700 },
} as const;

export function JourneyWelcomeDialog({
  open,
  kind,
  title,
  paragraphs = [],
  contentHtml,
  maxWidthPx,
  ctaLabel = "Begin",
  onDismissed,
}: Props) {
  const [busy, setBusy] = useState(false);

  const dismiss = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      await fetch("/api/onboarding/journey-welcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind }),
      });
    } catch {
      /* still close locally */
    } finally {
      setBusy(false);
      onDismissed();
    }
  }, [busy, kind, onDismissed]);

  return (
    <Dialog
      open={open}
      onClose={() => void dismiss()}
      maxWidth={maxWidthPx ? false : "sm"}
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: "rgba(22,22,26,0.98)",
          border: "1px solid rgba(255,215,0,0.35)",
          ...(maxWidthPx ? { width: "100%", maxWidth: maxWidthPx } : {}),
        },
      }}
    >
      <DialogTitle sx={{ color: "primary.main", fontWeight: 800, lineHeight: 1.35, pr: 3 }}>
        {title}
      </DialogTitle>
      <DialogContent>
        {contentHtml ? (
          <Box sx={RICH_CONTENT_SX} dangerouslySetInnerHTML={{ __html: contentHtml }} />
        ) : (
          paragraphs.map((p) => (
            <Typography
              key={p.slice(0, 24)}
              sx={{ color: "rgba(255,255,255,0.85)", mb: 1.5, lineHeight: 1.7 }}
            >
              {p}
            </Typography>
          ))
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={() => void dismiss()} disabled={busy} color="inherit">
          Close
        </Button>
        <Button variant="contained" onClick={() => void dismiss()} disabled={busy}>
          {busy ? "Saving…" : ctaLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
