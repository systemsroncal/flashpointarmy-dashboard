"use client";

import { AuthFormBrandHeader } from "@/components/auth/AuthFormBrandHeader";
import { ArmyAuthShell, authGrayText, authYellow } from "@/components/auth/ArmyAuthShell";
import { authLabelSx, authTextFieldSx } from "@/components/auth/authFieldStyles";
import { createClient } from "@/utils/supabase/client";
import { ArrowForward } from "@mui/icons-material";
import { Box, Button, Link as MuiLink, TextField, Typography } from "@mui/material";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: err } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (err) {
        const msg = err.message || "";
        if (/failed to fetch|network|load failed/i.test(msg)) {
          setError(
            `${msg}. Comprueba NEXT_PUBLIC_SUPABASE_URL y la clave anon en .env.local, que el proyecto Supabase esté activo y que no bloquee el navegador extensiones o la red.`
          );
        } else {
          setError(msg);
        }
        return;
      }
      router.push(redirectTo);
      router.refresh();
    } catch (unknownErr) {
      setError(
        unknownErr instanceof Error
          ? unknownErr.message
          : "No se pudo iniciar sesión."
      );
    } finally {
      setLoading(false);
    }
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
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Box>
            <Typography component="label" htmlFor="login-email" sx={authLabelSx}>
              Username or Email Address
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
              inputProps={{ "aria-label": "Username or Email Address" }}
            />
          </Box>
          <Box>
            <Typography component="label" htmlFor="login-password" sx={authLabelSx}>
              Password
            </Typography>
            <TextField
              id="login-password"
              name="password"
              type="password"
              required
              fullWidth
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={authTextFieldSx}
              inputProps={{ "aria-label": "Password" }}
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
        </Box>

        <MuiLink
          component={Link}
          href="/forgot-password"
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
          Forgot Password
        </MuiLink>

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
