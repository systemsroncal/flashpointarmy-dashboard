"use client";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Link as MuiLink,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useOtpResendCooldown } from "@/hooks/useOtpResendCooldown";
import { useState } from "react";

type Mode = "register" | "signin";

type Props = {
  open: boolean;
  groupId: string;
  onClose: () => void;
  onJoined: (status: "approved" | "pending") => void;
};

export function PublicGroupJoinDialog({ open, groupId, onClose, onJoined }: Props) {
  const [mode, setMode] = useState<Mode>("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const resendCooldown = useOtpResendCooldown();

  function resetFeedback() {
    setError(null);
    setMessage(null);
  }

  function switchMode(next: Mode) {
    setMode(next);
    resetFeedback();
    setOtpSent(false);
    setOtpCode("");
  }

  async function requestRegistrationOtp(): Promise<boolean> {
    const res = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(data.error || "Could not send verification code.");
      if (res.status === 429) resendCooldown.startCooldown();
      return false;
    }
    resendCooldown.startCooldown();
    return true;
  }

  async function joinCurrentGroup(): Promise<"approved" | "pending"> {
    const res = await fetch(`/api/mobilize/groups/${groupId}/join`, { method: "POST" });
    const json = (await res.json()) as {
      error?: string;
      membership?: { membership_status?: string };
      alreadyMember?: boolean;
      alreadyPending?: boolean;
    };
    if (!res.ok && !json.alreadyMember && !json.alreadyPending) {
      throw new Error(json.error || "Could not join group.");
    }
    if (json.alreadyPending || json.membership?.membership_status === "pending") {
      return "pending";
    }
    return "approved";
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    resetFeedback();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Could not sign in.");
        return;
      }
      const status = await joinCurrentGroup();
      onJoined(status);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    resetFeedback();
    const fn = firstName.trim();
    const ln = lastName.trim();
    const zip = zipCode.trim();
    if (!fn || !ln) {
      setError("First name and last name are required.");
      return;
    }
    if (!zip || zip.replace(/\D/g, "").length < 5) {
      setError("Enter a valid 5-digit ZIP code.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      if (!otpSent) {
        const ok = await requestRegistrationOtp();
        if (!ok) return;
        setOtpSent(true);
        setMessage("Verification code sent. Check your inbox and enter the OTP below.");
        return;
      }
      if (otpCode.trim().length < 6) {
        setError("Enter the 6-digit verification code.");
        return;
      }

      const res = await fetch("/api/auth/register-with-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          firstName: fn,
          lastName: ln,
          phone: phone.trim() || undefined,
          zipCode: zip,
          joinGroupId: groupId,
          otp: otpCode.trim(),
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        membership?: { membership_status?: string };
      };
      if (!res.ok) {
        setError(data.error || "Could not complete registration.");
        return;
      }

      const signInRes = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      if (!signInRes.ok) {
        setMessage("Account created. Please sign in to continue.");
        switchMode("signin");
        return;
      }

      const status =
        data.membership?.membership_status === "pending" ? "pending" : "approved";
      // Ensure membership even if register join failed silently
      try {
        await joinCurrentGroup();
      } catch {
        /* register may have already joined */
      }
      onJoined(status);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not complete registration.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    if (!resendCooldown.canResend) return;
    resetFeedback();
    const em = email.trim();
    if (!em || !em.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    setResendLoading(true);
    try {
      const ok = await requestRegistrationOtp();
      if (ok) {
        setOtpCode("");
        setMessage("Verification code sent again. Check your inbox.");
      }
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
        {mode === "register" ? "Join group" : "Sign in to join"}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {mode === "register"
            ? "Create your member account. We’ll assign you to the nearest church by ZIP and add you to this group."
            : "Sign in with your existing account. You’ll be added to this group if you aren’t already a member."}
        </Typography>

        {error ? (
          <Alert severity="error" sx={{ mb: 1.5 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        ) : null}
        {message ? (
          <Alert severity="success" sx={{ mb: 1.5 }} onClose={() => setMessage(null)}>
            {message}
          </Alert>
        ) : null}

        <Box
          component="form"
          onSubmit={mode === "register" ? handleRegister : handleSignIn}
          noValidate
        >
          <Stack spacing={1.5}>
            {mode === "register" ? (
              <>
                <TextField
                  label="First name"
                  required
                  fullWidth
                  size="small"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  autoComplete="given-name"
                />
                <TextField
                  label="Last name"
                  required
                  fullWidth
                  size="small"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  autoComplete="family-name"
                />
                <TextField
                  label="Phone (optional)"
                  fullWidth
                  size="small"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                />
                <TextField
                  label="ZIP code"
                  required
                  fullWidth
                  size="small"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  autoComplete="postal-code"
                  helperText="Used to assign you to the nearest church (chapter)."
                />
              </>
            ) : null}
            <TextField
              label="Email"
              type="email"
              required
              fullWidth
              size="small"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <TextField
              label="Password"
              type="password"
              required
              fullWidth
              size="small"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "register" ? "new-password" : "current-password"}
            />
            {mode === "register" && otpSent ? (
              <>
                <TextField
                  label="Verification code"
                  required
                  fullWidth
                  size="small"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  inputProps={{ inputMode: "numeric", maxLength: 8 }}
                />
                <Button
                  type="button"
                  size="small"
                  disabled={!resendCooldown.canResend || resendLoading}
                  onClick={() => void handleResendOtp()}
                  sx={{ alignSelf: "flex-start", textTransform: "none" }}
                >
                  {resendLoading
                    ? "Sending…"
                    : resendCooldown.canResend
                      ? "Resend code"
                      : `Resend in ${resendCooldown.formatCountdown(resendCooldown.secondsLeft)}`}
                </Button>
              </>
            ) : null}

            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{
                mt: 0.5,
                textTransform: "none",
                fontWeight: 700,
                borderRadius: 99,
                bgcolor: "#00206b",
                "&:hover": { bgcolor: "#00164d" },
              }}
            >
              {loading ? (
                <CircularProgress size={22} color="inherit" />
              ) : mode === "register" ? (
                otpSent ? (
                  "Create account & join"
                ) : (
                  "Send verification code"
                )
              ) : (
                "Sign in"
              )}
            </Button>
          </Stack>
        </Box>

        <Typography variant="body2" sx={{ mt: 2, textAlign: "center" }}>
          {mode === "register" ? (
            <>
              Already registered?{" "}
              <MuiLink
                component="button"
                type="button"
                underline="hover"
                onClick={() => switchMode("signin")}
                sx={{ fontWeight: 700, cursor: "pointer", border: 0, background: "none", p: 0 }}
              >
                Sign in
              </MuiLink>
            </>
          ) : (
            <>
              Need an account?{" "}
              <MuiLink
                component="button"
                type="button"
                underline="hover"
                onClick={() => switchMode("register")}
                sx={{ fontWeight: 700, cursor: "pointer", border: 0, background: "none", p: 0 }}
              >
                Register
              </MuiLink>
            </>
          )}
        </Typography>
      </DialogContent>
    </Dialog>
  );
}
