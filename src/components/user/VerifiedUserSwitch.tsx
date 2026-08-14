"use client";

import {
  UNVERIFIED_CONFIRM_WORD,
  VERIFIED_CONFIRM_WORD,
} from "@/lib/user/verified-user";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";

type Props = {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  /** Shown in the confirm dialog, e.g. "Jane Doe - jane@example.com". */
  userLabel: string;
  /** Optional ISO timestamp when currently verified. */
  verifiedAt?: string | null;
};

/**
 * Super-admin switch for account verification (distinct from Local Leader Verified).
 * Toggling requires typing VERIFIED / UNVERIFIED in a confirm dialog.
 */
export function VerifiedUserSwitch({
  checked,
  onChange,
  disabled = false,
  userLabel,
  verifiedAt = null,
}: Props) {
  const [pending, setPending] = useState<boolean | null>(null);
  const [confirmText, setConfirmText] = useState("");

  const confirming = pending !== null;
  const confirmWord = pending === true ? VERIFIED_CONFIRM_WORD : UNVERIFIED_CONFIRM_WORD;
  const confirmReady = confirmText.trim().toUpperCase() === confirmWord;

  function closeDialog() {
    setPending(null);
    setConfirmText("");
  }

  function applyConfirm() {
    if (pending === null || !confirmReady) return;
    onChange(pending);
    closeDialog();
  }

  const verifiedAtLabel =
    checked && verifiedAt
      ? new Date(verifiedAt).toLocaleString(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : null;

  return (
    <>
      <Box>
        <FormControlLabel
          control={
            <Switch
              checked={checked}
              disabled={disabled}
              onChange={(_, next) => {
                setConfirmText("");
                setPending(next);
              }}
            />
          }
          label="Verified user"
        />
        {verifiedAtLabel ? (
          <Typography variant="caption" color="text.secondary" display="block" sx={{ ml: 6, mt: -0.5 }}>
            Verified {verifiedAtLabel}
          </Typography>
        ) : null}
      </Box>

      <Dialog open={confirming} onClose={closeDialog} maxWidth="xs" fullWidth>
        <DialogTitle>{pending ? "Verify user" : "Remove verification"}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {pending ? (
              <>
                Are you sure you want to mark{" "}
                <strong>{userLabel || "this user"}</strong> as a verified user?
              </>
            ) : (
              <>
                Are you sure you want to remove verified status from{" "}
                <strong>{userLabel || "this user"}</strong>?
              </>
            )}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Type <strong>{confirmWord}</strong> to confirm.
          </Typography>
          <TextField
            label="Confirmation"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={confirmWord}
            autoComplete="off"
            fullWidth
            size="small"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && confirmReady) applyConfirm();
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button
            variant="contained"
            color={pending ? "primary" : "warning"}
            disabled={!confirmReady}
            onClick={applyConfirm}
          >
            {pending ? "Verify" : "Unverify"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
