"use client";

import type { JourneyProgressRow, JourneyProgressStats } from "@/lib/onboarding/journey-progress-stats";
import type { JourneyProgressFilter } from "@/lib/onboarding/journey-progress-stats";
import type { JourneyProgressSortKey } from "@/lib/onboarding/journey-progress-table-sort";
import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import Link from "next/link";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import SearchIcon from "@mui/icons-material/Search";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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

function emailFromSuggestionLabel(label: string): string {
  const idx = label.lastIndexOf(" — ");
  return idx >= 0 ? label.slice(idx + 3).trim() : label.trim();
}

export function JourneyProgressAdminClient({
  initialStats,
}: {
  initialStats: JourneyProgressStats;
}) {
  const [tab, setTab] = useState<"people" | "stats">("people");
  const [stats, setStats] = useState(initialStats);
  const [statsLoading, setStatsLoading] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [searchCommitted, setSearchCommitted] = useState("");
  const searchInputRef = useRef("");
  searchInputRef.current = searchInput;

  const [filter, setFilter] = useState<JourneyProgressFilter>("all");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [orderBy, setOrderBy] = useState<JourneyProgressSortKey>("progress");
  const [order, setOrder] = useState<"asc" | "desc">("desc");

  const [rows, setRows] = useState<JourneyProgressRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [tableLoading, setTableLoading] = useState(true);
  const [tableFetchError, setTableFetchError] = useState<string | null>(null);

  const [searchOptions, setSearchOptions] = useState<Array<{ id: string; label: string }>>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);

  const applySearchQuery = useCallback((raw: string) => {
    setSearchCommitted(raw.trim());
    setPage(0);
  }, []);

  useEffect(() => {
    setPage(0);
  }, [searchCommitted, orderBy, order, filter]);

  const fetchRows = useCallback(async () => {
    setTableLoading(true);
    setTableFetchError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        perPage: String(rowsPerPage < 0 ? 200 : rowsPerPage),
        filter,
        sort: orderBy,
        order,
      });
      if (searchCommitted.length >= 2) {
        params.set("q", searchCommitted);
      }
      const res = await fetch(`/api/onboarding/journey-progress?${params.toString()}`, {
        cache: "no-store",
      });
      const payload = (await res.json()) as {
        rows?: JourneyProgressRow[];
        total?: number;
        error?: string;
      };
      if (!res.ok) {
        setTableFetchError(payload.error || res.statusText || "Could not load journey progress.");
        return;
      }
      setRows(payload.rows ?? []);
      setTotalCount(payload.total ?? 0);
    } finally {
      setTableLoading(false);
    }
  }, [page, rowsPerPage, filter, orderBy, order, searchCommitted]);

  useEffect(() => {
    if (tab !== "people") return;
    void fetchRows();
  }, [fetchRows, tab]);

  useEffect(() => {
    const q = searchInput.trim();
    if (q.length < 2) {
      setSearchOptions([]);
      setSearchLoading(false);
      return;
    }
    const tid = window.setTimeout(async () => {
      setSearchLoading(true);
      try {
        const params = new URLSearchParams({ autocomplete: "1", q });
        const res = await fetch(`/api/onboarding/journey-progress?${params.toString()}`, {
          cache: "no-store",
        });
        const payload = (await res.json()) as { options?: Array<{ id: string; label: string }> };
        if (!res.ok) return;
        setSearchOptions(payload.options ?? []);
      } finally {
        setSearchLoading(false);
      }
    }, 250);
    return () => window.clearTimeout(tid);
  }, [searchInput]);

  const refreshStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch("/api/onboarding/journey-progress?view=stats", { cache: "no-store" });
      const payload = (await res.json()) as { stats?: JourneyProgressStats; error?: string };
      if (res.ok && payload.stats) setStats(payload.stats);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "stats") void refreshStats();
  }, [tab, refreshStats]);

  function handleRequestSort(property: JourneyProgressSortKey) {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  }

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
                formatter: () => String(stats.total),
              },
            },
          },
        },
      },
    }),
    [stats.total]
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
        <Tab value="people" label={`People (${totalCount || stats.total})`} />
        <Tab value="stats" label="Statistics" />
      </Tabs>

      {tab === "stats" ? (
        <Stack spacing={2}>
          {statsLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={32} />
            </Box>
          ) : (
            <>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(4, 1fr)" },
                  gap: 2,
                }}
              >
                <StatCard label="People tracked" value={stats.total} />
                <StatCard
                  label="Course completed"
                  value={stats.courseCompleted}
                  hint={`${
                    stats.total ? Math.round((stats.courseCompleted / stats.total) * 100) : 0
                  }%`}
                />
                <StatCard label="Briefing completed" value={stats.briefingCompleted} />
                <StatCard label="Missions started" value={stats.missionsStarted} />
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
                          stats.courseCompleted,
                          stats.briefingCompleted,
                          stats.missionsStarted,
                          stats.allThree,
                          stats.noneStarted,
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
                      stats.courseCompleted,
                      Math.max(0, stats.total - stats.courseCompleted),
                    ]}
                    options={donutOpts}
                  />
                </Paper>
              </Box>
            </>
          )}
        </Stack>
      ) : (
        <>
          <Paper sx={{ p: 2, mb: 2, bgcolor: "rgba(0,0,0,0.35)" }}>
            <Stack spacing={1.5}>
              <Stack direction="row" flexWrap="wrap" gap={0.75} useFlexGap>
                {(
                  [
                    ["all", "All"],
                    ["all_three", "All three"],
                    ["course", "Course done"],
                    ["briefing", "Briefing done"],
                    ["missions", "Missions started"],
                    ["none", "None"],
                  ] as const
                ).map(([value, label]) => (
                  <Chip
                    key={value}
                    label={label}
                    size="small"
                    clickable
                    color={filter === value ? "primary" : "default"}
                    variant={filter === value ? "filled" : "outlined"}
                    onClick={() => {
                      setFilter(value);
                      setPage(0);
                    }}
                  />
                ))}
              </Stack>
              <Box sx={{ position: "relative", maxWidth: 480 }}>
                <TextField
                  size="small"
                  fullWidth
                  label="Search"
                  placeholder="Email, name, role, chapter. Press Enter or the search icon to run."
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                    setSuggestionsOpen(true);
                  }}
                  onFocus={() => {
                    if (searchInput.trim().length >= 2) setSuggestionsOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      applySearchQuery(searchInput);
                    }
                  }}
                  onBlur={() => {
                    window.setTimeout(() => {
                      setSuggestionsOpen(false);
                      applySearchQuery(searchInputRef.current);
                    }, 200);
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          aria-label="Run search"
                          edge="end"
                          onMouseDown={(ev) => ev.preventDefault()}
                          onClick={() => applySearchQuery(searchInput)}
                        >
                          <SearchIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                {suggestionsOpen && searchOptions.length > 0 && searchInput.trim().length >= 2 ? (
                  <Paper
                    elevation={6}
                    sx={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      zIndex: 20,
                      mt: 0.5,
                      maxHeight: 260,
                      overflow: "auto",
                    }}
                  >
                    <List dense disablePadding>
                      {searchOptions.map((opt) => (
                        <ListItemButton
                          key={opt.id}
                          onMouseDown={(ev) => ev.preventDefault()}
                          onClick={() => {
                            const email = emailFromSuggestionLabel(opt.label);
                            setSearchInput(email);
                            applySearchQuery(email);
                          }}
                        >
                          {opt.label}
                        </ListItemButton>
                      ))}
                    </List>
                  </Paper>
                ) : null}
                {searchLoading ? (
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
                    Loading suggestions…
                  </Typography>
                ) : null}
              </Box>
            </Stack>
          </Paper>

          {tableFetchError ? <Alert severity="error" sx={{ mb: 2 }}>{tableFetchError}</Alert> : null}

          <Paper sx={{ bgcolor: "rgba(0,0,0,0.35)" }}>
            <TableContainer sx={{ overflowX: "auto" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sortDirection={orderBy === "name" ? order : false}>
                      <TableSortLabel
                        active={orderBy === "name"}
                        direction={orderBy === "name" ? order : "asc"}
                        onClick={() => handleRequestSort("name")}
                      >
                        Person
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sortDirection={orderBy === "role" ? order : false}>
                      <TableSortLabel
                        active={orderBy === "role"}
                        direction={orderBy === "role" ? order : "asc"}
                        onClick={() => handleRequestSort("role")}
                      >
                        Role
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sortDirection={orderBy === "chapter" ? order : false}>
                      <TableSortLabel
                        active={orderBy === "chapter"}
                        direction={orderBy === "chapter" ? order : "asc"}
                        onClick={() => handleRequestSort("chapter")}
                      >
                        Chapter
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sortDirection={orderBy === "course" ? order : false}>
                      <TableSortLabel
                        active={orderBy === "course"}
                        direction={orderBy === "course" ? order : "asc"}
                        onClick={() => handleRequestSort("course")}
                      >
                        Course
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sortDirection={orderBy === "briefing" ? order : false}>
                      <TableSortLabel
                        active={orderBy === "briefing"}
                        direction={orderBy === "briefing" ? order : "asc"}
                        onClick={() => handleRequestSort("briefing")}
                      >
                        Mission Briefing
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sortDirection={orderBy === "missions" ? order : false}>
                      <TableSortLabel
                        active={orderBy === "missions"}
                        direction={orderBy === "missions" ? order : "asc"}
                        onClick={() => handleRequestSort("missions")}
                      >
                        Missions started
                      </TableSortLabel>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tableLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ py: 4, textAlign: "center" }}>
                        <CircularProgress size={28} />
                      </TableCell>
                    </TableRow>
                  ) : rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ py: 4, textAlign: "center", color: "text.secondary" }}>
                        No people match your search.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((row) => (
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
            </TableContainer>
            <TablePagination
              component="div"
              count={totalCount}
              page={rowsPerPage < 0 ? 0 : page}
              onPageChange={(_, nextPage) => setPage(nextPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                const v = Number(e.target.value);
                setRowsPerPage(v);
                setPage(0);
              }}
              rowsPerPageOptions={[10, 20, 25, 50, 100, { label: "All", value: -1 }]}
            />
          </Paper>
        </>
      )}
    </Box>
  );
}
