"use client";

import { ManualLogForm } from "@/components/dashboard/logs/ManualLogForm";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
} from "@mui/material";
import type { PostgrestError } from "@supabase/supabase-js";
import { useMemo, useState } from "react";

export type AuditRow = {
  id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  payload: unknown;
  created_at: string | null;
  user_id: string | null;
};

function formatAuditDetails(payload: unknown): string {
  if (payload == null) return "—";
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    return typeof payload === "string" ? payload : JSON.stringify(payload);
  }
  const o = payload as Record<string, unknown>;
  const title = o.title != null && String(o.title).trim() !== "" ? String(o.title).trim() : null;
  const text = o.text != null && String(o.text).trim() !== "" ? String(o.text).trim() : null;
  const body = o.body != null && String(o.body).trim() !== "" ? String(o.body).trim() : null;
  const name = o.name != null && String(o.name).trim() !== "" ? String(o.name).trim() : null;
  const note = o.note != null && String(o.note).trim() !== "" ? String(o.note).trim() : null;
  if (title && text && text !== title) return `${title} — ${text}`;
  if (title) return title;
  if (text) return text;
  if (body) return body;
  if (name) return name;
  if (note) return note;
  const keys = Object.keys(o);
  if (keys.length === 0) return "—";
  return JSON.stringify(payload);
}

type LogSortKey = "date" | "action" | "entity" | "details";

export function LogsTable({
  rows,
  forbidden,
  error,
  canCreate = false,
}: {
  rows: AuditRow[];
  forbidden: boolean;
  error: PostgrestError | null;
  canCreate?: boolean;
}) {
  const [tableSearch, setTableSearch] = useState("");
  const [orderBy, setOrderBy] = useState<LogSortKey>("date");
  const [order, setOrder] = useState<"asc" | "desc">("desc");

  function handleRequestSort(property: LogSortKey) {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  }

  const displayed = useMemo(() => {
    if (forbidden || error) return [];
    const q = tableSearch.trim().toLowerCase();
    const base = !q
      ? rows
      : rows.filter((r) => {
          const blob = [
            r.created_at ? new Date(r.created_at).toLocaleString("en-US") : "",
            r.action,
            r.entity_type ?? "",
            r.entity_id ?? "",
            formatAuditDetails(r.payload),
          ]
            .join(" ")
            .toLowerCase();
          return blob.includes(q);
        });
    const dir = order === "asc" ? 1 : -1;
    return [...base].sort((a, b) => {
      switch (orderBy) {
        case "date": {
          const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
          const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dir * (ta - tb);
        }
        case "action":
          return dir * a.action.localeCompare(b.action, undefined, { sensitivity: "base" });
        case "entity": {
          const ea = `${a.entity_type ?? ""} ${a.entity_id ?? ""}`;
          const eb = `${b.entity_type ?? ""} ${b.entity_id ?? ""}`;
          return dir * ea.localeCompare(eb, undefined, { sensitivity: "base" });
        }
        case "details":
          return dir *
            formatAuditDetails(a.payload).localeCompare(formatAuditDetails(b.payload), undefined, {
              sensitivity: "base",
            });
        default:
          return 0;
      }
    });
  }, [rows, forbidden, error, tableSearch, order, orderBy]);

  if (forbidden) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography color="error">You do not have access to system logs.</Typography>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography color="error" paragraph>
          Could not load logs. Run the SQL migration in Supabase (see supabase/migrations) and
          check RLS policies.
        </Typography>
        <Typography variant="caption" component="pre" sx={{ whiteSpace: "pre-wrap" }}>
          {error.message}
        </Typography>
      </Paper>
    );
  }

  return (
    <>
      {canCreate ? <ManualLogForm /> : null}
      <Typography variant="h5" gutterBottom sx={{ color: "primary.main" }}>
        System log
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Recent events: role changes, locations created, and other audited actions.
      </Typography>
      <Box sx={{ mb: 2, maxWidth: 420 }}>
        <TextField
          size="small"
          fullWidth
          label="Search"
          placeholder="Date, action, entity, details…"
          value={tableSearch}
          onChange={(e) => setTableSearch(e.target.value)}
        />
      </Box>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={orderBy === "date"}
                  direction={orderBy === "date" ? order : "asc"}
                  onClick={() => handleRequestSort("date")}
                >
                  Date
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === "action"}
                  direction={orderBy === "action" ? order : "asc"}
                  onClick={() => handleRequestSort("action")}
                >
                  Action
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === "entity"}
                  direction={orderBy === "entity" ? order : "asc"}
                  onClick={() => handleRequestSort("entity")}
                >
                  Entity
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === "details"}
                  direction={orderBy === "details" ? order : "asc"}
                  onClick={() => handleRequestSort("details")}
                >
                  Details
                </TableSortLabel>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {displayed.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  {r.created_at ? new Date(r.created_at).toLocaleString("en-US") : "—"}
                </TableCell>
                <TableCell>{r.action}</TableCell>
                <TableCell>
                  {r.entity_type ?? "—"} {r.entity_id ? `#${r.entity_id}` : ""}
                </TableCell>
                <TableCell sx={{ maxWidth: 360, wordBreak: "break-word" }}>
                  {formatAuditDetails(r.payload)}
                </TableCell>
              </TableRow>
            ))}
            {displayed.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4}>
                  <Typography color="text.secondary" variant="body2">
                    No events yet. Actions in the app can write rows to audit_logs.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}
