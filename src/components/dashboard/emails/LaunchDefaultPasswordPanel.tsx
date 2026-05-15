"use client";

import { BULK_DEFAULT_PASSWORD_CONFIRM_PHRASE } from "@/lib/admin/bulk-default-password-phrase";
import { DEFAULT_EXTERNAL_USER_PASSWORD } from "@/lib/auth/default-external-user-password";
import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";

type PreviewCounts = {
  neverSignedInNonAdmin: number;
  nonAdmin: number;
  skippedAdmin: number;
};

export function LaunchDefaultPasswordPanel() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmPhrase, setConfirmPhrase] = useState("");
  const [onlyNeverSignedIn, setOnlyNeverSignedIn] = useState(true);
  const [preview, setPreview] = useState<PreviewCounts | null>(null);
  const [previewErr, setPreviewErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [previewBusy, setPreviewBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const loadPreview = useCallback(async () => {
    setPreviewBusy(true);
    setPreviewErr(null);
    try {
      const res = await fetch("/api/admin/bulk-default-password", { cache: "no-store" });
      const data = (await res.json()) as PreviewCounts & { error?: string };
      if (!res.ok) {
        setPreview(null);
        setPreviewErr(data.error || "Could not load counts.");
        return;
      }
      setPreview(data);
    } catch {
      setPreviewErr("Could not load counts.");
      setPreview(null);
    } finally {
      setPreviewBusy(false);
    }
  }, []);

  useEffect(() => {
    void loadPreview();
  }, [loadPreview]);

  async function submit() {
    setErr(null);
    setMsg(null);
    if (password.length < 8) {
      setErr("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setErr("Password and confirmation do not match.");
      return;
    }
    if (confirmPhrase.trim() !== BULK_DEFAULT_PASSWORD_CONFIRM_PHRASE) {
      setErr(`Confirmation phrase must match exactly: ${BULK_DEFAULT_PASSWORD_CONFIRM_PHRASE}`);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/bulk-default-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password,
          confirmPassword,
          confirmPhrase: confirmPhrase.trim(),
          onlyNeverSignedIn,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        updated?: number;
        skippedAdmin?: number;
        skippedSignedIn?: number;
        failed?: number;
        onlyNeverSignedIn?: boolean;
      };
      if (!res.ok) {
        setErr(data.error || "Request failed.");
        return;
      }
      const scope = data.onlyNeverSignedIn
        ? "never signed in"
        : "all non-admin users";
      setMsg(
        `Done (${scope}). Passwords updated: ${data.updated ?? 0}. Skipped (admin): ${data.skippedAdmin ?? 0}. Skipped (already signed in): ${data.skippedSignedIn ?? 0}. Failed: ${data.failed ?? 0}.`
      );
      setPassword("");
      setConfirmPassword("");
      setConfirmPhrase("");
      void loadPreview();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        Sets the <strong>same login password</strong> for users who are not Administrator or Super
        administrator. Each affected user is flagged to{" "}
        <strong>change their password on first sign-in</strong>. Recommended for launch: enable{" "}
        <strong>Only users who have never signed in</strong> so people who already chose a password
        are not reset.
      </Typography>
      <Alert severity="info">
        Default import / Fluent Forms password is <strong>{DEFAULT_EXTERNAL_USER_PASSWORD}</strong>.
        &quot;Invalid credentials&quot; often means the auth password was never set to that value — use
        this tool to align passwords for accounts that have not logged in yet.
      </Alert>
      <Alert severity="warning">
        Communicate the temporary password securely. Anyone with that password can sign in until they
        change it.
      </Alert>

      {preview ? (
        <Typography variant="body2" color="text.secondary">
          Preview: <strong>{preview.neverSignedInNonAdmin}</strong> non-admin users have never signed
          in ({preview.nonAdmin} non-admin total, {preview.skippedAdmin} admins excluded).
        </Typography>
      ) : null}
      {previewErr ? <Alert severity="warning">{previewErr}</Alert> : null}
      <Button size="small" variant="outlined" disabled={previewBusy} onClick={() => void loadPreview()}>
        {previewBusy ? "Refreshing counts…" : "Refresh counts"}
      </Button>

      <FormControlLabel
        control={
          <Switch
            checked={onlyNeverSignedIn}
            onChange={(e) => setOnlyNeverSignedIn(e.target.checked)}
          />
        }
        label="Only users who have never signed in (no last login)"
      />

      <TextField
        label="New default password"
        type="password"
        autoComplete="new-password"
        fullWidth
        placeholder={DEFAULT_EXTERNAL_USER_PASSWORD}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <TextField
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        fullWidth
        placeholder={DEFAULT_EXTERNAL_USER_PASSWORD}
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />
      <Box>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
          Type this phrase to confirm (copy allowed):
        </Typography>
        <Typography variant="body2" sx={{ fontFamily: "monospace", mb: 1 }}>
          {BULK_DEFAULT_PASSWORD_CONFIRM_PHRASE}
        </Typography>
        <TextField
          label="Confirmation phrase"
          fullWidth
          value={confirmPhrase}
          onChange={(e) => setConfirmPhrase(e.target.value)}
          placeholder={BULK_DEFAULT_PASSWORD_CONFIRM_PHRASE}
        />
      </Box>
      {err ? <Alert severity="error">{err}</Alert> : null}
      {msg ? <Alert severity="success">{msg}</Alert> : null}
      <Button variant="contained" color="warning" disabled={busy} onClick={() => void submit()}>
        {busy
          ? "Applying…"
          : onlyNeverSignedIn
            ? "Reset password for users who never signed in"
            : "Apply default password to all non-admin users"}
      </Button>
    </Stack>
  );
}
