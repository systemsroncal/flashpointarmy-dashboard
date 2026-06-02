"use client";

import {
  AvatarWithGraduateIcon,
} from "@/components/dashboard/training/CourseGraduateBadge";
import type { ProgressRoleBucket } from "@/lib/courses/course-completion-stats";
import type { TrainingGraduateBadgeRole } from "@/lib/courses/course-completion";
import {
  Box,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";

export type CourseProgressRow = {
  uid: string;
  label: string;
  avatarUrl?: string | null;
  city: string | null;
  state: string | null;
  primaryChapterId?: string | null;
  roleLabel: string;
  roleBucket: ProgressRoleBucket;
  graduateBadge?: TrainingGraduateBadgeRole | null;
  done: number;
  quiz: { best: number; max: number } | null;
};

export type CourseProgressSortKey = "user" | "city" | "state" | "role" | "done" | "progress";

function progressColor(pct: number): { color: string; label: string } {
  if (pct >= 75) return { color: "#2a9d8f", label: "On track" };
  if (pct >= 50) return { color: "#e9c46a", label: "Halfway" };
  if (pct >= 25) return { color: "#f4a261", label: "Behind" };
  return { color: "#e63946", label: "Just started" };
}

function initialsFromLabel(label: string): string {
  const parts = label.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  const first = parts[0]?.charAt(0) ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.charAt(0) ?? "") : "";
  return (first + last).toUpperCase() || "?";
}

function pctForRow(r: CourseProgressRow, totalSessions: number): number {
  if (totalSessions <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((r.done / totalSessions) * 100)));
}

function compareRows(
  a: CourseProgressRow,
  b: CourseProgressRow,
  key: CourseProgressSortKey,
  asc: boolean,
  totalSessions: number
): number {
  let cmp = 0;
  switch (key) {
    case "user":
      cmp = a.label.localeCompare(b.label, undefined, { sensitivity: "base" });
      break;
    case "city":
      cmp = (a.city ?? "").localeCompare(b.city ?? "", undefined, { sensitivity: "base" });
      break;
    case "state":
      cmp = (a.state ?? "").localeCompare(b.state ?? "", undefined, { sensitivity: "base" });
      break;
    case "role":
      cmp = a.roleLabel.localeCompare(b.roleLabel, undefined, { sensitivity: "base" });
      break;
    case "done":
      cmp = a.done - b.done;
      break;
    case "progress":
      cmp = pctForRow(a, totalSessions) - pctForRow(b, totalSessions);
      break;
    default:
      cmp = 0;
  }
  if (cmp === 0) cmp = a.label.localeCompare(b.label, undefined, { sensitivity: "base" });
  return asc ? cmp : -cmp;
}

export function CourseProgressUsersTable({
  rows,
  totalSessions,
  quizCount,
}: {
  rows: CourseProgressRow[];
  totalSessions: number;
  quizCount: number;
}) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [sortKey, setSortKey] = useState<CourseProgressSortKey>("user");
  const [sortAsc, setSortAsc] = useState(true);

  const sorted = useMemo(
    () => [...rows].sort((a, b) => compareRows(a, b, sortKey, sortAsc, totalSessions)),
    [rows, sortKey, sortAsc, totalSessions]
  );

  const paged = useMemo(() => {
    if (rowsPerPage < 0) return sorted;
    return sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [sorted, page, rowsPerPage]);

  const toggleSort = (key: CourseProgressSortKey) => {
    if (sortKey === key) setSortAsc((v) => !v);
    else {
      setSortKey(key);
      setSortAsc(key === "user" || key === "city" || key === "state" || key === "role");
    }
    setPage(0);
  };

  const sortProps = (key: CourseProgressSortKey) => ({
    active: sortKey === key,
    direction: (sortKey === key ? (sortAsc ? "asc" : "desc") : "asc") as "asc" | "desc",
    onClick: () => toggleSort(key),
  });

  return (
    <Paper sx={{ bgcolor: "rgba(0,0,0,0.45)", maxWidth: "100%", overflow: "hidden" }}>
      <TableContainer
        sx={{
          width: "100%",
          maxWidth: "100%",
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
      <Table size="small" sx={{ minWidth: 720 }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: 56 }} />
            <TableCell sortDirection={sortKey === "user" ? (sortAsc ? "asc" : "desc") : false}>
              <TableSortLabel {...sortProps("user")}>User</TableSortLabel>
            </TableCell>
            <TableCell sortDirection={sortKey === "city" ? (sortAsc ? "asc" : "desc") : false}>
              <TableSortLabel {...sortProps("city")}>City</TableSortLabel>
            </TableCell>
            <TableCell sortDirection={sortKey === "state" ? (sortAsc ? "asc" : "desc") : false}>
              <TableSortLabel {...sortProps("state")}>State</TableSortLabel>
            </TableCell>
            <TableCell sortDirection={sortKey === "role" ? (sortAsc ? "asc" : "desc") : false}>
              <TableSortLabel {...sortProps("role")}>Role</TableSortLabel>
            </TableCell>
            <TableCell align="right" sortDirection={sortKey === "done" ? (sortAsc ? "asc" : "desc") : false}>
              <TableSortLabel {...sortProps("done")} sx={{ flexDirection: "row-reverse" }}>
                Sessions completed
              </TableSortLabel>
            </TableCell>
            <TableCell sx={{ minWidth: 180 }} sortDirection={sortKey === "progress" ? (sortAsc ? "asc" : "desc") : false}>
              <TableSortLabel {...sortProps("progress")}>Progress</TableSortLabel>
            </TableCell>
            <TableCell align="right">Quiz (best attempt)</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8}>
                <Typography color="text.secondary">No progress recorded yet for this filter.</Typography>
              </TableCell>
            </TableRow>
          ) : (
            paged.map((r) => {
              const pct = pctForRow(r, totalSessions);
              const tone = progressColor(pct);
              return (
                <TableRow key={r.uid}>
                  <TableCell sx={{ pr: 0 }}>
                    <AvatarWithGraduateIcon
                      graduateRole={r.graduateBadge}
                      size={36}
                      src={r.avatarUrl ?? undefined}
                      alt={r.label}
                      avatarSx={{
                        bgcolor: "rgba(233,196,106,0.18)",
                        color: "primary.main",
                      }}
                    >
                      {initialsFromLabel(r.label)}
                    </AvatarWithGraduateIcon>
                  </TableCell>
                  <TableCell>{r.label}</TableCell>
                  <TableCell>{r.city?.trim() || "—"}</TableCell>
                  <TableCell>{r.state?.trim() || "—"}</TableCell>
                  <TableCell>{r.roleLabel}</TableCell>
                  <TableCell align="right">
                    {r.done} / {totalSessions}
                  </TableCell>
                  <TableCell>
                    <Stack spacing={0.5} sx={{ minWidth: 160 }}>
                      <Box
                        sx={{
                          position: "relative",
                          width: "100%",
                          height: 10,
                          borderRadius: 999,
                          bgcolor: "rgba(255,255,255,0.08)",
                          overflow: "hidden",
                        }}
                      >
                        <LinearProgress
                          variant="determinate"
                          value={pct}
                          sx={{
                            height: "100%",
                            bgcolor: "transparent",
                            "& .MuiLinearProgress-bar": {
                              bgcolor: tone.color,
                              borderRadius: 999,
                            },
                          }}
                        />
                      </Box>
                      <Typography
                        variant="caption"
                        sx={{ color: tone.color, fontVariantNumeric: "tabular-nums" }}
                      >
                        {pct}% · {tone.label}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell align="right">
                    {quizCount === 0 ? "—" : r.quiz ? `${r.quiz.best} / ${r.quiz.max}` : "—"}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
      </TableContainer>
      {rows.length > 0 ? (
        <TablePagination
          component="div"
          count={rows.length}
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
      ) : null}
    </Paper>
  );
}
