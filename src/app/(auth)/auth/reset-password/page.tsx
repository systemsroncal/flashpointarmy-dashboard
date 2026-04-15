"use client";

import { AuthFormBrandHeader } from "@/components/auth/AuthFormBrandHeader";
import { ArmyAuthShell, authGrayText, authYellow } from "@/components/auth/ArmyAuthShell";
import { authLabelSx, authTextFieldSx } from "@/components/auth/authFieldStyles";
import { Box, Button, Link as MuiLink, TextField, Typography } from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [invalidLink, setInvalidLink] = useState(false);
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const t = (params.get("token") || "").trim();
    const e = (params.get("email") || "").trim().toLowerCase();
    setToken(t);
    setEmail(e);
    if (t && e) {
      setReady(true);
      setInvalidLink(false);
    } else {
      setReady(false);
      setInvalidLink(true);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Use at least 6 characters.");
      return;
    }
    if (!token || !email) {
      setError("Reset link is invalid.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/auth/confirm-password-reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, email, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error || "Could not update password.");
      return;
    }
    router.push("/login");
    router.refresh();
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
        {!ready && !invalidLink ? (
          <Typography sx={{ color: authGrayText, fontSize: "0.9rem", textAlign: "center" }}>
            Verifying your reset link…
          </Typography>
        ) : null}

        {invalidLink && !ready ? (
          <>
            <Typography sx={{ color: authGrayText, fontSize: "0.9rem", mb: 2, lineHeight: 1.5 }}>
              This link is invalid or has expired. Request a new reset from the sign-in page.
            </Typography>
            <MuiLink
              component={Link}
              href="/forgot-password"
              underline="always"
              sx={{
                display: "block",
                textAlign: "center",
                color: authGrayText,
                fontSize: "0.75rem",
                "&:hover": { color: authYellow },
              }}
            >
              Request a new link
            </MuiLink>
          </>
        ) : null}

        {ready ? (
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Box>
              <Typography component="label" htmlFor="reset-password" sx={authLabelSx}>
                New password
              </Typography>
              <TextField
                id="reset-password"
                name="password"
                type="password"
                required
                fullWidth
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={authTextFieldSx}
              />
            </Box>
            <Box>
              <Typography component="label" htmlFor="reset-password-confirm" sx={authLabelSx}>
                Confirm password
              </Typography>
              <TextField
                id="reset-password-confirm"
                name="confirm"
                type="password"
                required
                fullWidth
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
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
              {loading ? "Updating…" : "UPDATE PASSWORD"}
            </Button>
          </Box>
        ) : null}
      </Box>
    </ArmyAuthShell>
  );
}
