"use client";

import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import {
  Button,
  CircularProgress,
  DialogActions,
  DialogContent,
  DialogTitle,
  Tooltip,
  Typography,
  type SxProps,
  type Theme,
} from "@mui/material";
import { useState } from "react";
import { MobilizeDialog } from "@/components/mobilize/MobilizeDialog";

export type MobilizeLeaveGroupButtonProps = {
  groupId: string;
  userId: string;
  groupName?: string;
  onLeft?: () => void | Promise<void>;
  appearance?: "hero" | "compact";
  disabled?: boolean;
  disabledReason?: string;
};

const COMPACT_SX: SxProps<Theme> = {
  textTransform: "none",
  fontWeight: 600,
  fontSize: "0.7rem",
  borderRadius: 99,
  minHeight: 0,
  py: 0,
  px: 1,
  borderColor: "rgba(211,47,47,0.45)",
  color: "#c62828",
  "&:hover": { borderColor: "#c62828", bgcolor: "rgba(211,47,47,0.06)" },
};

export function MobilizeLeaveGroupButton({
  groupId,
  userId,
  groupName,
  onLeft,
  appearance = "compact",
  disabled,
  disabledReason,
}: MobilizeLeaveGroupButtonProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmLeave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/mobilize/groups/${groupId}/members/${userId}`, {
        method: "DELETE",
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error || "Could not leave this group.");
      setConfirmOpen(false);
      await onLeft?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not leave this group.");
    } finally {
      setSaving(false);
    }
  }

  const buttonSx: SxProps<Theme> =
    appearance === "hero"
      ? {
          borderRadius: { xs: "10px", md: 99 },
          textTransform: "none",
          fontWeight: 700,
          fontSize: { xs: "0.8rem", md: "0.875rem" },
          minHeight: { xs: 40, md: 36 },
          flex: { xs: "1 1 0", md: "0 0 auto" },
          px: { xs: 1.25, md: 2 },
          color: "#b71c1c",
          borderColor: "rgba(211,47,47,0.4)",
          bgcolor: "#fff",
          "@media (max-width: 455px)": {
            fontSize: "0.72rem",
            px: 0.85,
            minHeight: 38,
            "& .MuiButton-startIcon": { mr: 0.5 },
            "& .MuiButton-startIcon > *:nth-of-type(1)": { fontSize: "1.05rem" },
          },
          "&:hover": {
            color: "#b71c1c",
            borderColor: "rgba(211,47,47,0.65)",
            bgcolor: "rgba(211,47,47,0.06)",
          },
        }
      : COMPACT_SX;

  const button = (
    <Button
      size="small"
      variant="outlined"
      color="error"
      disabled={disabled || saving}
      startIcon={
        saving ? (
          <CircularProgress size={appearance === "compact" ? 12 : 16} color="inherit" />
        ) : (
          <LogoutOutlinedIcon sx={{ fontSize: appearance === "compact" ? 14 : undefined }} />
        )
      }
      onClick={() => setConfirmOpen(true)}
      sx={buttonSx}
    >
      {appearance === "hero" ? "Leave" : "Leave group"}
    </Button>
  );

  return (
    <>
      {disabled && disabledReason ? (
        <Tooltip title={disabledReason}>
          <span>{button}</span>
        </Tooltip>
      ) : (
        button
      )}

      <MobilizeDialog
        open={confirmOpen}
        onClose={() => !saving && setConfirmOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Leave group?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {groupName ? (
              <>
                You will leave <strong>{groupName}</strong> and lose access to announcements, events,
                resources, and the member list.
              </>
            ) : (
              <>
                You will leave this group and lose access to announcements, events, resources, and the
                member list.
              </>
            )}
          </Typography>
          {error ? (
            <Typography variant="body2" color="error" sx={{ mt: 1.5 }}>
              {error}
            </Typography>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button color="error" variant="contained" onClick={() => void confirmLeave()} disabled={saving}>
            {saving ? "Leaving…" : "Leave group"}
          </Button>
        </DialogActions>
      </MobilizeDialog>
    </>
  );
}