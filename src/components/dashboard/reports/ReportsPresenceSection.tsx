"use client";

import { ReportsPresenceDateRangeControls } from "@/components/dashboard/reports/ReportsPresenceDateRangeControls";
import { ReportsStateDemographicMap } from "@/components/dashboard/reports/ReportsStateDemographicMap";
import type { PresenceDailyPayload } from "@/lib/reports/presence-daily-payload";
import {
  type PresenceRangePreset,
  presenceRangeQueryString,
} from "@/lib/reports/presence-range";
import { useDashboardPresence } from "@/contexts/DashboardPresenceContext";
import BoltOutlined from "@mui/icons-material/BoltOutlined";
import GroupsOutlined from "@mui/icons-material/GroupsOutlined";
import HowToRegOutlined from "@mui/icons-material/HowToRegOutlined";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import TrendingUpOutlined from "@mui/icons-material/TrendingUpOutlined";
import {
  Alert,
  Box,
  Card,
  CardContent,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import type { ApexOptions } from "apexcharts";
import type { SvgIconComponent } from "@mui/icons-material";
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
  stroke: { curve: "smooth", width: 2 },
  fill: {
    type: "gradient",
    gradient: { shadeIntensity: 0.35, opacityFrom: 0.45, opacityTo: 0.05 },
  },
  xaxis: { categories: [] },
  yaxis: { min: 0, decimalsInFloat: 0, title: { text: "Distinct users" } },
  colors: ["#90be6d"],
};

function formatDayLabel(iso: string): string {
  const [, mm, dd] = iso.split("-");
  return `${mm}-${dd}`;
}

function formatTrend(percent: number | null): { text: string; positive: boolean } {
  if (percent == null) return { text: "—", positive: true };
  const sign = percent > 0 ? "+" : "";
  return { text: `${sign}${percent}% vs yesterday`, positive: percent >= 0 };
}

function rangeLabel(payload: PresenceDailyPayload | null): string {
  if (!payload) return "last 7 days";
  const { from, to, dayCount } = payload.range;
  return `${from} → ${to} (${dayCount} day${dayCount === 1 ? "" : "s"})`;
}

type StatCardProps = {
  label: string;
  value: number | string;
  sub?: string;
  subTooltip?: string;
  color: string;
  icon: SvgIconComponent;
  pulse?: boolean;
};

function PresenceStatCard({ label, value, sub, subTooltip, color, icon: Icon, pulse }: StatCardProps) {
  return (
    <Card
      sx={{
        height: "100%",
        bgcolor: "rgba(0,0,0,0.45)",
        border: `1px solid ${color}44`,
      }}
    >
      <CardContent sx={{ pt: 2, pb: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.25 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 1.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: `${color}55`,
              border: `1px solid ${color}`,
            }}
          >
            <Icon sx={{ color: "#fff", fontSize: 24 }} />
          </Box>
          {pulse ? (
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                bgcolor: "#ef4444",
                animation: "pulse 1.4s ease-in-out infinite",
                "@keyframes pulse": {
                  "0%, 100%": { opacity: 1 },
                  "50%": { opacity: 0.35 },
                },
              }}
            />
          ) : null}
        </Box>
        <Typography variant="caption" color="text.secondary" display="block">
          {label}
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 800, color: "primary.light", lineHeight: 1.2 }}>
          {value}
        </Typography>
        {sub ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.35, mt: 0.5, flexWrap: "wrap" }}>
            <Typography variant="caption" color="text.secondary" component="span">
              {sub}
            </Typography>
            {subTooltip ? (
              <Tooltip title={subTooltip} arrow placement="top" enterTouchDelay={0}>
                <IconButton
                  size="small"
                  aria-label={`More about: ${label}`}
                  sx={{
                    p: 0.2,
                    ml: -0.25,
                    color: "text.secondary",
                    opacity: 0.65,
                    "&:hover": { opacity: 1, bgcolor: "rgba(255,255,255,0.06)" },
                  }}
                >
                  <InfoOutlined sx={{ fontSize: "0.95rem" }} />
                </IconButton>
              </Tooltip>
            ) : null}
          </Box>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function ReportsPresenceSection() {
  const { onlineUserCount } = useDashboardPresence();
  const [preset, setPreset] = useState<PresenceRangePreset>("7d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [data, setData] = useState<PresenceDailyPayload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (preset === "custom" && !customFrom) {
      const t = new Date();
      const f = new Date(t.getTime() - 7 * 86400000);
      setCustomFrom(f.toISOString().slice(0, 10));
      setCustomTo(t.toISOString().slice(0, 10));
    }
  }, [preset, customFrom]);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const qs = presenceRangeQueryString({ preset, customFrom, customTo });
      const res = await fetch(`/api/reports/presence-daily?${qs}`, { cache: "no-store" });
      const json = (await res.json()) as PresenceDailyPayload & { error?: string };
      if (!res.ok) throw new Error(json.error || "Failed to load presence stats");
      setData(json);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [preset, customFrom, customTo]);

  useEffect(() => {
    void load();
  }, [load]);

  const dayCount = data?.range.dayCount ?? 7;
  const periodLabel = rangeLabel(data);

  const activityOptions = useMemo((): ApexOptions => {
    if (!data) return chartOpts;
    const labels = data.categories.map(formatDayLabel);
    return {
      ...chartOpts,
      chart: { ...chartOpts.chart, id: "presence-activity-area", type: "area" },
      xaxis: {
        categories: labels,
        tickAmount: Math.min(12, labels.length),
        title: { text: `Day (UTC, ${periodLabel})` },
        labels: { rotate: -35, hideOverlappingLabels: true },
      },
      title: {
        text: "Dashboard activity (distinct users / day)",
        style: { color: "#90be6d", fontSize: "14px" },
      },
    };
  }, [data, periodLabel]);

  const summary = data?.summary;
  const trend = formatTrend(summary?.todayVsYesterdayPercent ?? null);
  const todayVsPeakPercent =
    summary && summary.peakDayCount > 0
      ? Math.round(Math.min(100, (summary.activeToday / summary.peakDayCount) * 100))
      : null;

  return (
    <Paper sx={{ p: 2 }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
        <PeopleOutlineIcon color="primary" />
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6">Live & recent presence</Typography>
          <Typography variant="body2" color="text.secondary">
            Realtime online count plus activity, sign-ups, and state breakdown for the selected period.
          </Typography>
        </Box>
      </Stack>

      {err ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {err}
          {err.includes("relation") || err.includes("dashboard_presence")
            ? " Apply migrations 043–044 (`dashboard_presence_daily`) in Supabase."
            : null}
        </Alert>
      ) : null}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            lg: "repeat(4, 1fr)",
          },
          gap: 2,
          mb: 2,
        }}
      >
        <PresenceStatCard
          label="Online now"
          value={onlineUserCount}
          sub="Dashboard open (Realtime)"
          subTooltip="People currently connected to the Command Center in an open browser tab. Updates live via Supabase Realtime presence; this is not a stored historical total."
          color="#ef4444"
          icon={BoltOutlined}
          pulse={onlineUserCount > 0}
        />
        <PresenceStatCard
          label="Active today (UTC)"
          value={summary?.activeToday ?? (loading ? "…" : 0)}
          sub={trend.text}
          subTooltip="Distinct users with at least one dashboard session on today’s UTC calendar day (midnight to midnight UTC). The line below compares this count to yesterday using the same definition."
          color="#22c55e"
          icon={GroupsOutlined}
        />
        <PresenceStatCard
          label={`Distinct users (${dayCount}d)`}
          value={summary?.distinctInRange ?? (loading ? "…" : 0)}
          sub="At least one session pulse"
          subTooltip={`Unique users who had at least one stored presence pulse on any UTC day in the selected period (${periodLabel}).`}
          color="#3b82f6"
          icon={TrendingUpOutlined}
        />
        <PresenceStatCard
          label={`New registrations (${dayCount}d)`}
          value={summary?.registrationsInRange ?? (loading ? "…" : 0)}
          sub="New accounts in this period"
          subTooltip={`Accounts created during the selected period (${periodLabel}), based on when the user joined the platform.`}
          color="#eab308"
          icon={HowToRegOutlined}
        />
      </Box>

      {loading && !data ? (
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Loading presence widgets…
        </Typography>
      ) : null}

      {data ? (
        <Stack spacing={2}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" },
              gap: 2,
            }}
          >
            <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(255,215,0,0.18)" }}>
              <Chart
                type="area"
                height={300}
                series={[{ name: "Active users", data: data.activeUsersByDay }]}
                options={activityOptions}
              />
            </Paper>

            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderColor: "rgba(255,215,0,0.18)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <Typography variant="subtitle2" sx={{ color: "primary.main", fontWeight: 700, mb: 2 }}>
                {dayCount}-day snapshot
              </Typography>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Peak day
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>
                    {summary?.peakDayCount ?? 0}{" "}
                    <Typography component="span" variant="body2" color="text.secondary">
                      users · {summary?.peakDayLabel ? formatDayLabel(summary.peakDayLabel) : "—"}
                    </Typography>
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Yesterday (UTC)
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>
                    {summary?.activeYesterday ?? 0}
                  </Typography>
                </Box>
                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.35, mb: 0.75 }}>
                    <Typography variant="caption" color="text.secondary" component="span">
                      Today vs busiest day (UTC)
                    </Typography>
                    <Tooltip
                      title="The bar compares today’s distinct active users to the single busiest UTC calendar day in this period—not an average. 100% means today matched that peak; lower means fewer users than that peak day."
                      arrow
                      placement="top"
                      enterTouchDelay={0}
                    >
                      <IconButton
                        size="small"
                        aria-label="More about today vs busiest day"
                        sx={{
                          p: 0.2,
                          color: "text.secondary",
                          opacity: 0.65,
                          "&:hover": { opacity: 1, bgcolor: "rgba(255,255,255,0.06)" },
                        }}
                      >
                        <InfoOutlined sx={{ fontSize: "0.95rem" }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={
                      summary && summary.peakDayCount > 0
                        ? Math.min(100, (summary.activeToday / summary.peakDayCount) * 100)
                        : 0
                    }
                    sx={{
                      height: 10,
                      borderRadius: 1,
                      bgcolor: "rgba(255,255,255,0.08)",
                      "& .MuiLinearProgress-bar": { bgcolor: "primary.main" },
                    }}
                  />
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.75 }}>
                    {summary && summary.peakDayCount > 0
                      ? `${summary.activeToday} today · peak was ${summary.peakDayCount} users (${todayVsPeakPercent}% of peak)`
                      : "No peak in this window yet."}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Box>

          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(255,215,0,0.18)" }}>
            <Typography variant="subtitle2" sx={{ color: "primary.main", fontWeight: 700, mb: 1 }}>
              Users by state
            </Typography>

            <ReportsPresenceDateRangeControls
              preset={preset}
              customFrom={customFrom}
              customTo={customTo}
              onPresetChange={setPreset}
              onCustomFromChange={setCustomFrom}
              onCustomToChange={setCustomTo}
            />

            {data.demographicsByState.length === 0 ? (
              <Typography color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
                No state data for this period. Users need a profile state and at least one dashboard
                session.
              </Typography>
            ) : (
              <ReportsStateDemographicMap rows={data.demographicsByState} rangeLabel={periodLabel} />
            )}
          </Paper>

          <Typography variant="caption" color="text.secondary" display="block">
            {data.note}
          </Typography>
        </Stack>
      ) : null}
    </Paper>
  );
}
