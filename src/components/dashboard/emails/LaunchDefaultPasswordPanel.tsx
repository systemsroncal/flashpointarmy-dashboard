"use client";

import { BULK_DEFAULT_PASSWORD_CONFIRM_PHRASE } from "@/lib/admin/bulk-default-password-phrase";
import { DEFAULT_EXTERNAL_USER_PASSWORD } from "@/lib/auth/default-external-user-password";
import {
  Alert,
  Box,
  Button,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";

export function LaunchDefaultPasswordPanel() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmPhrase, setConfirmPhrase] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

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
        body: JSON.stringify({ password, confirmPassword, confirmPhrase: confirmPhrase.trim() }),
      });
      const data = (await res.json()) as {
        error?: string;
        updated?: number;
        skippedAdmin?: number;
        failed?: number;
      };
      if (!res.ok) {
        setErr(data.error || "Request failed.");
        return;
      }
      setMsg(
        `Done. Passwords updated: ${data.updated ?? 0}. Skipped (admin / super admin): ${data.skippedAdmin ?? 0}. Failed: ${data.failed ?? 0}.`
      );
      setPassword("");
      setConfirmPassword("");
      setConfirmPhrase("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        Sets the <strong>same login password</strong> for every user who does <strong>not</strong> have the
        Administrator or Super administrator role. Each affected user is flagged to{" "}
        <strong>change their password on first sign-in</strong>. Use this for launch when accounts were
        created but users have not logged in yet. Administrators and super administrators are never
        modified.
      </Typography>
      <Alert severity="warning">
        This is irreversible from the UI: you must communicate the temporary password securely (for example
        via your newsletter). Anyone with that password can sign in until they change it.
      </Alert>
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
        {busy ? "Applying…" : "Apply default password to all non-admin users"}
      </Button>
    </Stack>
  );
}
