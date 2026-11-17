"use client";

import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import { Alert, Box, Button, CircularProgress } from "@mui/material";
import { useCallback, useEffect, useState } from "react";

type Status = {
  active: boolean;
  adminDisplayName?: string;
  targetDisplayName?: string;
};

export function ImpersonationBanner() {
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/impersonate/status");
      const json = (await res.json()) as Status & { error?: string };
      if (!res.ok) {
        setStatus({ active: false });
        return;
      }
      setStatus(json);
    } catch {
      setStatus({ active: false });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function endImpersonation() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/impersonate/end", { method: "POST" });
      const json = (await res.json()) as { ok?: boolean; redirectTo?: string; error?: string };
      if (!res.ok || !json.ok) {
        setError(json.error || "Could not restore your administrator session.");
        return;
      }
      window.location.assign(json.redirectTo || "/dashboard/community");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error.");
    } finally {
      setBusy(false);
    }
  }

  if (!status?.active) return null;

  return (
    <Box sx={{ mb: 2, flexShrink: 0 }}>
      <Alert
        severity="warning"
        icon={<AdminPanelSettingsIcon fontSize="inherit" />}
        sx={{
          alignItems: "center",
          bgcolor: "rgba(255, 193, 7, 0.12)",
          color: "#f5e6a8",
          border: "1px solid rgba(255, 193, 7, 0.35)",
          "& .MuiAlert-message": { flex: 1, width: "100%" },
        }}
        action={
          <Button
            color="inherit"
            size="small"
            variant="outlined"
            disabled={busy}
            onClick={() => void endImpersonation()}
            sx={{
              borderColor: "rgba(255,255,255,0.45)",
              color: "#fff",
              textTransform: "none",
              fontWeight: 700,
              whiteSpace: "nowrap",
            }}
          >
            {busy ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              `Regresar como ${status.adminDisplayName}`
            )}
          </Button>
        }
      >
        Estás conectado como <strong>{status.targetDisplayName}</strong>
        {error ? (
          <Box component="span" sx={{ display: "block", mt: 0.5, color: "#ffcdd2", fontSize: "0.8125rem" }}>
            {error}
          </Box>
        ) : null}
      </Alert>
    </Box>
  );
}