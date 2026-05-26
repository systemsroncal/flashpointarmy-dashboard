"use client";

import {
  Box,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from "@mui/material";
import { AvatarWithGraduateIcon } from "@/components/dashboard/training/CourseGraduateBadge";
import type { TrainingGraduateBadgeRole } from "@/lib/courses/course-completion";
import { useMemo, useState } from "react";

export type CourseProgressRow = {
  uid: string;
  label: string;
  /** Optional avatar from `profiles.avatar_url`. Falls back to initials. */
  avatarUrl?: string | null;
  city: string | null;
  state: string | null;
  /** Human-readable primary role for reporting (e.g. Member, Local leader). */
  roleLabel: string;
  graduateBadge?: TrainingGraduateBadgeRole | null;
  done: number;
  quiz: { best: number; max: number } | null;
};

/**
 * Color buckets for the per-user completion progress bar.
 * Matches the verbal scale "rojo, naranja, amarillo, verde" requested for
 * fast scanning of who is behind / on-track.
 */
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

  const paged = useMemo(() => {
    if (rowsPerPage < 0) return rows;
    return rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [rows, page, rowsPerPage]);

  return (
    <Paper sx={{ bgcolor: "rgba(0,0,0,0.45)", overflow: "auto" }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: 56 }} />
            <TableCell>User</TableCell>
            <TableCell>City</TableCell>
            <TableCell>State</TableCell>
            <TableCell>Role</TableCell>
            <TableCell align="right">Sessions completed</TableCell>
            <TableCell sx={{ minWidth: 180 }}>Progress</TableCell>
            <TableCell align="right">Quiz (best attempt)</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8}>
                <Typography color="text.secondary">No progress recorded yet.</Typography>
              </TableCell>
            </TableRow>
          ) : (
            paged.map((r) => {
              const pct =
                totalSessions > 0
                  ? Math.max(0, Math.min(100, Math.round((r.done / totalSessions) * 100)))
                  : 0;
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
