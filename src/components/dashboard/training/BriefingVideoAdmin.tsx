"use client";

import { createClient } from "@/utils/supabase/client";
import { Alert, Box, Button, TextField, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function BriefingVideoAdmin({
  initialDbUrl,
  hasEnvFallback,
}: {
  initialDbUrl: string;
  hasEnvFallback: boolean;
}) {
  const router = useRouter();
  const [url, setUrl] = useState(initialDbUrl);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    setErr(null);
    setMsg(null);
    setBusy(true);
    try {
      const supabase = createClient();
      const trimmed = url.trim();
      const { error } = await supabase.from("training_settings").upsert(
        {
          id: 1,
          briefing_video_url: trimmed.length ? trimmed : null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
      if (error) {
        setErr(error.message);
        return;
      }
      setMsg("Saved. Refresh the page if the video does not update.");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Box sx={{ mt: 3, pt: 2, borderTop: "1px solid rgba(255,255,255,0.12)" }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "primary.main", mb: 0.5 }}>
        Mission Briefing video (admin)
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
        Shown to members on the Mission Briefing page. YouTube, Vimeo, or direct MP4/WebM URL. When empty,
        the app uses the training intro URL, then the welcome video.
        {hasEnvFallback ? " An env fallback is set at build time." : null}
      </Typography>
      <TextField
        label="Briefing video URL"
        fullWidth
        size="small"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://..."
        sx={{ mb: 1.5 }}
      />
      {err ? (
        <Alert severity="error" sx={{ mb: 1 }}>
          {err}
        </Alert>
      ) : null}
      {msg ? (
        <Alert severity="success" sx={{ mb: 1 }}>
          {msg}
        </Alert>
      ) : null}
      <Button variant="outlined" size="small" disabled={busy} onClick={() => void save()}>
        {busy ? "Saving…" : "Save briefing URL"}
      </Button>
    </Box>
  );
}
