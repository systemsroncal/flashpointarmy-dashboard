"use client";

import type { JourneyProgressRow, JourneyProgressStats } from "@/lib/onboarding/journey-progress-stats";
import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import Link from "next/link";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  Chip,
  InputAdornment,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const baseOpts: ApexOptions = {
  chart: {
    toolbar: { show: true },
    foreColor: "rgba(255,255,255,0.72)",
    background: "transparent",
  },
  theme: { mode: "dark" },
  grid: { borderColor: "rgba(255,215,0,0.14)" },
  dataLabels: { enabled: false },
};

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

function BoolChip({ ok }: { ok: boolean }) {
  return ok ? (
    <Chip size="small" color="success" icon={<CheckCircleOutlineIcon />} label="Yes" />
  ) : (
    <Chip size="small" variant="outlined" icon={<HighlightOffIcon />} label="No" />
  );
}

export function JourneyProgressAdminClient({
  initialRows,
  initialStats,
}: {
  initialRows: JourneyProgressRow[];
  initialStats: JourneyProgressStats;
}) {
  const [tab, setTab] = useState<"people" | "stats">("people");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return initialRows;
    return initialRows.filter((r) =>
      [r.name, r.email, r.role_label, r.chapter_name ?? "", r.chapter_state ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [initialRows, search]);

  const pageRows = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const barOpts = useMemo(
    (): ApexOptions => ({
      ...baseOpts,
      chart: { ...baseOpts.chart, type: "bar" },
      plotOptions: { bar: { borderRadius: 4, columnWidth: "45%", distributed: true } },
      xaxis: {
        categories: ["Course done", "Briefing done", "Missions started", "All three", "None"],
      },
      yaxis: { min: 0, decimalsInFloat: 0 },
      colors: ["#38bdf8", "#eab308", "#22c55e", "#a78bfa", "#64748b"],
      legend: { show: false },
      title: { text: "Journey milestones", style: { fontSize: "14px", fontWeight: 600 } },
    }),
    []
  );

  const donutOpts = useMemo(
    (): ApexOptions => ({
      ...baseOpts,
      labels: ["Course completed", "Not completed"],
      colors: ["#22c55e", "#475569"],
      legend: { position: "bottom" },
      title: { text: "Biblical Citizenship", style: { fontSize: "14px", fontWeight: 600 } },
      plotOptions: {
        pie: {
          donut: {
            size: "62%",
            labels: {
              show: true,
              total: {
                show: true,
                label: "People",
                formatter: () => String(initialStats.total),
              },
            },
          },
        },
      },
    }),
    [initialStats.total]
  );

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
        Journey progress
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Track whether people completed Biblical Citizenship, finished Mission Briefing, and started
        the 12 Missions.
      </Typography>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v as "people" | "stats")}
        sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}
      >
        <Tab value="people" label={`People (${initialRows.length})`} />
        <Tab value="stats" label="Statistics" />
      </Tabs>

      {tab === "stats" ? (
        <Stack spacing={2}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(4, 1fr)" },
              gap: 2,
            }}
          >
            <StatCard label="People tracked" value={initialStats.total} />
            <StatCard
              label="Course completed"
              value={initialStats.courseCompleted}
              hint={`${
                initialStats.total
                  ? Math.round((initialStats.courseCompleted / initialStats.total) * 100)
                  : 0
              }%`}
            />
            <StatCard label="Briefing completed" value={initialStats.briefingCompleted} />
            <StatCard label="Missions started" value={initialStats.missionsStarted} />
          </Box>
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
                series={[
                  {
                    name: "People",
                    data: [
                      initialStats.courseCompleted,
                      initialStats.briefingCompleted,
                      initialStats.missionsStarted,
                      initialStats.allThree,
                      initialStats.noneStarted,
                    ],
                  },
                ]}
                options={barOpts}
              />
            </Paper>
            <Paper sx={{ p: 2, bgcolor: "rgba(0,0,0,0.35)" }}>
              <Chart
                type="donut"
                height={320}
                series={[
                  initialStats.courseCompleted,
                  Math.max(0, initialStats.total - initialStats.courseCompleted),
                ]}
                options={donutOpts}
              />
            </Paper>
          </Box>
        </Stack>
      ) : (
        <>
          <Paper sx={{ p: 2, mb: 2, bgcolor: "rgba(0,0,0,0.35)" }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Search name, email, role, chapter…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </Paper>
          <Paper sx={{ bgcolor: "rgba(0,0,0,0.35)", overflow: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Person</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Chapter</TableCell>
                  <TableCell>Course</TableCell>
                  <TableCell>Mission Briefing</TableCell>
                  <TableCell>Missions started</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pageRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ py: 4, textAlign: "center", color: "text.secondary" }}>
                      No people match your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  pageRows.map((row) => (
                    <TableRow key={row.user_id} hover>
                      <TableCell>
                        <Typography
                          component={Link}
                          href={`/dashboard/people/${row.user_id}?from=people`}
                          variant="body2"
                          fontWeight={600}
                          sx={{
                            color: "primary.light",
                            textDecoration: "none",
                            "&:hover": { textDecoration: "underline" },
                          }}
                        >
                          {row.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {row.email}
                        </Typography>
                      </TableCell>
                      <TableCell>{row.role_label}</TableCell>
                      <TableCell>
                        {row.chapter_name ?? "—"}
                        {row.chapter_state ? ` (${row.chapter_state})` : ""}
                      </TableCell>
                      <TableCell>
                        <BoolChip ok={row.course_completed} />
                      </TableCell>
                      <TableCell>
                        <BoolChip ok={row.briefing_completed} />
                      </TableCell>
                      <TableCell>
                        <BoolChip ok={row.missions_started} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={filtered.length}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[25, 50, 100]}
            />
          </Paper>
        </>
      )}
    </Box>
  );
}
