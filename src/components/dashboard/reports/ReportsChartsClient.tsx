"use client";

import { ReportsPresenceSection } from "@/components/dashboard/reports/ReportsPresenceSection";
import AssessmentIcon from "@mui/icons-material/Assessment";
import {
  Alert,
  Box,
  Button,
  ButtonGroup,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

type Bucket = "day" | "month" | "year";

type SeriesBlock = { categories: string[]; data: number[] };

type PieBlock = { labels: string[]; series: number[] };

type ReportsPayload = {
  range: { from: string; to: string };
  bucket: Bucket;
  usersByBucket: SeriesBlock;
  chaptersByBucket: SeriesBlock;
  gatheringsByBucket: SeriesBlock;
  rolesPie: PieBlock;
  chapterStatusPie: PieBlock;
};

const baseOpts: ApexOptions = {
  chart: {
    toolbar: { show: true },
    zoom: { enabled: true },
    foreColor: "rgba(255,255,255,0.72)",
    background: "transparent",
  },
  theme: { mode: "dark" },
  grid: { borderColor: "rgba(255,215,0,0.14)" },
  dataLabels: { enabled: false },
};

function formatLabel(bucket: Bucket): string {
  if (bucket === "day") return "Day (UTC)";
  if (bucket === "month") return "Month (UTC)";
  return "Year (UTC)";
}

function formatStatusSlug(label: string): string {
  return label
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export function ReportsChartsClient() {
  const [preset, setPreset] = useState<"7d" | "30d" | "12m" | "ytd" | "custom">("30d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [granularity, setGranularity] = useState<Bucket | "auto">("auto");
  const [data, setData] = useState<ReportsPayload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const computeRange = useCallback((): { from: Date; to: Date } => {
    const to = new Date();
    if (preset === "custom") {
      const f = customFrom ? new Date(`${customFrom}T00:00:00.000Z`) : new Date(to.getTime() - 30 * 86400000);
      const t = customTo ? new Date(`${customTo}T23:59:59.999Z`) : to;
      return { from: f, to: t };
    }
    switch (preset) {
      case "7d":
        return { from: new Date(to.getTime() - 7 * 86400000), to };
      case "30d":
        return { from: new Date(to.getTime() - 30 * 86400000), to };
      case "12m":
        return { from: new Date(to.getTime() - 365 * 86400000), to };
      case "ytd":
        return { from: new Date(Date.UTC(to.getUTCFullYear(), 0, 1)), to };
      default:
        return { from: new Date(to.getTime() - 30 * 86400000), to };
    }
  }, [preset, customFrom, customTo]);

  useEffect(() => {
    if (preset === "custom" && !customFrom) {
      const t = new Date();
      const f = new Date(t.getTime() - 30 * 86400000);
      setCustomFrom(f.toISOString().slice(0, 10));
      setCustomTo(t.toISOString().slice(0, 10));
    }
  }, [preset, customFrom]);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const { from, to } = computeRange();
      if (from > to) {
        setErr("Start date must be before end date.");
        setLoading(false);
        return;
      }
      const params = new URLSearchParams({
        from: from.toISOString(),
        to: to.toISOString(),
      });
      if (granularity !== "auto") params.set("bucket", granularity);
      const res = await fetch(`/api/reports/dashboard?${params.toString()}`, { cache: "no-store" });
      const json = (await res.json()) as ReportsPayload & { error?: string };
      if (!res.ok) throw new Error(json.error || "Failed to load reports");
      setData(json);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load reports");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [computeRange, granularity]);

  useEffect(() => {
    void load();
  }, [load]);

  const usersLineOpts = useMemo((): ApexOptions => {
    if (!data) return baseOpts;
    return {
      ...baseOpts,
      chart: { ...baseOpts.chart, id: "users-line" },
      stroke: { curve: "smooth", width: 2 },
      xaxis: { categories: data.usersByBucket.categories, title: { text: formatLabel(data.bucket) } },
      yaxis: { min: 0, decimalsInFloat: 0, title: { text: "New users" } },
      colors: ["#e9c46a"],
      title: { text: "User registrations", style: { color: "#e9c46a" } },
    };
  }, [data]);

  const chaptersBarOpts = useMemo((): ApexOptions => {
    if (!data) return baseOpts;
    return {
      ...baseOpts,
      chart: { ...baseOpts.chart, id: "chapters-bar", type: "bar" },
      plotOptions: { bar: { borderRadius: 4, columnWidth: "55%" } },
      xaxis: { categories: data.chaptersByBucket.categories, title: { text: formatLabel(data.bucket) } },
      yaxis: { min: 0, decimalsInFloat: 0, title: { text: "New chapters" } },
      colors: ["#2a9d8f"],
      title: { text: "Chapters created", style: { color: "#2a9d8f" } },
    };
  }, [data]);

  const gatheringsAreaOpts = useMemo((): ApexOptions => {
    if (!data) return baseOpts;
    return {
      ...baseOpts,
      chart: { ...baseOpts.chart, id: "gatherings-area", type: "area" },
      stroke: { curve: "smooth", width: 2 },
      fill: {
        type: "gradient",
        gradient: { shadeIntensity: 0.4, opacityFrom: 0.35, opacityTo: 0.05 },
      },
      xaxis: { categories: data.gatheringsByBucket.categories, title: { text: formatLabel(data.bucket) } },
      yaxis: { min: 0, decimalsInFloat: 0, title: { text: "New events" } },
      colors: ["#4cc9f0"],
      title: { text: "Gatherings created", style: { color: "#4cc9f0" } },
    };
  }, [data]);

  const rolesPieOpts = useMemo((): ApexOptions => {
    if (!data) return baseOpts;
    return {
      ...baseOpts,
      chart: { ...baseOpts.chart, type: "pie" },
      labels: data.rolesPie.labels,
      title: { text: "Role assignments (RBAC rows)", style: { color: "#f4a261" } },
      legend: { position: "bottom" },
      colors: ["#e9c46a", "#2a9d8f", "#264653", "#f4a261", "#e76f51", "#8338ec", "#4cc9f0"],
    };
  }, [data]);

  const chapterPieOpts = useMemo((): ApexOptions => {
    if (!data) return baseOpts;
    return {
      ...baseOpts,
      chart: { ...baseOpts.chart, type: "donut" },
      labels: data.chapterStatusPie.labels.map((l) => formatStatusSlug(l)),
      title: { text: "Chapters by status (current)", style: { color: "#90be6d" } },
      legend: { position: "bottom" },
      colors: ["#2a9d8f", "#f4a261", "#e76f51"],
    };
  }, [data]);

  const pieSeriesRoles = data?.rolesPie.series ?? [];
  const pieSeriesChapter = data?.chapterStatusPie.series ?? [];

  return (
    <Stack spacing={3}>
      <ReportsPresenceSection />
      <Stack direction="row" spacing={1} alignItems="center">
        <AssessmentIcon color="primary" />
        <Typography variant="h5">Reports</Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary">
        Time-based charts use <strong>UTC</strong> bucket labels. RBAC and chapter status pies reflect the
        current database snapshot (not the selected date range).
      </Typography>

      <Paper sx={{ p: 2 }}>
        <Stack spacing={2} flexWrap="wrap" useFlexGap direction="row" alignItems="center">
          <Typography variant="subtitle2" sx={{ width: "100%" }}>
            Filters
          </Typography>
          <ButtonGroup size="small" variant="outlined">
            <Button
              variant={preset === "7d" ? "contained" : "outlined"}
              onClick={() => setPreset("7d")}
            >
              7 days
            </Button>
            <Button
              variant={preset === "30d" ? "contained" : "outlined"}
              onClick={() => setPreset("30d")}
            >
              30 days
            </Button>
            <Button
              variant={preset === "12m" ? "contained" : "outlined"}
              onClick={() => setPreset("12m")}
            >
              12 months
            </Button>
            <Button
              variant={preset === "ytd" ? "contained" : "outlined"}
              onClick={() => setPreset("ytd")}
            >
              Year to date
            </Button>
            <Button
              variant={preset === "custom" ? "contained" : "outlined"}
              onClick={() => setPreset("custom")}
            >
              Custom
            </Button>
          </ButtonGroup>
          {preset === "custom" ? (
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <TextField
                size="small"
                label="From"
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                size="small"
                label="To"
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Stack>
          ) : null}
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel id="granularity-label">Granularity</InputLabel>
            <Select
              labelId="granularity-label"
              label="Granularity"
              value={granularity}
              onChange={(e) => setGranularity(e.target.value as Bucket | "auto")}
            >
              <MenuItem value="auto">Auto</MenuItem>
              <MenuItem value="day">By day</MenuItem>
              <MenuItem value="month">By month</MenuItem>
              <MenuItem value="year">By year</MenuItem>
            </Select>
          </FormControl>
          <Button variant="contained" size="small" onClick={() => void load()} disabled={loading}>
            {loading ? "Loading…" : "Refresh"}
          </Button>
        </Stack>
        {data ? (
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
            Range: {new Date(data.range.from).toLocaleString()} — {new Date(data.range.to).toLocaleString()}
            · Bucket: <strong>{data.bucket}</strong>
          </Typography>
        ) : null}
      </Paper>

      {err ? (
        <Alert severity="error">
          {err}
          {err.includes("Forbidden") ? " Apply migration 033 (reports module) and ensure your role has Reports access." : null}
        </Alert>
      ) : null}

      {loading && !data ? (
        <Typography color="text.secondary">Loading charts…</Typography>
      ) : null}

      {data ? (
        <Stack spacing={3}>
          <Paper sx={{ p: 2 }}>
            <Chart
              type="line"
              height={320}
              series={[{ name: "Users", data: data.usersByBucket.data }]}
              options={usersLineOpts}
            />
          </Paper>
          <Stack direction={{ xs: "column", lg: "row" }} spacing={2}>
            <Paper sx={{ p: 2, flex: 1 }}>
              <Chart
                type="bar"
                height={300}
                series={[{ name: "Chapters", data: data.chaptersByBucket.data }]}
                options={chaptersBarOpts}
              />
            </Paper>
            <Paper sx={{ p: 2, flex: 1 }}>
              <Chart
                type="area"
                height={300}
                series={[{ name: "Gatherings", data: data.gatheringsByBucket.data }]}
                options={gatheringsAreaOpts}
              />
            </Paper>
          </Stack>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <Paper sx={{ p: 2, flex: 1 }}>
              {pieSeriesRoles.length > 0 && pieSeriesRoles.some((n) => n > 0) ? (
                <Chart type="pie" height={340} series={pieSeriesRoles} options={rolesPieOpts} />
              ) : (
                <Box sx={{ py: 6, textAlign: "center" }}>
                  <Typography color="text.secondary">No role assignment data.</Typography>
                </Box>
              )}
            </Paper>
            <Paper sx={{ p: 2, flex: 1 }}>
              {pieSeriesChapter.length > 0 ? (
                <Chart type="donut" height={340} series={pieSeriesChapter} options={chapterPieOpts} />
              ) : (
                <Box sx={{ py: 6, textAlign: "center" }}>
                  <Typography color="text.secondary">No chapter data.</Typography>
                </Box>
              )}
            </Paper>
          </Stack>
        </Stack>
      ) : null}
    </Stack>
  );
}
