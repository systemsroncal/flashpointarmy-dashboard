"use client";

import { PasswordTextField } from "@/components/auth/PasswordTextField";
import { getClientAuthUser } from "@/utils/supabase/client-auth";
import { createClient } from "@/utils/supabase/client";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";

const MIN_PASSWORD_LENGTH = 8;

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
    const { user } = await getClientAuthUser(supabase);
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
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ color: "primary.main", fontWeight: 800 }}>Choose your own password</DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          You signed in with a <strong>temporary password</strong>. For security, pick a new password only you know
          before using the dashboard.
        </Alert>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Tips:
        </Typography>
        <List dense disablePadding sx={{ mb: 2 }}>
          <ListItem disableGutters sx={{ py: 0.25 }}>
            <ListItemText
              primary={`Use at least ${MIN_PASSWORD_LENGTH} characters.`}
              primaryTypographyProps={{ variant: "body2", color: "text.secondary" }}
            />
          </ListItem>
          <ListItem disableGutters sx={{ py: 0.25 }}>
            <ListItemText
              primary="Your new password is case-sensitive — uppercase and lowercase letters must match when you sign in later."
              primaryTypographyProps={{ variant: "body2", color: "text.secondary" }}
            />
          </ListItem>
          <ListItem disableGutters sx={{ py: 0.25 }}>
            <ListItemText
              primary="Use the eye icon on each field to check what you typed before saving."
              primaryTypographyProps={{ variant: "body2", color: "text.secondary" }}
            />
          </ListItem>
        </List>
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
          <PasswordTextField
            id="first-login-password"
            label="New password"
            autoComplete="new-password"
            value={password}
            onChange={setPassword}
          />
          <PasswordTextField
            id="first-login-confirm"
            label="Confirm new password"
            autoComplete="new-password"
            value={confirm}
            onChange={setConfirm}
          />
          <Button type="submit" variant="contained" disabled={busy}>
            {busy ? "Saving…" : "Save and continue"}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
