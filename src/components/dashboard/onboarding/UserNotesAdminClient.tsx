"use client";

import type { PersonNoteAdminRow } from "@/lib/people/person-notes-admin";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function notePreview(body: string, max = 120): string {
  const flat = body.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  return `${flat.slice(0, max)}…`;
}

export function UserNotesAdminClient() {
  const [rows, setRows] = useState<PersonNoteAdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCommitted, setSearchCommitted] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);

  const [viewRow, setViewRow] = useState<PersonNoteAdminRow | null>(null);
  const [editRow, setEditRow] = useState<PersonNoteAdminRow | null>(null);
  const [editBody, setEditBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const loadRows = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        perPage: String(rowsPerPage),
      });
      if (searchCommitted) params.set("q", searchCommitted);
      const res = await fetch(`/api/people/notes?${params.toString()}`, { cache: "no-store" });
      const json = (await res.json()) as {
        error?: string;
        rows?: PersonNoteAdminRow[];
        total?: number;
      };
      if (!res.ok) throw new Error(json.error ?? "Failed to load notes.");
      setRows(json.rows ?? []);
      setTotalCount(json.total ?? 0);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load notes.");
      setRows([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, searchCommitted]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  function openEdit(row: PersonNoteAdminRow) {
    setEditRow(row);
    setEditBody(row.body);
    setSaveError(null);
  }

  async function submitEdit() {
    if (!editRow) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/people/notes/${editRow.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: editBody }),
      });
      const json = (await res.json()) as { error?: string; item?: PersonNoteAdminRow };
      if (!res.ok) throw new Error(json.error ?? "Could not save note.");
      setEditRow(null);
      await loadRows();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Could not save note.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="h5" fontWeight={800} sx={{ mb: 0.5 }}>
          User Notes
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Staff notes across all person profiles — who the note is about, who wrote it, and when.
        </Typography>
      </Box>

      <Paper elevation={0} sx={{ p: 2, bgcolor: "rgba(0,0,0,0.35)" }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }}>
          <TextField
            size="small"
            placeholder="Search by person, email, or note text…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setPage(0);
                setSearchCommitted(searchQuery.trim());
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ flex: 1, minWidth: 220 }}
          />
          <Button
            variant="contained"
            onClick={() => {
              setPage(0);
              setSearchCommitted(searchQuery.trim());
            }}
          >
            Search
          </Button>
        </Stack>
      </Paper>

      {loadError ? <Alert severity="error">{loadError}</Alert> : null}

      <TableContainer component={Paper} elevation={0} sx={{ bgcolor: "rgba(0,0,0,0.35)" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Date & time</TableCell>
              <TableCell>About</TableCell>
              <TableCell>Author</TableCell>
              <TableCell>Note</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            ) : !rows.length ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">No notes found.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>{formatWhen(row.created_at)}</TableCell>
                  <TableCell>
                    <Link
                      href={`/dashboard/people/${row.person_user_id}?from=notes&tab=notes`}
                      style={{ color: "#38bdf8", textDecoration: "none", fontWeight: 600 }}
                    >
                      {row.person_name}
                    </Link>
                    <Typography variant="caption" display="block" color="text.secondary">
                      {row.person_email}
                    </Typography>
                  </TableCell>
                  <TableCell>{row.author_name}</TableCell>
                  <TableCell sx={{ maxWidth: 360 }}>{notePreview(row.body)}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      <Tooltip title="View">
                        <IconButton size="small" onClick={() => setViewRow(row)} aria-label="View note">
                          <VisibilityOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => openEdit(row)} aria-label="Edit note">
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={(_, next) => setPage(next)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(Number(e.target.value));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      </TableContainer>

      <Dialog open={!!viewRow} onClose={() => setViewRow(null)} fullWidth maxWidth="sm">
        <DialogTitle>Note details</DialogTitle>
        <DialogContent dividers>
          {viewRow ? (
            <Stack spacing={1.5}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  About
                </Typography>
                <Typography fontWeight={600}>{viewRow.person_name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {viewRow.person_email}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Author
                </Typography>
                <Typography>{viewRow.author_name}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Created
                </Typography>
                <Typography>{formatWhen(viewRow.created_at)}</Typography>
              </Box>
              {viewRow.updated_at !== viewRow.created_at ? (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Last updated
                  </Typography>
                  <Typography>{formatWhen(viewRow.updated_at)}</Typography>
                </Box>
              ) : null}
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Note
                </Typography>
                <Typography sx={{ whiteSpace: "pre-wrap", mt: 0.5 }}>{viewRow.body}</Typography>
              </Box>
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewRow(null)}>Close</Button>
          {viewRow ? (
            <Button
              variant="contained"
              onClick={() => {
                const row = viewRow;
                setViewRow(null);
                openEdit(row);
              }}
            >
              Edit
            </Button>
          ) : null}
        </DialogActions>
      </Dialog>

      <Dialog open={!!editRow} onClose={() => !saving && setEditRow(null)} fullWidth maxWidth="sm">
        <DialogTitle>Edit note</DialogTitle>
        <DialogContent dividers>
          {editRow ? (
            <Stack spacing={1.5}>
              <Typography variant="body2" color="text.secondary">
                About {editRow.person_name} · by {editRow.author_name}
              </Typography>
              <TextField
                multiline
                minRows={6}
                fullWidth
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
              />
              {saveError ? <Alert severity="error">{saveError}</Alert> : null}
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditRow(null)} disabled={saving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={() => void submitEdit()} disabled={saving || !editBody.trim()}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
