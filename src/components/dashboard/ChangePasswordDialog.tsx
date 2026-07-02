"use client";

import { PasswordTextField } from "@/components/auth/PasswordTextField";
import { createClient } from "@/utils/supabase/client";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

const MIN_PASSWORD_LENGTH = 8;

export function ChangePasswordDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPassword("");
    setConfirm("");
    setErr(null);
    setOk(false);
    setBusy(false);
  }, [open]);

  async function submit() {
    setErr(null);
    setOk(false);
    if (password.length < MIN_PASSWORD_LENGTH) {
      setErr(`Your new password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirm) {
      setErr("The two passwords do not match. Type the same password in both boxes.");
      return;
    }
    setBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password,
        data: { require_password_change: false },
      });
      if (error) {
        setErr(error.message || "Could not update password.");
        return;
      }
      setPassword("");
      setConfirm("");
      setOk(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ color: "primary.main", fontWeight: 800 }}>Change password</DialogTitle>
      <DialogContent>
        {ok ? (
          <Alert severity="success" sx={{ mb: 2 }}>
            Your password was updated. Use your new password the next time you sign in.
          </Alert>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Choose a new password for your account. Passwords are case-sensitive.
          </Typography>
        )}
        {err ? (
          <Typography color="error" sx={{ mb: 1.5 }}>
            {err}
          </Typography>
        ) : null}
        {!ok ? (
          <Box
            component="form"
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
          >
            <PasswordTextField
              id="change-password-new"
              label="New password"
              autoComplete="new-password"
              value={password}
              onChange={setPassword}
            />
            <PasswordTextField
              id="change-password-confirm"
              label="Confirm new password"
              autoComplete="new-password"
              value={confirm}
              onChange={setConfirm}
            />
            <DialogActions sx={{ px: 0, pt: 1 }}>
              <Button onClick={onClose} disabled={busy}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={busy}>
                {busy ? "Saving…" : "Save password"}
              </Button>
            </DialogActions>
          </Box>
        ) : (
          <DialogActions sx={{ px: 0, pt: 1 }}>
            <Button variant="contained" onClick={onClose}>
              Done
            </Button>
          </DialogActions>
        )}
      </DialogContent>
    </Dialog>
  );
}
