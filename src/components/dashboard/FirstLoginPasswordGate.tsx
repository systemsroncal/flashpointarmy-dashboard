"use client";

import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";
import { createClient } from "@/utils/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";

export function FirstLoginPasswordGate() {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    try {
      setSupabase(createClient());
    } catch (e) {
      console.error(
        "[FirstLoginPasswordGate] Supabase browser client failed (check NEXT_PUBLIC_* in .env.production and rebuild).",
        e
      );
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!supabase) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setOpen(false);
      return;
    }
    const required = user.user_metadata?.require_password_change === true;
    setOpen(required);
  }, [supabase]);

  useEffect(() => {
    if (!supabase) return;
    void refresh();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void refresh();
    });
    return () => subscription.unsubscribe();
  }, [refresh, supabase]);

  async function submit() {
    if (!supabase) return;
    setErr(null);
    if (password.length < 8) {
      setErr("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setErr("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
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
      setOpen(false);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      disableEscapeKeyDown
      onClose={(_, reason) => {
        if (reason === "backdropClick") return;
      }}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle sx={{ color: "primary.main", fontWeight: 800 }}>Change your password</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          You signed in with the temporary organization password. Choose a new password (at least 8
          characters) before using the rest of the dashboard.
        </Typography>
        {err ? (
          <Typography color="error" sx={{ mb: 1 }}>
            {err}
          </Typography>
        ) : null}
        <Box
          component="form"
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <TextField
            label="New password"
            type="password"
            autoComplete="new-password"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <TextField
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            fullWidth
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          <Button type="submit" variant="contained" disabled={busy}>
            {busy ? "Saving…" : "Save password"}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
