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
import { useCallback, useEffect, useMemo, useState } from "react";

export function FirstLoginPasswordGate() {
  const supabase = useMemo(() => createClient(), []);
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const refresh = useCallback(async () => {
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
    void refresh();
  }, [refresh]);

  async function submit() {
    setErr(null);
    if (password.length < 8) {
      setErr("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setErr("Las contraseñas no coinciden.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password,
        data: { require_password_change: false },
      });
      if (error) {
        setErr(error.message || "No se pudo actualizar la contraseña.");
        return;
      }
      setPassword("");
      setConfirm("");
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} disableEscapeKeyDown hideBackdrop={false} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ color: "primary.main", fontWeight: 800 }}>
        Actualiza tu contraseña
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Por seguridad, debes elegir una contraseña nueva antes de continuar.
        </Typography>
        {err ? (
          <Typography color="error" sx={{ mb: 1 }}>
            {err}
          </Typography>
        ) : null}
        <Box component="form" sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="Nueva contraseña"
            type="password"
            autoComplete="new-password"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <TextField
            label="Confirmar contraseña"
            type="password"
            autoComplete="new-password"
            fullWidth
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          <Button variant="contained" disabled={busy} onClick={() => void submit()}>
            {busy ? "Guardando…" : "Guardar contraseña"}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
