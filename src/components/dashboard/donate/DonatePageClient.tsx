"use client";

import { DONATION_RECURRENCE_OPTIONS, DONATION_MIN_CUSTOM_CENTS } from "@/lib/donations/constants";
import { formatUsdFromCents, parseDollarsToCents } from "@/lib/donations/format";
import { presetAllowsMode } from "@/lib/donations/presets";
import { flashpointYellow } from "@/theme/flashpoint-theme";
import type {
  DonationAmountPreset,
  DonationPaymentMode,
  DonationRecurrenceInterval,
} from "@/types/donations";
import VolunteerActivismOutlinedIcon from "@mui/icons-material/VolunteerActivismOutlined";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type Props = {
  presets: DonationAmountPreset[];
  stripeEnabled: boolean;
};

export function DonatePageClient({ presets, stripeEnabled }: Props) {
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status");

  const enabledPresets = useMemo(
    () => presets.filter((p) => p.is_enabled).sort((a, b) => a.sort_order - b.sort_order),
    [presets]
  );

  const [selectedId, setSelectedId] = useState<string | null>(
    () => enabledPresets.find((p) => !p.is_custom_amount)?.id ?? enabledPresets[0]?.id ?? null
  );
  const [customDollars, setCustomDollars] = useState("");
  const [paymentMode, setPaymentMode] = useState<DonationPaymentMode>("one_time");
  const [interval, setInterval] = useState<DonationRecurrenceInterval>("monthly");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = enabledPresets.find((p) => p.id === selectedId) ?? null;

  const availableIntervals = useMemo(() => {
    if (!selected || paymentMode !== "recurring") return [];
    return DONATION_RECURRENCE_OPTIONS.filter((opt) =>
      presetAllowsMode(selected, "recurring", opt.value)
    );
  }, [selected, paymentMode]);

  const canOneTime = selected ? presetAllowsMode(selected, "one_time") : false;
  const canRecurring = availableIntervals.length > 0;

  const displayAmount = useMemo(() => {
    if (!selected) return null;
    if (selected.is_custom_amount) {
      const cents = parseDollarsToCents(customDollars);
      return cents ? formatUsdFromCents(cents) : null;
    }
    return formatUsdFromCents(selected.amount_cents);
  }, [selected, customDollars]);

  async function handleDonate() {
    if (!selected || !stripeEnabled) return;
    setError(null);
    setLoading(true);
    try {
      const customAmountCents = selected.is_custom_amount
        ? parseDollarsToCents(customDollars)
        : undefined;

      if (selected.is_custom_amount && (!customAmountCents || customAmountCents < DONATION_MIN_CUSTOM_CENTS)) {
        throw new Error(`Enter at least $${DONATION_MIN_CUSTOM_CENTS / 100}`);
      }

      const res = await fetch("/api/donations/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          presetId: selected.id,
          customAmountCents,
          paymentMode,
          recurrenceInterval: paymentMode === "recurring" ? interval : null,
        }),
      });
      const data = (await res.json()) as { checkoutUrl?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Could not start checkout");
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
      throw new Error("No checkout URL returned");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
      setLoading(false);
    }
  }

  return (
    <Box sx={{ maxWidth: 720, mx: "auto" }}>
      <Stack spacing={3} alignItems="stretch">
        <Stack direction="row" spacing={2} alignItems="center">
          <VolunteerActivismOutlinedIcon sx={{ fontSize: 40, color: flashpointYellow }} />
          <Box>
            <Typography variant="h4" sx={{ letterSpacing: "0.08em", fontWeight: 700 }}>
              Donate
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Support Flashpoint with a one-time or recurring gift.
            </Typography>
          </Box>
        </Stack>

        {statusParam === "success" ? (
          <Alert severity="success">Thank you — your donation was received.</Alert>
        ) : null}
        {statusParam === "cancelled" ? (
          <Alert severity="info">Checkout was cancelled. You can try again anytime.</Alert>
        ) : null}
        {!stripeEnabled ? (
          <Alert severity="warning">
            Online payments are not configured yet. An administrator must set up Stripe.
          </Alert>
        ) : null}
        {error ? (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        ) : null}

        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, sm: 3.5 },
            border: "1px solid",
            borderColor: "rgba(255, 215, 0, 0.25)",
            background: "linear-gradient(145deg, rgba(255,215,0,0.06) 0%, rgba(0,0,0,0) 55%)",
          }}
        >
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, letterSpacing: "0.12em" }}>
            CHOOSE AN AMOUNT
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "repeat(3, 1fr)", sm: "repeat(4, 1fr)" },
              gap: 1.25,
            }}
          >
            {enabledPresets.map((preset) => {
              const active = preset.id === selectedId;
              const label = preset.is_custom_amount
                ? "Custom"
                : formatUsdFromCents(preset.amount_cents);
              return (
                <Button
                  key={preset.id}
                  fullWidth
                  variant={active ? "contained" : "outlined"}
                  color={active ? "primary" : "inherit"}
                  onClick={() => {
                    setSelectedId(preset.id);
                    setError(null);
                  }}
                  sx={{
                    py: 1.5,
                    fontWeight: 700,
                    fontSize: "1rem",
                    borderColor: active ? "primary.main" : "rgba(255,255,255,0.2)",
                  }}
                >
                  {label}
                </Button>
              );
            })}
          </Box>

          {selected?.is_custom_amount ? (
            <TextField
              fullWidth
              label="Custom amount (USD)"
              value={customDollars}
              onChange={(e) => setCustomDollars(e.target.value)}
              sx={{ mt: 2.5 }}
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                },
              }}
              helperText={`Minimum $${DONATION_MIN_CUSTOM_CENTS / 100}`}
            />
          ) : null}

          <Divider sx={{ my: 3, borderColor: "rgba(255,255,255,0.08)" }} />

          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, letterSpacing: "0.12em" }}>
            PAYMENT TYPE
          </Typography>

          <ToggleButtonGroup
            exclusive
            value={paymentMode}
            onChange={(_, v) => {
              if (v) setPaymentMode(v as DonationPaymentMode);
            }}
            fullWidth
            sx={{ mb: 2 }}
          >
            <ToggleButton value="one_time" disabled={!canOneTime}>
              One-time
            </ToggleButton>
            <ToggleButton value="recurring" disabled={!canRecurring}>
              Recurring
            </ToggleButton>
          </ToggleButtonGroup>

          {paymentMode === "recurring" && availableIntervals.length > 0 ? (
            <ToggleButtonGroup
              exclusive
              value={interval}
              onChange={(_, v) => {
                if (v) setInterval(v as DonationRecurrenceInterval);
              }}
              size="small"
              sx={{ flexWrap: "wrap", gap: 0.5, mb: 2 }}
            >
              {availableIntervals.map((opt) => (
                <ToggleButton key={opt.value} value={opt.value}>
                  {opt.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          ) : null}

          {displayAmount ? (
            <Typography variant="h5" sx={{ mb: 2, color: flashpointYellow, fontWeight: 700 }}>
              {displayAmount}
              {paymentMode === "recurring" ? ` · ${availableIntervals.find((o) => o.value === interval)?.label ?? interval}` : ""}
            </Typography>
          ) : null}

          <Button
            variant="contained"
            color="primary"
            size="large"
            fullWidth
            disabled={
              loading ||
              !stripeEnabled ||
              !selected ||
              (paymentMode === "one_time" && !canOneTime) ||
              (paymentMode === "recurring" && !canRecurring) ||
              (selected.is_custom_amount && !parseDollarsToCents(customDollars))
            }
            onClick={() => void handleDonate()}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {loading ? "Redirecting to checkout…" : "Continue to secure checkout"}
          </Button>
        </Paper>
      </Stack>
    </Box>
  );
}
