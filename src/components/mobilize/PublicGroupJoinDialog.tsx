"use client";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  Link as MuiLink,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
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
  const [gender, setGender] = useState<"" | "male" | "female">("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function resetFeedback() {
    setError(null);
    setMessage(null);
  }

  function switchMode(next: Mode) {
    setMode(next);
    resetFeedback();
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
      const res = await fetch("/api/auth/register-direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          firstName: fn,
          lastName: ln,
          phone: phone.trim() || undefined,
          zipCode: zip,
          gender: gender || undefined,
          dateOfBirth: dateOfBirth || undefined,
          joinGroupId: groupId,
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

  const fieldSx = {
    "& .MuiInputLabel-root": { color: "rgba(0,0,0,0.65)" },
    "& .MuiInputLabel-root.Mui-focused": { color: "#000" },
    "& .MuiOutlinedInput-root": {
      color: "#000",
      bgcolor: "#fff",
      "& fieldset": { borderColor: "rgba(0,0,0,0.23)" },
      "&:hover fieldset": { borderColor: "rgba(0,0,0,0.45)" },
      "&.Mui-focused fieldset": { borderColor: "#000" },
    },
    "& .MuiFormHelperText-root": { color: "rgba(0,0,0,0.55)" },
  } as const;

  const submitBtnSx = {
    mt: 0.5,
    textTransform: "none",
    fontWeight: 700,
    borderRadius: 99,
    bgcolor: "#000",
    color: "#fff",
    boxShadow: "none",
    "&:hover": { bgcolor: "#222", boxShadow: "none" },
    "&.Mui-disabled": { bgcolor: "rgba(0,0,0,0.35)", color: "rgba(255,255,255,0.85)" },
  } as const;

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          bgcolor: "#fff",
          color: "#000",
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 800, pb: 1, color: "#000" }}>
        {mode === "register" ? "Join group" : "Sign in to join"}
      </DialogTitle>
      <DialogContent sx={{ bgcolor: "#fff", color: "#000" }}>
        <Typography variant="body2" sx={{ mb: 2, color: "rgba(0,0,0,0.65)" }}>
          {mode === "register"
            ? "Create your account to join this group. Join thousands of Patriots in your city that are part of The Flash Point Army. Your chapter is assigned automatically from your ZIP code."
            : "Sign in with your existing account. You'll be added to this group if you aren't already a member."}
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
                  sx={fieldSx}
                />
                <TextField
                  label="Last name"
                  required
                  fullWidth
                  size="small"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  autoComplete="family-name"
                  sx={fieldSx}
                />
                <TextField
                  label="Phone (optional)"
                  fullWidth
                  size="small"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                  sx={fieldSx}
                />
                <TextField
                  label="ZIP code"
                  required
                  fullWidth
                  size="small"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  autoComplete="postal-code"
                  helperText="Nearest chapter is assigned automatically."
                  sx={fieldSx}
                />
                <TextField
                  label="Date of birth"
                  type="date"
                  fullWidth
                  size="small"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={fieldSx}
                />
                <FormControl fullWidth size="small" sx={fieldSx}>
                  <InputLabel id="join-gender-label">Gender</InputLabel>
                  <Select
                    labelId="join-gender-label"
                    label="Gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value as "" | "male" | "female")}
                  >
                    <MenuItem value="">
                      <em>Not set</em>
                    </MenuItem>
                    <MenuItem value="male">Male</MenuItem>
                    <MenuItem value="female">Female</MenuItem>
                  </Select>
                </FormControl>
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
              sx={fieldSx}
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
              sx={fieldSx}
            />

            <Button type="submit" variant="contained" disabled={loading} sx={submitBtnSx}>
              {loading ? (
                <CircularProgress size={22} color="inherit" />
              ) : mode === "register" ? (
                "Create account & join"
              ) : (
                "Sign in"
              )}
            </Button>
          </Stack>
        </Box>

        <Typography variant="body2" sx={{ mt: 2, textAlign: "center", color: "#000" }}>
          {mode === "register" ? (
            <>
              Already registered?{" "}
              <MuiLink
                component="button"
                type="button"
                underline="hover"
                onClick={() => switchMode("signin")}
                sx={{
                  fontWeight: 700,
                  cursor: "pointer",
                  border: 0,
                  background: "none",
                  p: 0,
                  color: "#000",
                }}
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
                sx={{
                  fontWeight: 700,
                  cursor: "pointer",
                  border: 0,
                  background: "none",
                  p: 0,
                  color: "#000",
                }}
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
