"use client";

import { AuthFormBrandHeader } from "@/components/auth/AuthFormBrandHeader";
import { ArmyAuthShell, authGrayText, authYellow } from "@/components/auth/ArmyAuthShell";
import { authFloatingTextFieldSx } from "@/components/auth/authFieldStyles";
import { createClient } from "@/utils/supabase/client";
import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Link as MuiLink,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type ChapterOption = {
  id: string;
  name: string;
  state: string;
  city: string | null;
};

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [chapter, setChapter] = useState<ChapterOption | null>(null);
  const [chapters, setChapters] = useState<ChapterOption[]>([]);
  const [chaptersLoading, setChaptersLoading] = useState(true);
  const [chaptersError, setChaptersError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setChaptersLoading(true);
      setChaptersError(null);
      const supabase = createClient();
      const { data, error: qErr } = await supabase
        .from("chapters")
        .select("id, name, state, city")
        .order("name");
      if (cancelled) return;
      if (qErr) {
        setChaptersError(qErr.message);
        setChapters([]);
      } else {
        setChapters((data ?? []) as ChapterOption[]);
      }
      setChaptersLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const chapterFieldSx = useMemo(
    () => ({
      ...authFloatingTextFieldSx,
      "& .MuiAutocomplete-popupIndicator": { color: "#000000" },
      "& .MuiAutocomplete-clearIndicator": { color: "#000000" },
    }),
    []
  );

  async function requestRegistrationOtp(): Promise<boolean> {
    const res = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(data.error || "Could not send verification code.");
      return false;
    }
    return true;
  }

  async function handleResendOtp() {
    setError(null);
    setMessage(null);
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    const fn = firstName.trim();
    const ln = lastName.trim();
    if (!fn || !ln) {
      setError("First name and last name are required.");
      setLoading(false);
      return;
    }
    if (!chapter) {
      setError("Please select a chapter.");
      setLoading(false);
      return;
    }
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
          email,
          password,
          firstName: fn,
          lastName: ln,
          phone: phone.trim() || undefined,
          primaryChapterId: chapter.id,
          otp: otpCode.trim(),
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Could not complete registration.");
        return;
      }

      setMessage("Account created successfully. You can now sign in.");
      setTimeout(() => router.push("/login"), 1500);
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
          <TextField
            id="reg-first"
            name="firstName"
            label="First name"
            variant="outlined"
            fullWidth
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            autoComplete="given-name"
            sx={authFloatingTextFieldSx}
          />
          <TextField
            id="reg-last"
            name="lastName"
            label="Last name"
            variant="outlined"
            fullWidth
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            autoComplete="family-name"
            sx={authFloatingTextFieldSx}
          />
          <TextField
            id="reg-phone"
            name="phone"
            label="Phone (optional)"
            variant="outlined"
            fullWidth
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            sx={authFloatingTextFieldSx}
          />
          <Autocomplete
            id="reg-chapter"
            options={chapters}
            loading={chaptersLoading}
            value={chapter}
            onChange={(_, v) => setChapter(v)}
            getOptionLabel={(o) =>
              o.city ? `${o.name} — ${o.city}, ${o.state}` : `${o.name} (${o.state})`
            }
            filterOptions={(opts, state) => {
              const q = state.inputValue.trim().toLowerCase();
              if (!q) return opts;
              return opts.filter((o) => {
                const blob = `${o.name} ${o.state} ${o.city ?? ""}`.toLowerCase();
                return blob.includes(q);
              });
            }}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            sx={{ width: "100%" }}
            renderInput={(params) => (
              <TextField
                {...params}
                name="chapter"
                label="Chapter"
                variant="outlined"
                required
                sx={chapterFieldSx}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {chaptersLoading ? (
                        <CircularProgress color="inherit" size={20} sx={{ mr: 1 }} />
                      ) : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
          {chaptersError ? (
            <Typography variant="caption" sx={{ display: "block", color: "error.main", mb: 1 }}>
              Could not load chapters: {chaptersError}. If you are the admin, run migration
              008_dashboard_users_names_chapter.sql (anon read on chapters).
            </Typography>
          ) : null}
          {!chaptersLoading && !chaptersError && chapters.length === 0 ? (
            <Typography variant="caption" sx={{ display: "block", color: "warning.main", mb: 1 }}>
              No chapters in the database yet. Add chapters in the dashboard before signing up.
            </Typography>
          ) : null}
          <TextField
            id="reg-email"
            name="email"
            label="Email address"
            variant="outlined"
            type="email"
            required
            fullWidth
            autoComplete="email"
            value={email}
            onChange={(e) => {
              const next = e.target.value;
              if (otpSent && next.trim().toLowerCase() !== email.trim().toLowerCase()) {
                setOtpSent(false);
                setOtpCode("");
              }
              setEmail(next);
            }}
            sx={authFloatingTextFieldSx}
          />
          {otpSent ? (
            <Box sx={{ mb: 2 }}>
              <TextField
                id="reg-otp"
                name="otp"
                label="Verification code"
                variant="outlined"
                required
                fullWidth
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                helperText="Enter the 6-digit code sent to your email."
                sx={{
                  ...authFloatingTextFieldSx,
                  mb: 0.5,
                  "& .MuiFormHelperText-root": { color: authGrayText, fontSize: "0.7rem" },
                }}
              />
              <Button
                type="button"
                variant="text"
                size="small"
                disabled={resendLoading || loading || !email.trim()}
                onClick={() => void handleResendOtp()}
                sx={{
                  p: 0,
                  minWidth: 0,
                  textTransform: "none",
                  color: authYellow,
                  fontSize: "0.8rem",
                  "&:disabled": { color: authGrayText },
                }}
              >
                {resendLoading ? "Sending…" : "Resend verification email"}
              </Button>
            </Box>
          ) : null}
          <TextField
            id="reg-password"
            name="password"
            label="Password"
            variant="outlined"
            type="password"
            required
            fullWidth
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            helperText="At least 6 characters (Supabase default)"
            sx={{
              ...authFloatingTextFieldSx,
              "& .MuiFormHelperText-root": { color: authGrayText, fontSize: "0.7rem" },
            }}
          />

          {error ? (
            <Typography color="error" variant="body2" sx={{ mb: 1 }}>
              {error}
            </Typography>
          ) : null}
          {message ? (
            <Typography variant="body2" sx={{ color: authYellow, mb: 1 }}>
              {message}
            </Typography>
          ) : null}

          <Button
            type="submit"
            fullWidth
            disabled={
              loading || chaptersLoading || !!chaptersError || chapters.length === 0
            }
            sx={{
              mt: 1,
              py: 1.25,
              border: `1px solid ${authYellow}`,
              borderRadius: "6px",
              color: authYellow,
              bgcolor: "transparent",
              fontWeight: 600,
              textTransform: "none",
              fontSize: "1rem",
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
            {loading ? "Please wait…" : otpSent ? "Verify OTP & Create account" : "Register"}
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
      </Box>
    </ArmyAuthShell>
  );
}
