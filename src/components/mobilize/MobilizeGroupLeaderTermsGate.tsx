"use client";

import { MobilizeDialog } from "@/components/mobilize/MobilizeDialog";
import {
  MOBILIZE_GROUP_LEADER_TERMS_BODY,
  MOBILIZE_GROUP_LEADER_TERMS_CODE_OF_CONDUCT_URL,
  MOBILIZE_GROUP_LEADER_TERMS_TITLE,
} from "@/lib/mobilize/group-leader-terms";
import { flashpointYellow } from "@/theme/tokens";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Link,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";

type PendingGroup = { group_id: string; group_name: string };

export function MobilizeGroupLeaderTermsGate() {
  const [pending, setPending] = useState<PendingGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/mobilize/leader-terms/pending");
      const json = (await res.json()) as { pending?: PendingGroup[]; error?: string };
      if (!res.ok) throw new Error(json.error || "Could not load leader terms.");
      setPending(json.pending ?? []);
      setAgreed(false);
      setError(null);
    } catch (e) {
      setPending([]);
      setError(e instanceof Error ? e.message : "Could not load leader terms.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [load]);

  const open = !loading && pending.length > 0;

  async function accept() {
    if (!agreed || !pending.length) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/mobilize/leader-terms/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ group_ids: pending.map((p) => p.group_id) }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) throw new Error(json.error || "Could not save your acceptance.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save your acceptance.");
    } finally {
      setBusy(false);
    }
  }

  if (!open && !loading && !error) return null;

  return (
    <MobilizeDialog
      open={open}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown
      onClose={(_, reason) => {
        if (reason === "backdropClick") return;
      }}
    >
      <DialogTitle sx={{ fontWeight: 800 }}>{MOBILIZE_GROUP_LEADER_TERMS_TITLE}</DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <Box>
            {pending.length > 1 ? (
              <Typography variant="body2" sx={{ mb: 1.5 }}>
                You have been promoted to leader in the following groups. Please review and accept the leader
                terms to continue.
              </Typography>
            ) : pending.length === 1 ? (
              <Typography variant="body2" sx={{ mb: 1.5 }}>
                You have been promoted to leader in{" "}
                <strong>{pending[0]?.group_name ?? "this group"}</strong>. Please review and accept the leader
                terms to continue.
              </Typography>
            ) : null}
            {pending.length > 1 ? (
              <List dense sx={{ mb: 1.5, bgcolor: "rgba(0,0,0,0.03)", borderRadius: 1 }}>
                {pending.map((g) => (
                  <ListItem key={g.group_id} disableGutters sx={{ py: 0.25, px: 1.5 }}>
                    <ListItemText primary={g.group_name} primaryTypographyProps={{ variant: "body2", fontWeight: 600 }} />
                  </ListItem>
                ))}
              </List>
            ) : null}
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, lineHeight: 1.55 }}>
              {MOBILIZE_GROUP_LEADER_TERMS_BODY}{" "}
              <Link
                href={MOBILIZE_GROUP_LEADER_TERMS_CODE_OF_CONDUCT_URL}
                target="_blank"
                rel="noopener noreferrer"
                underline="always"
                sx={{ fontWeight: 600 }}
              >
                FPA Code of Conduct (PDF)
              </Link>
            </Typography>
            <FormControlLabel
              control={
                <Checkbox checked={agreed} onChange={(e) => setAgreed(e.target.checked)} disabled={busy} />
              }
              label={
                <Typography variant="body2">
                  I have read and agree to these leader responsibilities and the FPA Code of Conduct.
                </Typography>
              }
            />
            {error ? (
              <Alert severity="error" sx={{ mt: 1.5 }}>
                {error}
              </Alert>
            ) : null}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 2, py: 1.5 }}>
        <Button
          variant="contained"
          disabled={!agreed || busy || loading || !pending.length}
          onClick={() => void accept()}
          sx={{
            textTransform: "none",
            fontWeight: 700,
            bgcolor: flashpointYellow,
            color: "#000",
            "&:hover": { bgcolor: "#e6c200" },
          }}
        >
          {busy ? <CircularProgress size={22} sx={{ color: "#000" }} /> : "I agree and continue"}
        </Button>
      </DialogActions>
    </MobilizeDialog>
  );
}