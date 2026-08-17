"use client";

import { resolveVideoForPlyr } from "@/lib/media/resolve-plyr-video";
import { mobilizePanelTheme } from "@/theme/mobilize-content-theme";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  ThemeProvider,
  Typography,
} from "@mui/material";
import { useEffect, useState, type ReactElement } from "react";

type Props = {
  open: boolean;
  /** Empty when adding a new video, current URL when editing an existing one. */
  initialUrl?: string;
  onClose: () => void;
  onSubmit: (url: string) => void;
  onRemove?: () => void;
};

export function VideoEmbedDialog({
  open,
  initialUrl = "",
  onClose,
  onSubmit,
  onRemove,
}: Props): ReactElement {
  const [url, setUrl] = useState(initialUrl);
  const [error, setError] = useState<string | null>(null);
  const editing = Boolean(initialUrl);

  useEffect(() => {
    if (open) {
      setUrl(initialUrl);
      setError(null);
    }
  }, [open, initialUrl]);

  function submit() {
    const trimmed = url.trim();
    if (!trimmed) {
      setError("Paste a video link first.");
      return;
    }
    if (resolveVideoForPlyr(trimmed).kind === "none") {
      setError("That link doesn't look like a video. Try a YouTube, Vimeo or .mp4 link.");
      return;
    }
    onSubmit(trimmed);
  }

  return (
    <ThemeProvider theme={mobilizePanelTheme}>
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>{editing ? "Change video" : "Add a video"}</DialogTitle>
        <DialogContent>
          <Stack spacing={1.25} sx={{ pt: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              Paste a link from YouTube, Vimeo, or a direct video file (.mp4, .webm).
            </Typography>
            <TextField
              autoFocus
              fullWidth
              size="small"
              label="Video link"
              placeholder="https://www.youtube.com/watch?v=..."
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (error) setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submit();
                }
              }}
              error={Boolean(error)}
              helperText={error ?? " "}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          {editing && onRemove ? (
            <Button color="error" onClick={onRemove} sx={{ textTransform: "none", mr: "auto" }}>
              Remove video
            </Button>
          ) : null}
          <Button onClick={onClose} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={submit} sx={{ textTransform: "none", fontWeight: 700 }}>
            {editing ? "Save" : "Add video"}
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}
