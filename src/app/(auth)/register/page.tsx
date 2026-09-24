"use client";

import { AuthFormBrandHeader } from "@/components/auth/AuthFormBrandHeader";
import { ArmyAuthShell, authGrayText, authYellow } from "@/components/auth/ArmyAuthShell";
import { authLabelSx, authTextFieldSx } from "@/components/auth/authFieldStyles";
import { PasswordTextField } from "@/components/auth/PasswordTextField";
import { UsStateSearchAutocomplete } from "@/components/forms/UsStateSearchAutocomplete";
import { signInViaApi } from "@/lib/auth/sign-in-api";
import { createClient } from "@/utils/supabase/client";
import ArrowForward from "@mui/icons-material/ArrowForward";
import VerifiedUser from "@mui/icons-material/VerifiedUser";
import { Box, Button, Link as MuiLink, TextField, Typography } from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const fullRowSx = { gridColumn: "1 / -1" } as const;

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const fn = firstName.trim();
    const ln = lastName.trim();
    const phoneVal = phone.trim();
    const cityVal = city.trim();
    const zip = zipCode.trim();
    if (!fn || !ln) {
      setError("First name and last name are required.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    if (phoneVal.replace(/\D/g, "").length < 10) {
      setError("Enter a valid 10-digit phone number.");
      return;
    }
    if (!cityVal) {
      setError("City is required.");
      return;
    }
    if (!state) {
      setError("State is required.");
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
      const res = await fetch("/api/auth/register-direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          firstName: fn,
          lastName: ln,
          phone: phoneVal,
          city: cityVal,
          state,
          zipCode: zip,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Could not complete registration.");
        return;
      }

      const signIn = await signInViaApi(email.trim(), password);
      if (!signIn.ok) {
        setMessage("Account created. Please sign in to continue.");
        setTimeout(() => router.push("/login"), 1200);
        return;
      }

      const {
        data: { session },
      } = await createClient().auth.getSession();
      if (session) {
        await fetch("/api/auth/session-start", { method: "POST", credentials: "include" });
      }

      setMessage("Account created. Redirecting…");
      router.refresh();
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not complete registration.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ArmyAuthShell hideHeadline contentMaxWidth={640}>
      <AuthFormBrandHeader />
      <Box
        sx={{
          bgcolor: "rgba(0,0,0,0.3)",
          border: `1px solid ${authYellow}`,
          borderRadius: "8px",
          p: 3,
        }}
      >
        <Typography
          component="h1"
          sx={{
            color: authYellow,
            fontWeight: 700,
            fontSize: { xs: "1.35rem", sm: "1.5rem" },
            letterSpacing: "0.02em",
            lineHeight: 1.25,
            mb: 0.75,
            textWrap: "balance",
          }}
        >
          Join FlashPoint Army
        </Typography>
        <Typography
          sx={{
            color: authGrayText,
            fontSize: "0.9rem",
            lineHeight: 1.55,
            mb: 2.5,
            maxWidth: "65ch",
          }}
        >
          Create your free account and connect with believers across America. It takes less than a
          minute.
        </Typography>

        <Box
          component="form"
          onSubmit={handleSubmit}
          noValidate
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr",
            columnGap: 1.5,
            "@media (min-width: 768px)": {
              gridTemplateColumns: "1fr 1fr",
            },
          }}
        >
          <Box>
            <Typography component="label" htmlFor="reg-first" sx={authLabelSx}>
              First Name
            </Typography>
            <TextField
              id="reg-first"
              name="firstName"
              required
              fullWidth
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoComplete="given-name"
              sx={authTextFieldSx}
              inputProps={{ "aria-label": "First Name" }}
            />
          </Box>

          <Box>
            <Typography component="label" htmlFor="reg-last" sx={authLabelSx}>
              Last Name
            </Typography>
            <TextField
              id="reg-last"
              name="lastName"
              required
              fullWidth
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              autoComplete="family-name"
              sx={authTextFieldSx}
              inputProps={{ "aria-label": "Last Name" }}
            />
          </Box>

          <Box>
            <Typography component="label" htmlFor="reg-email" sx={authLabelSx}>
              Email address
            </Typography>
            <TextField
              id="reg-email"
              name="email"
              type="email"
              required
              fullWidth
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={authTextFieldSx}
              inputProps={{ "aria-label": "Email address" }}
            />
          </Box>

          <Box>
            <Typography component="label" htmlFor="reg-phone" sx={authLabelSx}>
              Phone
            </Typography>
            <TextField
              id="reg-phone"
              name="phone"
              type="tel"
              required
              fullWidth
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              sx={authTextFieldSx}
              inputProps={{ "aria-label": "Phone", inputMode: "tel" }}
            />
          </Box>

          <Box sx={{ ...fullRowSx, mb: 1.25, mt: 0.25 }}>
            <Typography
              component="h2"
              sx={{
                color: "#fff",
                fontWeight: 700,
                fontSize: "1rem",
                mb: 0.5,
              }}
            >
              Help us connect you locally
            </Typography>
            <Typography
              sx={{
                color: authGrayText,
                fontSize: "0.82rem",
                lineHeight: 1.55,
                maxWidth: "65ch",
              }}
            >
              Your City, State and ZIP help us show activity, groups, and opportunities in your
              area.
            </Typography>
          </Box>

          <Box
            sx={{
              ...fullRowSx,
              display: "grid",
              gridTemplateColumns: "1fr",
              columnGap: 1.5,
              "@media (min-width: 768px)": {
                gridTemplateColumns: "1.4fr 1.2fr 0.9fr",
              },
            }}
          >
            <Box>
              <Typography component="label" htmlFor="reg-city" sx={authLabelSx}>
                City
              </Typography>
              <TextField
                id="reg-city"
                name="city"
                required
                fullWidth
                value={city}
                onChange={(e) => setCity(e.target.value)}
                autoComplete="address-level2"
                sx={authTextFieldSx}
                inputProps={{ "aria-label": "City" }}
              />
            </Box>

            <Box>
              <Typography component="label" htmlFor="reg-state" sx={authLabelSx}>
                State
              </Typography>
              <UsStateSearchAutocomplete
                id="reg-state"
                name="state"
                label="State"
                required
                authStyled
                valueCode={state}
                onSelectCode={setState}
              />
            </Box>

            <Box>
              <Typography component="label" htmlFor="reg-zip" sx={authLabelSx}>
                ZIP
              </Typography>
              <TextField
                id="reg-zip"
                name="zipCode"
                required
                fullWidth
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                autoComplete="postal-code"
                sx={authTextFieldSx}
                inputProps={{ "aria-label": "ZIP", inputMode: "numeric" }}
              />
            </Box>
          </Box>

          <Box sx={fullRowSx}>
            <PasswordTextField
              id="reg-password"
              name="password"
              label="Password"
              authStyled
              autoComplete="new-password"
              value={password}
              onChange={setPassword}
              helperText="At least 6 characters. Tap the eye icon to show or hide what you type."
            />
          </Box>

          {error ? (
            <Typography color="error" variant="body2" sx={{ mb: 1, ...fullRowSx }} role="alert">
              {error}
            </Typography>
          ) : null}
          {message ? (
            <Typography variant="body2" sx={{ color: authYellow, mb: 1, ...fullRowSx }} role="status">
              {message}
            </Typography>
          ) : null}

          <Button
            type="submit"
            fullWidth
            disabled={loading}
            endIcon={<ArrowForward />}
            sx={{
              mt: 0.5,
              py: 1.25,
              border: `1px solid ${authYellow}`,
              borderRadius: "6px",
              color: "#000000",
              bgcolor: authYellow,
              fontWeight: 700,
              textTransform: "none",
              fontSize: "0.95rem",
              letterSpacing: "0.04em",
              ...fullRowSx,
              "&:hover": {
                bgcolor: "#e6c200",
                borderColor: "#e6c200",
              },
              "&:disabled": {
                opacity: 0.55,
                borderColor: authYellow,
                bgcolor: authYellow,
                color: "#000000",
              },
            }}
          >
            {loading ? "Please wait…" : "Join the Movement"}
          </Button>

          <Box
            sx={{
              ...fullRowSx,
              display: "flex",
              alignItems: "flex-start",
              gap: 1,
              mt: 1.5,
            }}
          >
            <VerifiedUser
              aria-hidden
              sx={{ color: "#22c55e", fontSize: 20, flexShrink: 0, mt: "1px" }}
            />
            <Typography
              sx={{
                color: authGrayText,
                fontSize: "0.78rem",
                lineHeight: 1.5,
              }}
            >
              Your information is kept private and is never displayed publicly without your
              permission.
            </Typography>
          </Box>
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
          Already registered? Sign in
        </MuiLink>
      </Box>
    </ArmyAuthShell>
  );
}
