"use client";

import {
  defaultWeekComparisonRanges,
  formatUsDateRange,
  registrationRangesOverlap,
  validateRegistrationComparisonInput,
  type RegistrationComparisonPreset,
} from "@/lib/reports/registration-comparison";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingFlatIcon from "@mui/icons-material/TrendingFlat";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import {
  Alert,
  Box,
  Button,
  ButtonGroup,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

type ComparisonPayload = {
  preset: RegistrationComparisonPreset;
  before: { from: string; to: string; label: string; count: number };
  after: { from: string; to: string; label: string; count: number };
  delta: number;
  percentChange: number;
};

const chartBase: ApexOptions = {
  chart: {
    toolbar: { show: false },
    foreColor: "rgba(255,255,255,0.72)",
    background: "transparent",
  },
  theme: { mode: "dark" },
  grid: { borderColor: "rgba(255,215,0,0.14)" },
  dataLabels: { enabled: true, style: { fontSize: "13px", fontWeight: 700 } },
  plotOptions: {
    bar: {
      borderRadius: 6,
      columnWidth: "42%",
      distributed: true,
    },
  },
  legend: { show: false },
  colors: ["#f4a261", "#2a9d8f"],
};

function DeltaBadge({ delta, percentChange }: { delta: number; percentChange: number }) {
  const Icon = delta > 0 ? TrendingUpIcon : delta < 0 ? TrendingDownIcon : TrendingFlatIcon;
  const color = delta > 0 ? "#2a9d8f" : delta < 0 ? "#e76f51" : "text.secondary";
  const sign = delta > 0 ? "+" : "";
  return (
    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ color }}>
      <Icon fontSize="small" />
      <Typography variant="body2" fontWeight={700} sx={{ color: "inherit" }}>
        {sign}
        {delta} ({sign}
        {percentChange}%)
      </Typography>
    </Stack>
  );
}

export function ReportsRegistrationComparison() {
  const weekDefaults = useMemo(() => defaultWeekComparisonRanges(), []);
  const [preset, setPreset] = useState<RegistrationComparisonPreset>("week");
  const [beforeFrom, setBeforeFrom] = useState(weekDefaults.before.from);
  const [beforeTo, setBeforeTo] = useState(weekDefaults.before.to);
  const [afterFrom, setAfterFrom] = useState(weekDefaults.after.from);
  const [afterTo, setAfterTo] = useState(weekDefaults.after.to);
  const [data, setData] = useState<ComparisonPayload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const clientValidation = useMemo(() => {
    if (preset !== "custom") return null;
    return validateRegistrationComparisonInput({ beforeFrom, beforeTo, afterFrom, afterTo });
  }, [preset, beforeFrom, beforeTo, afterFrom, afterTo]);

  const load = useCallback(async () => {
    if (preset === "custom") {
      const validation = validateRegistrationComparisonInput({
        beforeFrom,
        beforeTo,
        afterFrom,
        afterTo,
      });
      if (validation) {
        setErr(validation);
        setData(null);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setErr(null);
    try {
      const params = new URLSearchParams({ preset });
      if (preset === "custom") {
        params.set("beforeFrom", beforeFrom);
        params.set("beforeTo", beforeTo);
        params.set("afterFrom", afterFrom);
        params.set("afterTo", afterTo);
      }
      const res = await fetch(`/api/reports/registration-comparison?${params.toString()}`, {
        cache: "no-store",
      });
      const json = (await res.json()) as ComparisonPayload & { error?: string };
      if (!res.ok) throw new Error(json.error || "Failed to load registration comparison");
      setData(json);
      if (preset === "custom") {
        setBeforeFrom(json.before.from);
        setBeforeTo(json.before.to);
        setAfterFrom(json.after.from);
        setAfterTo(json.after.to);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load registration comparison");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [preset, beforeFrom, beforeTo, afterFrom, afterTo]);

  useEffect(() => {
    void load();
  }, [load]);

  const chartOpts = useMemo((): ApexOptions => {
    if (!data) return chartBase;
    return {
      ...chartBase,
      xaxis: {
        categories: [`Before (${data.before.label})`, `After (${data.after.label})`],
        labels: { style: { fontSize: "11px" } },
      },
      yaxis: {
        min: 0,
        decimalsInFloat: 0,
        title: { text: "New user registrations" },
      },
      title: {
        text: "User registration comparison",
        style: { color: "#e9c46a", fontSize: "15px" },
      },
    };
  }, [data]);

  function applyWeekPreset() {
    const ranges = defaultWeekComparisonRanges();
    setPreset("week");
    setBeforeFrom(ranges.before.from);
    setBeforeTo(ranges.before.to);
    setAfterFrom(ranges.after.from);
    setAfterTo(ranges.after.to);
  }

  function isDateBlockedForBefore(ymd: string): boolean {
    if (!afterFrom || !afterTo) return false;
    return registrationRangesOverlap(ymd, ymd, afterFrom, afterTo);
  }

  function isDateBlockedForAfter(ymd: string): boolean {
    if (!beforeFrom || !beforeTo) return false;
    return registrationRangesOverlap(beforeFrom, beforeTo, ymd, ymd);
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ color: "#e9c46a" }}>
          User registration comparison
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Compare new user sign-ups between two periods (UTC). Ranges can be non-consecutive — e.g. Before
          (07/12/2026–07/17/2026) vs After (07/19/2026–07/25/2026). The same calendar day cannot appear in
          both ranges.
        </Typography>
      </Box>

      <Stack spacing={2} flexWrap="wrap" useFlexGap direction="row" alignItems="center" sx={{ mb: 2 }}>
        <ButtonGroup size="small" variant="outlined">
          <Button variant={preset === "week" ? "contained" : "outlined"} onClick={applyWeekPreset}>
            Last week vs this week
          </Button>
          <Button
            variant={preset === "custom" ? "contained" : "outlined"}
            onClick={() => setPreset("custom")}
          >
            Custom ranges
          </Button>
        </ButtonGroup>
        <Button variant="contained" size="small" onClick={() => void load()} disabled={loading}>
          {loading ? "Loading…" : "Refresh"}
        </Button>
      </Stack>

      {preset === "custom" ? (
        <Stack spacing={2} sx={{ mb: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography variant="subtitle2" sx={{ minWidth: 56, color: "#f4a261" }}>
              Before
            </Typography>
            <TextField
              size="small"
              label="From"
              type="date"
              value={beforeFrom}
              onChange={(e) => {
                const v = e.target.value;
                if (v && isDateBlockedForBefore(v)) return;
                setBeforeFrom(v);
              }}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              size="small"
              label="To"
              type="date"
              value={beforeTo}
              onChange={(e) => {
                const v = e.target.value;
                if (v && isDateBlockedForBefore(v)) return;
                setBeforeTo(v);
              }}
              InputLabelProps={{ shrink: true }}
            />
            {beforeFrom && beforeTo ? (
              <Typography variant="caption" color="text.secondary">
                {formatUsDateRange(beforeFrom, beforeTo)}
              </Typography>
            ) : null}
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography variant="subtitle2" sx={{ minWidth: 56, color: "#2a9d8f" }}>
              After
            </Typography>
            <TextField
              size="small"
              label="From"
              type="date"
              value={afterFrom}
              onChange={(e) => {
                const v = e.target.value;
                if (v && isDateBlockedForAfter(v)) return;
                setAfterFrom(v);
              }}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              size="small"
              label="To"
              type="date"
              value={afterTo}
              onChange={(e) => {
                const v = e.target.value;
                if (v && isDateBlockedForAfter(v)) return;
                setAfterTo(v);
              }}
              InputLabelProps={{ shrink: true }}
            />
            {afterFrom && afterTo ? (
              <Typography variant="caption" color="text.secondary">
                {formatUsDateRange(afterFrom, afterTo)}
              </Typography>
            ) : null}
          </Stack>
        </Stack>
      ) : data ? (
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
          Before ({data.before.label}) · After ({data.after.label}) · UTC weeks (Mon–Sun)
        </Typography>
      ) : null}

      {clientValidation && preset === "custom" ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {clientValidation}
        </Alert>
      ) : null}

      {err && !clientValidation ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {err}
        </Alert>
      ) : null}

      {loading && !data ? (
        <Typography color="text.secondary">Loading comparison…</Typography>
      ) : null}

      {data ? (
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Box
              sx={{
                flex: 1,
                p: 2,
                borderRadius: 2,
                bgcolor: "rgba(244, 162, 97, 0.08)",
                border: "1px solid rgba(244, 162, 97, 0.35)",
              }}
            >
              <Typography variant="overline" sx={{ color: "#f4a261", letterSpacing: 1 }}>
                Before
              </Typography>
              <Typography variant="h4" fontWeight={800} sx={{ color: "#f4a261" }}>
                {data.before.count.toLocaleString("en-US")}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {data.before.label}
              </Typography>
            </Box>
            <Box
              sx={{
                flex: 1,
                p: 2,
                borderRadius: 2,
                bgcolor: "rgba(42, 157, 143, 0.08)",
                border: "1px solid rgba(42, 157, 143, 0.35)",
              }}
            >
              <Typography variant="overline" sx={{ color: "#2a9d8f", letterSpacing: 1 }}>
                After
              </Typography>
              <Typography variant="h4" fontWeight={800} sx={{ color: "#2a9d8f" }}>
                {data.after.count.toLocaleString("en-US")}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {data.after.label}
              </Typography>
            </Box>
            <Box
              sx={{
                flex: 1,
                p: 2,
                borderRadius: 2,
                bgcolor: "rgba(0,0,0,0.25)",
                border: "1px solid rgba(255,215,0,0.2)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1 }}>
                Change
              </Typography>
              <DeltaBadge delta={data.delta} percentChange={data.percentChange} />
            </Box>
          </Stack>
          <Chart
            type="bar"
            height={300}
            series={[{ name: "Registrations", data: [data.before.count, data.after.count] }]}
            options={chartOpts}
          />
        </Stack>
      ) : null}
    </Paper>
  );
}
