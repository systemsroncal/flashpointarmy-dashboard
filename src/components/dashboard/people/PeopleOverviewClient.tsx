"use client";

import type { PeopleOverviewStats } from "@/lib/people/people-overview-stats";
import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo } from "react";
import {
  Avatar,
  Box,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Typography,
} from "@mui/material";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const baseOpts: ApexOptions = {
  chart: {
    toolbar: { show: false },
    foreColor: "rgba(255,255,255,0.72)",
    background: "transparent",
  },
  theme: { mode: "dark" },
  grid: { borderColor: "rgba(255,215,0,0.12)" },
  dataLabels: { enabled: false },
  legend: { position: "bottom" },
};

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(ms / (1000 * 60 * 60));
  if (hours < 1) return "just now";
  if (hours < 24) return `about ${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `about ${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString();
}

export function PeopleOverviewClient({ stats }: { stats: PeopleOverviewStats }) {
  const roleSeries = useMemo(
    () => [
      stats.byRole.localLeaders,
      stats.byRole.members,
      stats.byRole.admins + stats.byRole.subAdmins + stats.byRole.superAdmins,
    ],
    [stats.byRole]
  );

  const roleOpts = useMemo(
    (): ApexOptions => ({
      ...baseOpts,
      labels: ["Local leaders", "Members", "Admins"],
      colors: ["#eab308", "#38bdf8", "#a78bfa"],
      plotOptions: {
        pie: {
          donut: {
            size: "68%",
            labels: {
              show: true,
              total: {
                show: true,
                label: "Total",
                formatter: () => String(stats.totalUsers),
              },
            },
          },
        },
      },
      title: { text: "Roles", style: { fontSize: "14px", fontWeight: 600 } },
    }),
    [stats.totalUsers]
  );

  const demoOpts = useMemo(
    (): ApexOptions => ({
      ...baseOpts,
      chart: { ...baseOpts.chart, type: "bar", stacked: true },
      plotOptions: { bar: { borderRadius: 3, columnWidth: "55%" } },
      xaxis: { categories: stats.byAgeBucket.map((b) => b.label) },
      yaxis: { decimalsInFloat: 0, title: { text: "People" } },
      colors: ["#60a5fa", "#eab308", "#2dd4bf"],
      title: { text: "Demographics", style: { fontSize: "14px", fontWeight: 600 } },
    }),
    [stats.byAgeBucket]
  );

  const stateOpts = useMemo(
    (): ApexOptions => ({
      ...baseOpts,
      labels: stats.byState.map((s) => s.state),
      colors: ["#f59e0b", "#22c55e", "#3b82f6", "#ec4899", "#8b5cf6", "#14b8a6", "#ef4444", "#84cc16"],
      plotOptions: {
        pie: {
          donut: {
            size: "68%",
            labels: {
              show: true,
              total: {
                show: true,
                label: "With state",
                formatter: () => String(stats.byState.reduce((n, s) => n + s.count, 0)),
              },
            },
          },
        },
      },
      title: { text: "By state (profile)", style: { fontSize: "14px", fontWeight: 600 } },
    }),
    [stats.byState]
  );

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5, color: "primary.main" }}>
        People overview
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Snapshot of local leaders, members, and administrators across the dashboard.
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" },
          gap: 2,
          mb: 2,
        }}
      >
        <Paper sx={{ p: 2, bgcolor: "rgba(0,0,0,0.4)" }}>
          <Chart
            type="bar"
            height={300}
            series={[
              { name: "Female", data: stats.byAgeBucket.map((b) => b.female) },
              { name: "Male", data: stats.byAgeBucket.map((b) => b.male) },
              { name: "Unassigned", data: stats.byAgeBucket.map((b) => b.unassigned) },
            ]}
            options={demoOpts}
          />
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
            Female {stats.byGender.female} · Male {stats.byGender.male} · Unassigned{" "}
            {stats.byGender.unassigned}
          </Typography>
        </Paper>

        <Paper sx={{ p: 2, bgcolor: "rgba(0,0,0,0.4)" }}>
          <Box sx={{ position: "relative" }}>
            <Chart type="donut" height={300} series={roleSeries} options={roleOpts} />
            <Box
              sx={{
                position: "absolute",
                top: "42%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                pointerEvents: "none",
                textAlign: "center",
              }}
            >
              <PersonOutlineIcon sx={{ color: "rgba(255,255,255,0.5)", fontSize: 28 }} />
            </Box>
          </Box>
        </Paper>

        <Paper sx={{ p: 2, bgcolor: "rgba(0,0,0,0.4)" }}>
          {stats.byState.length > 0 ? (
            <Chart
              type="donut"
              height={300}
              series={stats.byState.map((s) => s.count)}
              options={stateOpts}
            />
          ) : (
            <Box sx={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Typography color="text.secondary">No state data on profiles yet.</Typography>
            </Box>
          )}
        </Paper>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" },
          gap: 2,
        }}
      >
        <Paper sx={{ p: 2, bgcolor: "rgba(0,0,0,0.4)", display: "flex", flexDirection: "column" }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
            Recently created profiles
          </Typography>
          <List dense sx={{ flex: 1 }}>
            {stats.recentlyCreated.map((u) => (
              <ListItem
                key={u.id}
                disableGutters
                component={Link}
                href={`/dashboard/people/${u.id}?from=people`}
                sx={{
                  textDecoration: "none",
                  color: "inherit",
                  borderRadius: 1,
                  px: 0.5,
                  "&:hover": { bgcolor: "rgba(255,255,255,0.04)" },
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ width: 36, height: 36, bgcolor: "primary.dark", fontSize: "0.8rem" }}>
                    {u.initials}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={u.name}
                  secondary={relativeTime(u.created_at)}
                  primaryTypographyProps={{ variant: "body2", fontWeight: 600, color: "primary.light" }}
                  secondaryTypographyProps={{ variant: "caption" }}
                />
              </ListItem>
            ))}
          </List>
          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
            <Button component={Link} href="/dashboard/community" size="small">
              See more
            </Button>
          </Box>
        </Paper>

        <Paper sx={{ p: 2, bgcolor: "rgba(0,0,0,0.4)" }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
            Role breakdown
          </Typography>
          {(
            [
              ["Local leaders", stats.byRole.localLeaders],
              ["Members", stats.byRole.members],
              ["Admins", stats.byRole.admins],
              ["Sub admins", stats.byRole.subAdmins],
              ["Super admins", stats.byRole.superAdmins],
            ] as const
          ).map(([label, value]) => (
            <Box key={label} sx={{ display: "flex", justifyContent: "space-between", py: 0.75 }}>
              <Typography variant="body2">{label}</Typography>
              <Typography variant="body2" fontWeight={700}>
                {value}
              </Typography>
            </Box>
          ))}
          <Box sx={{ display: "flex", gap: 1, mt: 2, flexWrap: "wrap" }}>
            <Button component={Link} href="/dashboard/leaders" size="small" variant="outlined">
              View leaders
            </Button>
            <Button component={Link} href="/dashboard/community" size="small" variant="outlined">
              View members
            </Button>
          </Box>
        </Paper>

        <Paper sx={{ p: 2, bgcolor: "rgba(0,0,0,0.4)" }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
            Profile completeness
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Gender and date of birth can be set by each person in their profile. Charts update as
            people fill those fields.
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.75 }}>
            <Typography variant="body2">Gender set</Typography>
            <Typography variant="body2" fontWeight={700}>
              {stats.byGender.male + stats.byGender.female} / {stats.totalUsers}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.75 }}>
            <Typography variant="body2">Age known</Typography>
            <Typography variant="body2" fontWeight={700}>
              {stats.byAgeBucket
                .filter((b) => b.label !== "Unknown")
                .reduce((n, b) => n + b.male + b.female + b.unassigned, 0)}{" "}
              / {stats.totalUsers}
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
