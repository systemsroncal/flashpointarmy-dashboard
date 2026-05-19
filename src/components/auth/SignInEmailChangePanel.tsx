"use client";

import { useOtpResendCooldown } from "@/hooks/useOtpResendCooldown";
import { Alert, Box, Button, Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";

type SignInEmailChangePanelProps = {
  currentEmail: string;
  sendOtpUrl: string;
  confirmUrl: string;
  onSuccess: (newEmail: string) => void;
  disabled?: boolean;
  /** Shown when an admin changes another user's email (Community edit). */
  adminMode?: boolean;
};

export function SignInEmailChangePanel({
  currentEmail,
  sendOtpUrl,
  confirmUrl,
  onSuccess,
  disabled = false,
  adminMode = false,
}: SignInEmailChangePanelProps) {
  const resendCooldown = useOtpResendCooldown();
  const [newEmail, setNewEmail] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  function resetFlow() {
    setNewEmail("");
    setEmailOtp("");
    setOtpSent(false);
    setSending(false);
    setConfirming(false);
    setError(null);
    setInfo(null);
    resendCooldown.clearCooldown();
  }

  async function sendOtp() {
    const trimmed = newEmail.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      setError("Enter a valid new email address.");
      return;
    }
    if (trimmed === currentEmail.trim().toLowerCase()) {
      setError("New email must be different from the current email.");
      return;
    }
    if (otpSent && !resendCooldown.canResend) return;

    setSending(true);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch(sendOtpUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail: trimmed }),
      });
      const data = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) {
        setError(data.error || "Could not send verification code.");
        if (res.status === 429) resendCooldown.startCooldown();
        return;
      }
      setOtpSent(true);
      resendCooldown.startCooldown();
      setInfo(
        data.message ||
          `We sent a 6-digit code to ${currentEmail}. Enter it below to confirm the change.`
      );
    } finally {
      setSending(false);
    }
  }

  async function confirmChange() {
    const trimmed = newEmail.trim().toLowerCase();
    const otp = emailOtp.trim();
    if (!trimmed || !otp) {
      setError("Enter the new email and the verification code.");
      return;
    }
    setConfirming(true);
    setError(null);
    try {
      const res = await fetch(confirmUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail: trimmed, otp }),
      });
      const data = (await res.json()) as { error?: string; email?: string };
      if (!res.ok) {
        setError(data.error || "Could not update email.");
        return;
      }
      const updated = data.email || trimmed;
      resetFlow();
      setInfo("Email updated successfully.");
      onSuccess(updated);
    } finally {
      setConfirming(false);
    }
  }

  const resendLabel = resendCooldown.canResend
    ? "Resend code"
    : `Resend code (${resendCooldown.formatCountdown(resendCooldown.secondsLeft)})`;

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
        Sign-in email
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block">
        Current: <strong>{currentEmail}</strong>
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
        {adminMode
          ? "A verification code is sent to the member's current email before the new address is applied."
          : "We will send a verification code to your current email before applying a new one."}
      </Typography>

      {error ? (
        <Alert severity="error" sx={{ py: 0.5, mb: 1 }}>
          {error}
        </Alert>
      ) : null}
      {info ? (
        <Alert severity="info" sx={{ py: 0.5, mb: 1 }}>
          {info}
        </Alert>
      ) : null}

      <TextField
        label="New email"
        type="email"
        value={newEmail}
        onChange={(e) => {
          setNewEmail(e.target.value);
          setOtpSent(false);
          setEmailOtp("");
          resendCooldown.clearCooldown();
        }}
        size="small"
        fullWidth
        autoComplete="email"
        disabled={disabled || sending || confirming}
        sx={{ mb: 1 }}
      />

      {!otpSent ? (
        <Button
          type="button"
          variant="outlined"
          size="small"
          disabled={disabled || sending || !newEmail.trim() || (!resendCooldown.canResend && otpSent)}
          onClick={() => void sendOtp()}
        >
          {sending ? "Sending code…" : "Send verification code"}
        </Button>
      ) : (
        <Stack spacing={1}>
          <TextField
            label="Verification code"
            value={emailOtp}
            onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            size="small"
            fullWidth
            inputProps={{ inputMode: "numeric", maxLength: 6 }}
            placeholder="6-digit code"
            disabled={disabled || confirming}
          />
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            <Button
              type="button"
              variant="contained"
              size="small"
              disabled={disabled || confirming || emailOtp.length !== 6}
              onClick={() => void confirmChange()}
            >
              {confirming ? "Updating…" : "Confirm new email"}
            </Button>
            <Button
              type="button"
              variant="text"
              size="small"
              disabled={disabled || sending || confirming || !resendCooldown.canResend}
              onClick={() => void sendOtp()}
            >
              {sending ? "Sending…" : resendLabel}
            </Button>
            <Button
              type="button"
              variant="text"
              size="small"
              color="inherit"
              disabled={disabled || confirming}
              onClick={resetFlow}
            >
              Cancel
            </Button>
          </Box>
        </Stack>
      )}
    </Box>
  );
}
