"use client";

import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";

export type CourseProgressRow = {
  uid: string;
  label: string;
  done: number;
  quiz: { best: number; max: number } | null;
};

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
            <TableCell>User</TableCell>
            <TableCell align="right">Sessions completed</TableCell>
            <TableCell align="right">Quiz (best attempt)</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3}>
                <Typography color="text.secondary">No progress recorded yet.</Typography>
              </TableCell>
            </TableRow>
          ) : (
            paged.map((r) => (
              <TableRow key={r.uid}>
                <TableCell>{r.label}</TableCell>
                <TableCell align="right">
                  {r.done} / {totalSessions}
                </TableCell>
                <TableCell align="right">
                  {quizCount === 0 ? "—" : r.quiz ? `${r.quiz.best} / ${r.quiz.max}` : "—"}
                </TableCell>
              </TableRow>
            ))
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
