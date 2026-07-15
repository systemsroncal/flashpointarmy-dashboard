"use client";

import { AuthFormBrandHeader } from "@/components/auth/AuthFormBrandHeader";
import { LoginSignInHighlight, showLoginSignInHighlight } from "@/components/auth/LoginSignInHighlight";
import { ArmyAuthShell, authGrayText, authYellow } from "@/components/auth/ArmyAuthShell";
import { PasswordTextField } from "@/components/auth/PasswordTextField";
import { authLabelSx, authTextFieldSx } from "@/components/auth/authFieldStyles";
import { signInViaApi } from "@/lib/auth/sign-in-api";
import { createClient } from "@/utils/supabase/client";
import ArrowForward from "@mui/icons-material/ArrowForward";
import { Alert, Box, Button, Link as MuiLink, TextField, Typography } from "@mui/material";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

/** Set to `true` to show “New here? Create account” on the login page again. */
const SHOW_LOGIN_REGISTER_INVITE = false;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/dashboard";
  const sessionReason = searchParams.get("reason");
  const passwordUpdated = searchParams.get("password_updated") === "1";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await signInViaApi(email, password);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      const {
        data: { session },
      } = await createClient().auth.getSession();
      if (!session) {
        setError(
          "Sign-in did not leave a session in the browser. Try disabling cookie blockers or use a regular (non-private) window."
        );
        return;
      }
      await fetch("/api/auth/session-start", {
        method: "POST",
        credentials: "include",
      });
      router.refresh();
      router.push(redirectTo);
    } catch (unknownErr) {
      setError(
        unknownErr instanceof Error
          ? unknownErr.message
          : "Could not sign in."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <ArmyAuthShell>
      <AuthFormBrandHeader />
      <LoginSignInHighlight autoShow={!passwordUpdated} />
      <Box
        id="login-form-panel"
        sx={{
          bgcolor: "rgba(0,0,0,0.3)",
          border: `1px solid ${authYellow}`,
          borderRadius: "8px",
          p: 3,
        }}
      >
        <Box component="form" onSubmit={handleSubmit} noValidate>
          {passwordUpdated ? (
            <Alert severity="success" sx={{ mb: 2 }}>
              Your password was updated. Sign in with your new password below.
            </Alert>
          ) : null}
          {sessionReason === "session_expired" ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              Your session has expired. Please sign in again.
            </Alert>
          ) : null}

          <Box>
            <Typography component="label" htmlFor="login-email" sx={authLabelSx}>
              Email address
            </Typography>
            <TextField
              id="login-email"
              name="email"
              type="email"
              required
              fullWidth
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={authTextFieldSx}
              inputProps={{ "aria-label": "Email address" }}
            />
          </Box>

          <PasswordTextField
            id="login-password"
            name="password"
            label="Password"
            authStyled
            autoComplete="current-password"
            value={password}
            onChange={setPassword}
            helperText="Tap the eye icon to show or hide what you type."
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
            endIcon={<ArrowForward />}
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
            {loading ? "Signing in…" : "LOG IN"}
          </Button>

          <Typography
            sx={{
              mt: 1.5,
              textAlign: "center",
              color: authGrayText,
              fontSize: "0.8rem",
              lineHeight: 1.55,
            }}
          >
            <MuiLink
              component="button"
              type="button"
              underline="always"
              onClick={() => void showLoginSignInHighlight()}
              sx={{
                color: authYellow,
                fontWeight: 600,
                fontSize: "inherit",
                verticalAlign: "inherit",
                border: "none",
                bgcolor: "transparent",
                cursor: "pointer",
                p: 0,
                "&:hover": { opacity: 0.9 },
              }}
            >
              First time signing in?
            </MuiLink>
            {" · "}
            <MuiLink
              component={Link}
              href="/forgot-password"
              underline="always"
              sx={{
                color: authYellow,
                fontWeight: 600,
                "&:hover": { color: authYellow, opacity: 0.9 },
              }}
            >
              Reset password
            </MuiLink>
          </Typography>
        </Box>

        {SHOW_LOGIN_REGISTER_INVITE ? (
          <Typography
            sx={{
              mt: 1.5,
              textAlign: "center",
              color: authGrayText,
              fontSize: "0.75rem",
            }}
          >
            New here?{" "}
            <MuiLink
              component={Link}
              href="/register"
              sx={{ color: authGrayText, "&:hover": { color: authYellow } }}
            >
              Create account
            </MuiLink>
          </Typography>
        ) : null}
      </Box>
    </ArmyAuthShell>
  );
}

function LoginFallback() {
  return (
    <ArmyAuthShell>
      <AuthFormBrandHeader />
      <Box
        sx={{
          bgcolor: "rgba(0,0,0,0.3)",
          border: `1px solid ${authYellow}`,
          borderRadius: "8px",
          p: 4,
          textAlign: "center",
        }}
      >
        <Typography sx={{ color: authGrayText }}>Loading…</Typography>
      </Box>
    </ArmyAuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
