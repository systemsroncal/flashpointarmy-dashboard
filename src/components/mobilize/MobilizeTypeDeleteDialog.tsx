"use client";

import {
  MOBILIZE_DELETE_CONFIRM_WORD,
} from "@/lib/mobilize/mobilize-content-access";
import { MobilizeDialog } from "@/components/mobilize/MobilizeDialog";
import {
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState, type ReactNode } from "react";

type Props = {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmWord?: string;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function MobilizeTypeDeleteDialog({
  open,
  title,
  description,
  confirmWord = MOBILIZE_DELETE_CONFIRM_WORD,
  loading = false,
  onClose,
  onConfirm,
}: Props) {
  const [typed, setTyped] = useState("");

  useEffect(() => {
    if (!open) setTyped("");
  }, [open]);

  const confirmed = typed === confirmWord;

  return (
    <MobilizeDialog open={open} onClose={() => !loading && onClose()} fullWidth maxWidth="xs">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {typeof description === "string" ? (
          <Typography variant="body2" sx={{ mb: 2 }}>
            {description}
          </Typography>
        ) : (
          <BoxDescription sx={{ mb: 2 }}>{description}</BoxDescription>
        )}
        <Typography variant="body2" sx={{ mb: 1 }}>
          Type <strong>{confirmWord}</strong> to confirm.
        </Typography>
        <TextField
          fullWidth
          autoComplete="off"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={confirmWord}
          disabled={loading}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          color="error"
          variant="contained"
          disabled={!confirmed || loading}
          onClick={onConfirm}
        >
          {loading ? "Deleting…" : "Delete"}
        </Button>
      </DialogActions>
    </MobilizeDialog>
  );
}

function BoxDescription({ children, sx }: { children: ReactNode; sx?: object }) {
  return (
    <Typography component="div" variant="body2" sx={sx}>
      {children}
    </Typography>
  );
}
