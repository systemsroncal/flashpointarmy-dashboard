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
      setErr("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setErr("La contraseña y la confirmación no coinciden.");
      return;
    }
    if (confirmPhrase.trim() !== BULK_DEFAULT_PASSWORD_CONFIRM_PHRASE) {
      setErr(`La frase de confirmación debe coincidir exactamente: ${BULK_DEFAULT_PASSWORD_CONFIRM_PHRASE}`);
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
        setErr(data.error || "La solicitud falló.");
        return;
      }
      setMsg(
        `Listo. Contraseñas actualizadas: ${data.updated ?? 0}. Omitidos (admin / super admin): ${data.skippedAdmin ?? 0}. Fallidos: ${data.failed ?? 0}.`
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
        Establece la <strong>misma contraseña de acceso</strong> para todos los usuarios que{" "}
        <strong>no</strong> tienen rol de administrador ni super administrador. A cada usuario afectado se le marca{" "}
        <strong>cambiar la contraseña en el primer inicio de sesión</strong>. Úsalo en lanzamientos cuando las
        cuentas ya existen pero aún no han entrado. Los administradores y super administradores nunca se modifican.
      </Typography>
      <Alert severity="warning">
        Desde esta interfaz no hay vuelta atrás: debes comunicar la contraseña temporal por un canal seguro (por
        ejemplo tu boletín). Cualquiera con esa contraseña puede iniciar sesión hasta que la cambien.
      </Alert>
      <TextField
        label="Nueva contraseña por defecto"
        type="password"
        autoComplete="new-password"
        fullWidth
        placeholder={DEFAULT_EXTERNAL_USER_PASSWORD}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <TextField
        label="Confirmar contraseña"
        type="password"
        autoComplete="new-password"
        fullWidth
        placeholder={DEFAULT_EXTERNAL_USER_PASSWORD}
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />
      <Box>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
          Escribe esta frase para confirmar (puedes copiarla):
        </Typography>
        <Typography variant="body2" sx={{ fontFamily: "monospace", mb: 1 }}>
          {BULK_DEFAULT_PASSWORD_CONFIRM_PHRASE}
        </Typography>
        <TextField
          label="Frase de confirmación"
          fullWidth
          value={confirmPhrase}
          onChange={(e) => setConfirmPhrase(e.target.value)}
          placeholder={BULK_DEFAULT_PASSWORD_CONFIRM_PHRASE}
        />
      </Box>
      {err ? <Alert severity="error">{err}</Alert> : null}
      {msg ? <Alert severity="success">{msg}</Alert> : null}
      <Button variant="contained" color="warning" disabled={busy} onClick={() => void submit()}>
        {busy ? "Aplicando…" : "Aplicar contraseña por defecto a todos los no administradores"}
      </Button>
    </Stack>
  );
}
