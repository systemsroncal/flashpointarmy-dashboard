"use client";

import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { useMemo } from "react";
import { Box, CircularProgress, Paper, Stack, Typography } from "@mui/material";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

type RequestStatus = "pending" | "approved" | "rejected";

type RequestRow = {
  status: RequestStatus;
  created_at: string;
  reviewed_at: string | null;
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

const STATUS_COLORS = {
  pending: "#ed6c02",
  approved: "#2e7d32",
  rejected: "#d32f2f",
};

function formatDays(ms: number): string {
  const days = ms / (1000 * 60 * 60 * 24);
  if (days < 1) return "< 1 day";
  return `${days.toFixed(1)} days`;
}

function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <Paper sx={{ p: 2, bgcolor: "rgba(0,0,0,0.35)", height: "100%" }}>
      <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1.2 }}>
        {label}
      </Typography>
      <Typography variant="h4" sx={{ fontWeight: 800, my: 0.5 }}>
        {value}
      </Typography>
      {hint ? (
        <Typography variant="caption" color="text.secondary">
          {hint}
        </Typography>
      ) : null}
    </Paper>
  );
}

function weekStartKey(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function formatWeekLabel(key: string): string {
  const d = new Date(`${key}T12:00:00`);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function buildWeeklyBuckets(weekCount: number): string[] {
  const keys: string[] = [];
  const cursor = new Date();
  cursor.setHours(12, 0, 0, 0);
  const day = cursor.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  cursor.setDate(cursor.getDate() + diff);
  for (let i = weekCount - 1; i >= 0; i--) {
    const d = new Date(cursor);
    d.setDate(d.getDate() - i * 7);
    keys.push(d.toISOString().slice(0, 10));
  }
  return keys;
}

type Props = {
  rows: RequestRow[];
  loading?: boolean;
};

export function CertificateRequestsStatsPanel({ rows, loading = false }: Props) {
  const stats = useMemo(() => {
    const pending = rows.filter((r) => r.status === "pending").length;
    const approved = rows.filter((r) => r.status === "approved").length;
    const rejected = rows.filter((r) => r.status === "rejected").length;
    const reviewed = approved + rejected;
    const approvalRate = reviewed > 0 ? Math.round((approved / reviewed) * 100) : null;

    const responseTimes = rows
      .filter((r) => r.reviewed_at)
      .map((r) => new Date(r.reviewed_at!).getTime() - new Date(r.created_at).getTime())
      .filter((ms) => ms >= 0);

    const avgResponseMs =
      responseTimes.length > 0
        ? responseTimes.reduce((sum, ms) => sum + ms, 0) / responseTimes.length
        : null;

    const last30Days = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const submittedLast30 = rows.filter((r) => new Date(r.created_at).getTime() >= last30Days).length;
    const reviewedLast30 = rows.filter(
      (r) => r.reviewed_at && new Date(r.reviewed_at).getTime() >= last30Days
    ).length;

    const weekKeys = buildWeeklyBuckets(12);
    const submittedByWeek = new Map(weekKeys.map((k) => [k, 0]));
    const reviewedByWeek = new Map(weekKeys.map((k) => [k, 0]));

    for (const row of rows) {
      const submitKey = weekStartKey(row.created_at);
      if (submittedByWeek.has(submitKey)) {
        submittedByWeek.set(submitKey, (submittedByWeek.get(submitKey) ?? 0) + 1);
      }
      if (row.reviewed_at) {
        const reviewKey = weekStartKey(row.reviewed_at);
        if (reviewedByWeek.has(reviewKey)) {
          reviewedByWeek.set(reviewKey, (reviewedByWeek.get(reviewKey) ?? 0) + 1);
        }
      }
    }

    const scatterPoints = rows
      .filter((r) => r.reviewed_at)
      .map((r) => {
        const created = new Date(r.created_at).getTime();
        const reviewed = new Date(r.reviewed_at!).getTime();
        const days = (reviewed - created) / (1000 * 60 * 60 * 24);
        return { x: created, y: Math.max(0, days), status: r.status };
      });

    return {
      pending,
      approved,
      rejected,
      reviewed,
      total: rows.length,
      approvalRate,
      avgResponseMs,
      submittedLast30,
      reviewedLast30,
      weekLabels: weekKeys.map(formatWeekLabel),
      submittedSeries: weekKeys.map((k) => submittedByWeek.get(k) ?? 0),
      reviewedSeries: weekKeys.map((k) => reviewedByWeek.get(k) ?? 0),
      scatterPoints,
    };
  }, [rows]);

  const statusBarOpts = useMemo(
    (): ApexOptions => ({
      ...baseOpts,
      chart: { ...baseOpts.chart, type: "bar", id: "cert-status-bar" },
      plotOptions: { bar: { borderRadius: 4, columnWidth: "50%", distributed: true } },
      xaxis: {
        categories: ["Pending", "Approved", "Rejected"],
        title: { text: "Status" },
      },
      yaxis: { min: 0, decimalsInFloat: 0, title: { text: "Requests" } },
      colors: [STATUS_COLORS.pending, STATUS_COLORS.approved, STATUS_COLORS.rejected],
      legend: { show: false },
      title: { text: "Requests by status", style: { fontSize: "14px", fontWeight: 600 } },
    }),
    []
  );

  const outcomeDonutOpts = useMemo(
    (): ApexOptions => ({
      ...baseOpts,
      chart: { ...baseOpts.chart, type: "donut", id: "cert-outcome-donut" },
      labels: ["Approved", "Rejected"],
      colors: [STATUS_COLORS.approved, STATUS_COLORS.rejected],
      legend: { position: "bottom" },
      title: { text: "Review outcomes", style: { fontSize: "14px", fontWeight: 600 } },
      plotOptions: {
        pie: {
          donut: {
            size: "62%",
            labels: {
              show: true,
              total: {
                show: true,
                label: "Reviewed",
                formatter: () => String(stats.reviewed),
              },
            },
          },
        },
      },
    }),
    [stats.reviewed]
  );

  const activityLineOpts = useMemo(
    (): ApexOptions => ({
      ...baseOpts,
      chart: { ...baseOpts.chart, type: "line", id: "cert-activity-line" },
      stroke: { width: 3, curve: "smooth" },
      markers: { size: 4 },
      xaxis: {
        categories: stats.weekLabels,
        title: { text: "Week (last 12)" },
        labels: { rotate: -35 },
      },
      yaxis: { min: 0, decimalsInFloat: 0, title: { text: "Requests" } },
      colors: ["#4cc9f0", "#e9c46a"],
      legend: { position: "top" },
      title: { text: "Weekly activity", style: { fontSize: "14px", fontWeight: 600 } },
    }),
    [stats.weekLabels]
  );

  const responseScatterOpts = useMemo(
    (): ApexOptions => ({
      ...baseOpts,
      chart: { ...baseOpts.chart, type: "scatter", id: "cert-response-scatter", zoom: { enabled: true } },
      markers: { size: 6 },
      xaxis: {
        type: "datetime",
        title: { text: "Submitted" },
      },
      yaxis: {
        min: 0,
        title: { text: "Days to review" },
        labels: {
          formatter: (v) => (typeof v === "number" ? v.toFixed(1) : String(v)),
        },
      },
      colors: ["#90caf9", STATUS_COLORS.approved, STATUS_COLORS.rejected],
      legend: { position: "top" },
      title: { text: "Response time per request", style: { fontSize: "14px", fontWeight: 600 } },
      tooltip: {
        x: { format: "MMM d, yyyy" },
        y: { formatter: (v) => `${Number(v).toFixed(1)} days` },
      },
    }),
    []
  );

  const scatterSeries = useMemo(() => {
    const approved = stats.scatterPoints.filter((p) => p.status === "approved");
    const rejected = stats.scatterPoints.filter((p) => p.status === "rejected");
    return [
      { name: "Approved", data: approved.map((p) => [p.x, p.y]) },
      { name: "Rejected", data: rejected.map((p) => [p.x, p.y]) },
    ];
  }, [stats.scatterPoints]);

  if (loading && rows.length === 0) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Stack spacing={2}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(4, 1fr)" },
          gap: 2,
        }}
      >
        <StatCard label="Total requests" value={stats.total} />
        <StatCard label="Pending review" value={stats.pending} hint="Awaiting admin action" />
        <StatCard label="Approved" value={stats.approved} />
        <StatCard label="Rejected" value={stats.rejected} />
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" },
          gap: 2,
        }}
      >
        <StatCard
          label="Approval rate"
          value={stats.approvalRate != null ? `${stats.approvalRate}%` : "—"}
          hint="Of reviewed requests"
        />
        <StatCard
          label="Avg. response time"
          value={stats.avgResponseMs != null ? formatDays(stats.avgResponseMs) : "—"}
          hint="From submission to review"
        />
        <StatCard
          label="Last 30 days"
          value={`${stats.submittedLast30} submitted`}
          hint={`${stats.reviewedLast30} reviewed`}
        />
      </Box>

      {stats.total === 0 ? (
        <Paper sx={{ p: 3, bgcolor: "rgba(0,0,0,0.35)", textAlign: "center" }}>
          <Typography color="text.secondary">No certificate requests yet. Charts will appear here.</Typography>
        </Paper>
      ) : (
        <>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
              gap: 2,
            }}
          >
            <Paper sx={{ p: 2, bgcolor: "rgba(0,0,0,0.35)" }}>
              <Chart
                type="bar"
                height={320}
                series={[{ name: "Requests", data: [stats.pending, stats.approved, stats.rejected] }]}
                options={statusBarOpts}
              />
            </Paper>
            <Paper sx={{ p: 2, bgcolor: "rgba(0,0,0,0.35)" }}>
              {stats.reviewed > 0 ? (
                <Chart
                  type="donut"
                  height={320}
                  series={[stats.approved, stats.rejected]}
                  options={outcomeDonutOpts}
                />
              ) : (
                <Box sx={{ height: 320, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Typography color="text.secondary">No reviewed requests yet for outcome chart.</Typography>
                </Box>
              )}
            </Paper>
          </Box>

          <Paper sx={{ p: 2, bgcolor: "rgba(0,0,0,0.35)" }}>
            <Chart
              type="line"
              height={320}
              series={[
                { name: "Submitted", data: stats.submittedSeries },
                { name: "Reviewed", data: stats.reviewedSeries },
              ]}
              options={activityLineOpts}
            />
          </Paper>

          <Paper sx={{ p: 2, bgcolor: "rgba(0,0,0,0.35)" }}>
            {stats.scatterPoints.length > 0 ? (
              <Chart type="scatter" height={340} series={scatterSeries} options={responseScatterOpts} />
            ) : (
              <Box sx={{ height: 340, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Typography color="text.secondary">
                  No reviewed requests yet for response-time chart.
                </Typography>
              </Box>
            )}
          </Paper>
        </>
      )}
    </Stack>
  );
}
