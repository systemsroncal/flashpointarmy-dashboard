"use client";

import { AuthFormBrandHeader } from "@/components/auth/AuthFormBrandHeader";
import { ArmyAuthShell, authGrayText, authYellow } from "@/components/auth/ArmyAuthShell";
import { authLabelSx, authTextFieldSx } from "@/components/auth/authFieldStyles";
import { Box, Button, Link as MuiLink, TextField, Typography } from "@mui/material";
import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/auth/request-password-reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error || "Could not send reset email.");
      return;
    }
    setDone(true);
  }

  return (
    <ArmyAuthShell>
      <AuthFormBrandHeader />
      <Box
        sx={{
          bgcolor: "rgba(0,0,0,0.3)",
          border: `1px solid ${authYellow}`,
          borderRadius: "8px",
          p: 3,
        }}
      >
        {done ? (
          <>
            <Typography sx={{ color: authGrayText, fontSize: "0.9rem", mb: 2, lineHeight: 1.5 }}>
              If an account exists for that email, we sent a reset link. Check your inbox and spam
              folder.
            </Typography>
            <MuiLink
              component={Link}
              href="/login"
              underline="always"
              sx={{
                display: "block",
                textAlign: "center",
                color: authGrayText,
                fontSize: "0.75rem",
                "&:hover": { color: authYellow },
              }}
            >
              Back to Sign In
            </MuiLink>
          </>
        ) : (
          <>
            <Typography sx={{ color: authGrayText, fontSize: "0.85rem", mb: 2, lineHeight: 1.5 }}>
              Enter the email you use to sign in. We will send a reset link (valid for a limited
              time).
            </Typography>
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Box>
                <Typography component="label" htmlFor="forgot-email" sx={authLabelSx}>
                  Email Address
                </Typography>
                <TextField
                  id="forgot-email"
                  name="email"
                  type="email"
                  required
                  fullWidth
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  sx={authTextFieldSx}
                />
              </Box>
              {error ? (
                <Typography color="error" variant="body2" sx={{ mb: 1 }}>
                  {error}
                </Typography>
              ) : null}
              <Button
                type="submit"
                fullWidth
                disabled={loading}
                sx={{
                  mt: 1,
                  py: 1.25,
                  border: `1px solid ${authYellow}`,
                  borderRadius: "6px",
                  color: authYellow,
                  bgcolor: "transparent",
                  fontWeight: 700,
                  textTransform: "none",
                  fontSize: "0.95rem",
                  letterSpacing: "0.06em",
                  "&:hover": {
                    bgcolor: authYellow,
                    color: "#000000",
                  },
                  "&:disabled": {
                    opacity: 0.55,
                    borderColor: authYellow,
                    color: authYellow,
                  },
                }}
              >
                {loading ? "Sending…" : "SEND RESET LINK"}
              </Button>
            </Box>
            <MuiLink
              component={Link}
              href="/login"
              underline="always"
              sx={{
                display: "block",
                mt: 2,
                textAlign: "center",
                color: authGrayText,
                fontSize: "0.75rem",
                "&:hover": { color: authYellow },
              }}
            >
              Back to Sign In
            </MuiLink>
          </>
        )}
      </Box>
    </ArmyAuthShell>
  );
}
