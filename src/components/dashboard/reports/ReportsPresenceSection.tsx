"use client";

import type { PresenceDailyPayload } from "@/lib/reports/presence-daily-payload";
import { useDashboardPresence } from "@/contexts/DashboardPresenceContext";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import { Alert, Box, Paper, Stack, Typography } from "@mui/material";
import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const chartOpts: ApexOptions = {
  chart: {
    toolbar: { show: false },
    foreColor: "rgba(255,255,255,0.72)",
    background: "transparent",
  },
  theme: { mode: "dark" },
  grid: { borderColor: "rgba(255,215,0,0.14)" },
  dataLabels: { enabled: false },
  plotOptions: { bar: { borderRadius: 4, columnWidth: "60%" } },
  xaxis: { categories: [] },
  yaxis: { min: 0, decimalsInFloat: 0, title: { text: "Distinct users" } },
  colors: ["#90be6d"],
};

export function ReportsPresenceSection() {
  const { onlineUserCount } = useDashboardPresence();
  const [data, setData] = useState<PresenceDailyPayload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/reports/presence-daily", { cache: "no-store" });
      const json = (await res.json()) as PresenceDailyPayload & { error?: string };
      if (!res.ok) throw new Error(json.error || "Failed to load presence stats");
      setData(json);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const options = useMemo((): ApexOptions => {
    if (!data) return chartOpts;
    return {
      ...chartOpts,
      chart: { ...chartOpts.chart, id: "presence-daily-bar" },
      xaxis: {
        categories: data.categories.map((c) => c.slice(5)),
        title: { text: "Day (UTC, last 7)" },
      },
      title: { text: "Dashboard activity (distinct users / day)", style: { color: "#90be6d" } },
    };
  }, [data]);

  return (
    <Paper sx={{ p: 2 }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
        <PeopleOutlineIcon color="primary" />
        <Typography variant="h6">Live & recent presence</Typography>
      </Stack>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
        <Box sx={{ px: 2, py: 1.5, borderRadius: 1, bgcolor: "rgba(0,0,0,0.35)", minWidth: 200 }}>
          <Typography variant="caption" color="text.secondary">
            Online now (dashboard open)
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, color: "primary.light" }}>
            {onlineUserCount}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ flex: 1, pt: 0.5 }}>
          Realtime count uses Supabase Presence (no polling). Daily bars count users with at least one activity
          pulse while the app was open; pulses are throttled to about once every two minutes per user. Only the
          last seven UTC calendar days are stored; older days are deleted automatically.
        </Typography>
      </Stack>

      {err ? (
        <Alert severity="warning" sx={{ mb: 1 }}>
          {err}
          {err.includes("relation") || err.includes("dashboard_presence")
            ? " Apply migration 043 (`dashboard_presence_daily`) in Supabase."
            : null}
        </Alert>
      ) : null}

      {loading && !data ? (
        <Typography color="text.secondary">Loading presence chart…</Typography>
      ) : null}

      {data ? (
        <>
          <Chart
            type="bar"
            height={280}
            series={[{ name: "Active users", data: data.activeUsersByDay }]}
            options={options}
          />
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
            {data.note}
          </Typography>
        </>
      ) : null}
    </Paper>
  );
}
