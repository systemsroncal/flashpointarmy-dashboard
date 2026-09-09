"use client";

import { AuthFormBrandHeader } from "@/components/auth/AuthFormBrandHeader";
import { ArmyAuthShell, authGrayText, authYellow } from "@/components/auth/ArmyAuthShell";
import { authLabelSx, authTextFieldSx } from "@/components/auth/authFieldStyles";
import { US_STATES } from "@/data/usStates";
import { signInViaApi } from "@/lib/auth/sign-in-api";
import { createClient } from "@/utils/supabase/client";
import { Box, Button, Link as MuiLink, MenuItem, TextField, Typography } from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [gender, setGender] = useState<"" | "male" | "female">("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const fn = firstName.trim();
    const ln = lastName.trim();
    const street = streetAddress.trim();
    const cityVal = city.trim();
    const zip = zipCode.trim();
    if (!fn || !ln) {
      setError("First name and last name are required.");
      return;
    }
    if (!street) {
      setError("Street address is required.");
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
          phone: phone.trim() || undefined,
          streetAddress: street,
          city: cityVal,
          state,
          zipCode: zip,
          gender: gender || undefined,
          dateOfBirth: dateOfBirth || undefined,
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
          sx={{
            color: authGrayText,
            fontSize: "0.85rem",
            mb: 2.5,
            lineHeight: 1.5,
          }}
        >
          Create your account. Your chapter is assigned automatically from your ZIP code. Default
          role is Member.
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
          <TextField
            id="reg-first"
            name="firstName"
            placeholder="First name *"
            required
            fullWidth
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            autoComplete="given-name"
            sx={authTextFieldSx}
            inputProps={{ "aria-label": "First name" }}
          />

          <TextField
            id="reg-last"
            name="lastName"
            placeholder="Last name *"
            required
            fullWidth
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            autoComplete="family-name"
            sx={authTextFieldSx}
            inputProps={{ "aria-label": "Last name" }}
          />

          <TextField
            id="reg-phone"
            name="phone"
            placeholder="Phone (optional)"
            fullWidth
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            sx={{
              ...authTextFieldSx,
              "@media (min-width: 768px)": { gridColumn: "1 / -1" },
            }}
            inputProps={{ "aria-label": "Phone" }}
          />

          <TextField
            id="reg-street"
            name="streetAddress"
            placeholder="Street address *"
            required
            fullWidth
            value={streetAddress}
            onChange={(e) => setStreetAddress(e.target.value)}
            autoComplete="street-address"
            sx={{
              ...authTextFieldSx,
              "@media (min-width: 768px)": { gridColumn: "1 / -1" },
            }}
            inputProps={{ "aria-label": "Street address" }}
          />

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr",
              columnGap: 1.5,
              "@media (min-width: 768px)": {
                gridColumn: "1 / -1",
                gridTemplateColumns: "1fr 1fr 1fr",
              },
            }}
          >
            <TextField
              id="reg-city"
              name="city"
              placeholder="City *"
              required
              fullWidth
              value={city}
              onChange={(e) => setCity(e.target.value)}
              autoComplete="address-level2"
              sx={authTextFieldSx}
              inputProps={{ "aria-label": "City" }}
            />

            <TextField
              id="reg-state"
              name="state"
              select
              required
              fullWidth
              value={state}
              onChange={(e) => setState(e.target.value)}
              sx={{
                ...authTextFieldSx,
                "& .MuiSelect-select": { py: 1.5 },
                "& .MuiSelect-select.MuiSelect-select": {
                  color: state ? "#000" : "#9ca3af",
                },
              }}
              SelectProps={{
                displayEmpty: true,
                renderValue: (selected) => {
                  const code = String(selected ?? "");
                  if (!code) return "State *";
                  const opt = US_STATES.find((s) => s.code === code);
                  return opt ? `${opt.name} (${opt.code})` : code;
                },
              }}
              inputProps={{ "aria-label": "State" }}
            >
              <MenuItem value="">
                <em>State *</em>
              </MenuItem>
              {US_STATES.map((s) => (
                <MenuItem key={s.code} value={s.code}>
                  {s.name} ({s.code})
                </MenuItem>
              ))}
            </TextField>

            <TextField
              id="reg-zip"
              name="zipCode"
              placeholder="ZIP code *"
              required
              fullWidth
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              autoComplete="postal-code"
              helperText="We assign the nearest chapter to this ZIP."
              sx={{
                ...authTextFieldSx,
                mb: 2,
                "& .MuiFormHelperText-root": {
                  color: authGrayText,
                  fontSize: "0.7rem",
                  mx: 0,
                  mt: 0.75,
                },
              }}
              inputProps={{ "aria-label": "ZIP code" }}
            />
          </Box>

          <Box>
            <Typography component="label" htmlFor="reg-dob" sx={authLabelSx}>
              Date of birth
            </Typography>
            <TextField
              id="reg-dob"
              name="dateOfBirth"
              type="date"
              fullWidth
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              sx={{
                ...authTextFieldSx,
                "& .MuiInputBase-input": {
                  colorScheme: "light",
                },
              }}
              inputProps={{ "aria-label": "Date of birth" }}
            />
          </Box>

          <Box>
            <Typography component="label" htmlFor="reg-gender" sx={authLabelSx}>
              Gender
            </Typography>
            <TextField
              id="reg-gender"
              name="gender"
              select
              fullWidth
              value={gender}
              onChange={(e) => setGender(e.target.value as "" | "male" | "female")}
              sx={{
                ...authTextFieldSx,
                "& .MuiSelect-select": {
                  py: 1.5,
                },
              }}
              inputProps={{ "aria-label": "Gender" }}
            >
              <MenuItem value="">
                <em>Not set</em>
              </MenuItem>
              <MenuItem value="male">Male</MenuItem>
              <MenuItem value="female">Female</MenuItem>
            </TextField>
          </Box>

          <TextField
            id="reg-email"
            name="email"
            type="email"
            placeholder="Email address *"
            required
            fullWidth
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={authTextFieldSx}
            inputProps={{ "aria-label": "Email address" }}
          />

          <TextField
            id="reg-password"
            name="password"
            type="password"
            placeholder="Password *"
            required
            fullWidth
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            helperText="At least 6 characters"
            sx={{
              ...authTextFieldSx,
              "& .MuiFormHelperText-root": {
                color: authGrayText,
                fontSize: "0.7rem",
                mx: 0,
                mt: 0.75,
              },
            }}
            inputProps={{ "aria-label": "Password" }}
          />

          {error ? (
            <Typography
              color="error"
              variant="body2"
              sx={{ mb: 1, "@media (min-width: 768px)": { gridColumn: "1 / -1" } }}
            >
              {error}
            </Typography>
          ) : null}
          {message ? (
            <Typography
              variant="body2"
              sx={{
                color: authYellow,
                mb: 1,
                "@media (min-width: 768px)": { gridColumn: "1 / -1" },
              }}
            >
              {message}
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
              color: "#000000",
              bgcolor: authYellow,
              fontWeight: 700,
              textTransform: "none",
              fontSize: "1rem",
              "@media (min-width: 768px)": { gridColumn: "1 / -1" },
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
            {loading ? "Please wait…" : "Create account"}
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
          Already registered? Sign in
        </MuiLink>
      </Box>
    </ArmyAuthShell>
  );
}
