"use client";

import { AuthFormBrandHeader } from "@/components/auth/AuthFormBrandHeader";
import { ArmyAuthShell, authGrayText, authYellow } from "@/components/auth/ArmyAuthShell";
import { PasswordTextField } from "@/components/auth/PasswordTextField";
import { Alert, Box, Button, Link as MuiLink, Typography } from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const MIN_PASSWORD_LENGTH = 8;

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
      setError("The two passwords do not match. Type the same password in both boxes.");
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Use at least ${MIN_PASSWORD_LENGTH} characters.`);
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
    router.push("/login?password_updated=1");
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
            <Alert severity="warning" sx={{ mb: 2 }}>
              This link is invalid or has expired (links last about 30 minutes).
            </Alert>
            <Typography sx={{ color: authGrayText, fontSize: "0.9rem", mb: 2, lineHeight: 1.5 }}>
              Request a new reset from the sign-in page and use the newest email we send you.
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
          <>
            <Typography sx={{ color: authGrayText, fontSize: "0.85rem", mb: 2, lineHeight: 1.55 }}>
              Choose a <strong>new password</strong> you will remember. After saving, sign in with this password
              (not your old temporary one). Passwords are <strong>case-sensitive</strong> — note which letters are
              uppercase.
            </Typography>
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <PasswordTextField
                id="reset-password"
                name="password"
                label="New password"
                authStyled
                autoComplete="new-password"
                value={password}
                onChange={setPassword}
                helperText={`At least ${MIN_PASSWORD_LENGTH} characters.`}
              />
              <PasswordTextField
                id="reset-password-confirm"
                name="confirm"
                label="Confirm new password"
                authStyled
                autoComplete="new-password"
                value={confirm}
                onChange={setConfirm}
                helperText="Must match the password above exactly, including upper and lower case."
              />
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
                {loading ? "Updating…" : "SAVE NEW PASSWORD"}
              </Button>
            </Box>
          </>
        ) : null}
      </Box>
    </ArmyAuthShell>
  );
}
