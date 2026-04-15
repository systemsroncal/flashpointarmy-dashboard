"use client";

import { ManualLogForm } from "@/components/dashboard/logs/ManualLogForm";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import type { PostgrestError } from "@supabase/supabase-js";

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
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Entity</TableCell>
              <TableCell>Details</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r) => (
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
            {rows.length === 0 ? (
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
