"use client";

import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PublicOutlinedIcon from "@mui/icons-material/PublicOutlined";
import {
  Alert,
  Button,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";

type Props = {
  initialBio?: string;
  initialVisibility?: "public" | "private";
  onSaved?: () => void;
};

export function MobilizeSocialSettingsForm({
  initialBio = "",
  initialVisibility = "public",
  onSaved,
}: Props) {
  const [bioDraft, setBioDraft] = useState(initialBio);
  const [visibility, setVisibility] = useState<"public" | "private">(initialVisibility);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function save() {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch("/api/mobilize/social/profile-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio: bioDraft, profile_visibility: visibility }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Save failed.");
      setSuccess(true);
      onSaved?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Stack spacing={2.5} sx={{ maxWidth: 560 }}>
      <Typography variant="body2" sx={{ color: "rgba(0,0,0,0.65)" }}>
        Control who can see your profile posts and whether other members can message you.
      </Typography>

      {error ? <Alert severity="error">{error}</Alert> : null}
      {success ? <Alert severity="success">Settings saved.</Alert> : null}

      <FormControl>
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
          Profile visibility
        </Typography>
        <RadioGroup value={visibility} onChange={(_, v) => setVisibility(v as "public" | "private")}>
          <FormControlLabel
            value="public"
            control={<Radio size="small" />}
            label={
              <Stack direction="row" spacing={0.5} alignItems="center">
                <PublicOutlinedIcon fontSize="small" />
                <span>Public — anyone can view your posts and send messages</span>
              </Stack>
            }
          />
          <FormControlLabel
            value="private"
            control={<Radio size="small" />}
            label={
              <Stack direction="row" spacing={0.5} alignItems="center">
                <LockOutlinedIcon fontSize="small" />
                <span>Private — profile shell visible; posts hidden; no messages</span>
              </Stack>
            }
          />
        </RadioGroup>
      </FormControl>

      <TextField
        fullWidth
        multiline
        minRows={4}
        label="Bio"
        value={bioDraft}
        onChange={(e) => setBioDraft(e.target.value)}
        size="small"
      />

      <Button variant="contained" onClick={() => void save()} disabled={saving} sx={{ alignSelf: "flex-start" }}>
        {saving ? "Saving…" : "Save settings"}
      </Button>
    </Stack>
  );
}
