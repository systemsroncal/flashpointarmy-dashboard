"use client";

import { createClient } from "@/utils/supabase/client";
import DeleteOutline from "@mui/icons-material/DeleteOutline";
import Edit from "@mui/icons-material/Edit";
import Visibility from "@mui/icons-material/Visibility";
import {
  US_STATES,
  filterUsStatesByQuery,
  usStateByCode,
  usStateById,
  type USStateOption,
} from "@/data/usStates";
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  LinearProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useSyncedState } from "@/hooks/useSyncedState";
import { parseUploadFile } from "@/lib/import/parse-upload";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export type ChapterRow = {
  id: string;
  name: string;
  address_line: string | null;
  city: string | null;
  state: string;
  zip_code: string | null;
  status: string;
  created_at: string;
};

const STATUS_LABEL: Record<string, string> = {
  approved: "Approved",
  pending_approval: "Pending Approval",
  created: "Created",
};

function statusColor(status: string) {
  if (status === "approved") return "success";
  if (status === "pending_approval") return "info";
  return "warning";
}

function StateSearchAutocomplete({
  value,
  onChange,
  required,
  label = "State",
}: {
  value: USStateOption | null;
  onChange: (next: USStateOption | null) => void;
  required?: boolean;
  label?: string;
}) {
  return (
    <Autocomplete
      options={US_STATES}
      value={value}
      onChange={(_, v) => onChange(v)}
      getOptionLabel={(o) => `${o.name} (${o.code})`}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      filterOptions={(opts, state) => filterUsStatesByQuery(opts, state.inputValue)}
      renderOption={(props, option) => {
        const { key, ...optionProps } = props;
        return (
          <li key={key} {...optionProps}>
            <Box>
              <Typography variant="body2">{option.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                Code {option.code} · State ID {option.id}
              </Typography>
            </Box>
          </li>
        );
      }}
      renderInput={(params) => (
        <TextField {...params} label={label} required={required} placeholder="Search name or code…" />
      )}
    />
  );
}

type LeaderOption = { id: string; label: string };

function LeadersMultiAutocomplete({
  options,
  value,
  onChange,
  label,
}: {
  options: LeaderOption[];
  value: string[];
  onChange: (ids: string[]) => void;
  label: string;
}) {
  const byId = useMemo(() => new Map(options.map((o) => [o.id, o] as const)), [options]);
  const selected = useMemo(
    () => value.map((id) => byId.get(id)).filter(Boolean) as LeaderOption[],
    [value, byId]
  );
  return (
    <Autocomplete
      multiple
      options={options}
      value={selected}
      onChange={(_, v) => onChange(v.map((o) => o.id))}
      getOptionLabel={(o) => o.label}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      filterOptions={(opts, state) => {
        const q = state.inputValue.trim().toLowerCase();
        if (!q) return opts;
        return opts.filter((o) => o.label.toLowerCase().includes(q));
      }}
      renderInput={(params) => (
        <TextField {...params} label={label} placeholder="Search name or email…" />
      )}
    />
  );
}

export function ChaptersSection({
  initialRows,
  leaderOptions,
  leadersByChapter: initialLeadersByChapter,
  canRead,
  canCreate,
  canUpdate,
  canDelete,
}: {
  initialRows: ChapterRow[];
  leaderOptions: LeaderOption[];
  /** chapter id → comma-separated leader labels */
  leadersByChapter: Record<string, string>;
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [rows, setRows] = useSyncedState(initialRows);
  const [leadersByChapter] = useSyncedState(initialLeadersByChapter);
  const [filter, setFilter] = useState<string>("all");
  const [viewRow, setViewRow] = useState<ChapterRow | null>(null);
  const [editRow, setEditRow] = useState<ChapterRow | null>(null);
  const [editLeaders, setEditLeaders] = useState<string[]>([]);
  /** Leader IDs when the edit dialog was opened — used to diff adds/removes and avoid re-triggering DB inserts. */
  const [editLeadersBaseline, setEditLeadersBaseline] = useState<string[]>([]);
  const [deleteRow, setDeleteRow] = useState<ChapterRow | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deps, setDeps] = useState<Record<string, number> | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importRows, setImportRows] = useState<Record<string, string>[]>([]);
  const [importFileName, setImportFileName] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<
    { status: "imported" | "omitted"; chapter?: string; reason?: string }[]
  >([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [createLeaders, setCreateLeaders] = useState<string[]>([]);
  const [createForm, setCreateForm] = useState({
    name: "",
    address_line: "",
    city: "",
    /** FIPS state id (value of the state select). */
    stateId: "",
    zip_code: "",
    status: "created" as ChapterRow["status"],
  });

  const filtered = useMemo(() => {
    if (filter === "all") return rows;
    return rows.filter((r) => r.status === filter);
  }, [rows, filter]);
  const paged = useMemo(() => {
    if (rowsPerPage < 0) return filtered;
    return filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filtered, page, rowsPerPage]);

  async function loadLeadersForChapter(chapterId: string) {
    const supabase = createClient();
    const { data } = await supabase
      .from("chapter_leaders")
      .select("user_id")
      .eq("chapter_id", chapterId);
    const ids = (data ?? []).map((r: { user_id: string }) => r.user_id);
    setEditLeaders(ids);
    setEditLeadersBaseline([...ids]);
  }

  async function openEdit(row: ChapterRow) {
    setEditRow(row);
    await loadLeadersForChapter(row.id);
  }

  async function openDelete(row: ChapterRow) {
    setDeleteRow(row);
    setDeleteConfirm("");
    const supabase = createClient();
    const { data, error } = await supabase.rpc("chapter_dependency_counts", {
      p_chapter_id: row.id,
    });
    if (!error && data && typeof data === "object") {
      setDeps(data as Record<string, number>);
    } else {
      setDeps(null);
    }
  }

  async function saveEdit() {
    if (!editRow) return;
    const st = editRow.state.trim().toUpperCase().slice(0, 2);
    if (!st || !usStateByCode(st)) return;
    const supabase = createClient();
    const { data: updated, error: upErr } = await supabase
      .from("chapters")
      .update({
        name: editRow.name,
        address_line: editRow.address_line,
        city: editRow.city,
        state: st,
        zip_code: editRow.zip_code,
        status: editRow.status,
      })
      .eq("id", editRow.id)
      .select("id,name,address_line,city,state,zip_code,status,created_at")
      .single();

    if (upErr || !updated) return;

    const baseline = editLeadersBaseline;
    const current = editLeaders;
    const toRemove = baseline.filter((id) => !current.includes(id));
    const toAdd = current.filter((id) => !baseline.includes(id));

    for (const uid of toRemove) {
      await supabase
        .from("chapter_leaders")
        .delete()
        .eq("chapter_id", editRow.id)
        .eq("user_id", uid);
    }
    if (toAdd.length > 0) {
      await supabase.from("chapter_leaders").insert(
        toAdd.map((uid) => ({ chapter_id: editRow.id, user_id: uid }))
      );
    }

    for (const uid of toAdd) {
      void fetch("/api/email/local-leader-assigned", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: uid, chapterId: editRow.id }),
      });
    }

    setRows((prev) =>
      prev.map((r) => (r.id === updated.id ? (updated as ChapterRow) : r))
    );
    setEditRow(null);
    router.refresh();
  }

  async function confirmDelete() {
    if (!deleteRow || deleteConfirm !== "DELETE") return;
    const supabase = createClient();
    await supabase.from("chapters").delete().eq("id", deleteRow.id);
    setDeleteRow(null);
    setRows((r) => r.filter((x) => x.id !== deleteRow.id));
    router.refresh();
  }

  function resetCreateForm() {
    setCreateForm({
      name: "",
      address_line: "",
      city: "",
      stateId: "",
      zip_code: "",
      status: "created",
    });
    setCreateLeaders([]);
  }

  async function saveCreate() {
    const name = createForm.name.trim();
    const st = usStateById(createForm.stateId);
    const state = st?.code ?? "";
    if (!name || !state) return;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: inserted, error } = await supabase
      .from("chapters")
      .insert({
        name,
        address_line: createForm.address_line.trim() || null,
        city: createForm.city.trim() || null,
        state,
        zip_code: createForm.zip_code.trim() || null,
        status: createForm.status,
        created_by: user?.id ?? null,
      })
      .select("id,name,address_line,city,state,zip_code,status,created_at")
      .single();
    if (error || !inserted) return;
    if (createLeaders.length > 0) {
      await supabase.from("chapter_leaders").insert(
        createLeaders.map((uid) => ({ chapter_id: inserted.id, user_id: uid }))
      );
      for (const uid of createLeaders) {
        void fetch("/api/email/local-leader-assigned", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetUserId: uid, chapterId: inserted.id }),
        });
      }
    }
    setRows((r) => [...r, inserted as ChapterRow]);
    setCreateOpen(false);
    resetCreateForm();
    router.refresh();
  }

  async function onPickImportFile(file: File) {
    setImportError(null);
    setImportResults([]);
    const parsed = await parseUploadFile(file);
    if (parsed.error) {
      setImportError(parsed.error);
      setImportRows([]);
      setImportFileName("");
      return;
    }
    setImportRows(parsed.rows);
    setImportFileName(file.name);
  }

  async function runImport() {
    if (importRows.length === 0) {
      setImportError("Upload a file with records first.");
      return;
    }
    setImporting(true);
    setImportError(null);
    setImportProgress(0);
    const chunkSize = 100;
    let processed = 0;
    const allResults: { status: "imported" | "omitted"; chapter?: string; reason?: string }[] = [];
    try {
      for (let i = 0; i < importRows.length; i += chunkSize) {
        const chunk = importRows.slice(i, i + chunkSize);
        const res = await fetch("/api/import/chapters", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rows: chunk }),
        });
        const payload = (await res.json()) as {
          error?: string;
          results?: { status: "imported" | "omitted"; chapter?: string; reason?: string }[];
        };
        if (!res.ok) {
          setImportError(payload.error || "Import failed.");
          break;
        }
        allResults.push(...(payload.results ?? []));
        processed += chunk.length;
        setImportProgress(Math.round((processed / importRows.length) * 100));
      }
      setImportResults(allResults);
      router.refresh();
    } finally {
      setImporting(false);
    }
  }

  if (!canRead) {
    return (
      <Paper sx={{ p: 3, bgcolor: "rgba(0,0,0,0.45)" }}>
        <Typography color="error">You do not have access to Chapters.</Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 800, color: "primary.main", mb: 2 }}>
        Chapters
      </Typography>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 1,
          mb: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {canCreate ? (
            <>
              <Button
                variant="contained"
                size="small"
                onClick={() => {
                  resetCreateForm();
                  setCreateOpen(true);
                }}
              >
                Add new
              </Button>
              <Button variant="outlined" size="small" onClick={() => setImportOpen(true)}>
                Import Chapters
              </Button>
            </>
          ) : null}
        </Box>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="ch-filter">Status</InputLabel>
          <Select
            labelId="ch-filter"
            label="Status"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <MenuItem value="all">All statuses</MenuItem>
            <MenuItem value="approved">Approved</MenuItem>
            <MenuItem value="pending_approval">Pending Approval</MenuItem>
            <MenuItem value="created">Created</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Paper sx={{ bgcolor: "rgba(0,0,0,0.45)", overflow: "auto" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: "primary.main", fontWeight: 700 }}>Chapter location</TableCell>
              <TableCell sx={{ color: "primary.main", fontWeight: 700 }}>Leaders</TableCell>
              <TableCell sx={{ color: "primary.main", fontWeight: 700 }}>State</TableCell>
              <TableCell sx={{ color: "primary.main", fontWeight: 700 }}>Status</TableCell>
              <TableCell sx={{ color: "primary.main", fontWeight: 700 }} align="right">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paged.map((row) => {
              const stOpt = usStateByCode(row.state);
              return (
              <TableRow key={row.id}>
                <TableCell>{row.name}</TableCell>
                <TableCell sx={{ maxWidth: 280 }}>
                  <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
                    {leadersByChapter[row.id]?.trim() || "—"}
                  </Typography>
                </TableCell>
                <TableCell>
                  {stOpt ? `${stOpt.name} (${row.state})` : row.state}
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={STATUS_LABEL[row.status] ?? row.status}
                    color={statusColor(row.status) as "success" | "info" | "warning"}
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" color="inherit" onClick={() => setViewRow(row)} aria-label="View">
                    <Visibility fontSize="small" />
                  </IconButton>
                  {canUpdate ? (
                    <IconButton size="small" color="primary" onClick={() => void openEdit(row)} aria-label="Edit">
                      <Edit fontSize="small" />
                    </IconButton>
                  ) : null}
                  {canDelete ? (
                    <IconButton size="small" color="error" onClick={() => void openDelete(row)} aria-label="Delete">
                      <DeleteOutline fontSize="small" />
                    </IconButton>
                  ) : null}
                </TableCell>
              </TableRow>
            );
            })}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={filtered.length}
          page={rowsPerPage < 0 ? 0 : page}
          onPageChange={(_, nextPage) => setPage(nextPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            const v = Number(e.target.value);
            setRowsPerPage(v);
            setPage(0);
          }}
          rowsPerPageOptions={[
            10,
            20,
            25,
            50,
            100,
            { label: "All", value: -1 },
          ]}
        />
      </Paper>

      <Dialog open={!!viewRow} onClose={() => setViewRow(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Chapter details</DialogTitle>
        <DialogContent>
          {viewRow ? (
            <Box sx={{ display: "grid", gap: 1, pt: 1 }}>
              <Typography><strong>Name:</strong> {viewRow.name}</Typography>
              <Typography><strong>Address:</strong> {viewRow.address_line ?? "—"}</Typography>
              <Typography><strong>City:</strong> {viewRow.city ?? "—"}</Typography>
              <Typography>
                <strong>State:</strong>{" "}
                {(() => {
                  const v = usStateByCode(viewRow.state);
                  return v ? `${v.name} (${v.code}, state ID ${v.id})` : viewRow.state;
                })()}
              </Typography>
              <Typography><strong>ZIP:</strong> {viewRow.zip_code ?? "—"}</Typography>
              <Typography><strong>Status:</strong> {STATUS_LABEL[viewRow.status] ?? viewRow.status}</Typography>
              <Typography>
                <strong>Leaders:</strong> {leadersByChapter[viewRow.id]?.trim() || "—"}
              </Typography>
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewRow(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!editRow} onClose={() => setEditRow(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit chapter</DialogTitle>
        <DialogContent>
          {editRow ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
              <TextField
                label="Chapter name"
                fullWidth
                value={editRow.name}
                onChange={(e) => setEditRow({ ...editRow, name: e.target.value })}
              />
              <TextField
                label="Address"
                fullWidth
                value={editRow.address_line ?? ""}
                onChange={(e) => setEditRow({ ...editRow, address_line: e.target.value })}
              />
              <TextField
                label="City"
                fullWidth
                value={editRow.city ?? ""}
                onChange={(e) => setEditRow({ ...editRow, city: e.target.value })}
              />
              <StateSearchAutocomplete
                label="State"
                required
                value={usStateByCode(editRow.state)}
                onChange={(opt) =>
                  setEditRow({ ...editRow, state: opt?.code ?? "" })
                }
              />
              <TextField
                label="ZIP code"
                value={editRow.zip_code ?? ""}
                onChange={(e) => setEditRow({ ...editRow, zip_code: e.target.value })}
              />
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  label="Status"
                  value={editRow.status}
                  onChange={(e) =>
                    setEditRow({ ...editRow, status: e.target.value })
                  }
                >
                  <MenuItem value="created">Created</MenuItem>
                  <MenuItem value="pending_approval">Pending Approval</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                </Select>
              </FormControl>
              <LeadersMultiAutocomplete
                label="Leaders"
                options={leaderOptions}
                value={editLeaders}
                onChange={setEditLeaders}
              />
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditRow(null)}>Cancel</Button>
          {canUpdate ? (
            <Button
              variant="contained"
              onClick={() => void saveEdit()}
              disabled={!editRow || !usStateByCode(editRow.state)}
            >
              Save
            </Button>
          ) : null}
        </DialogActions>
      </Dialog>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add chapter</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <TextField
              label="Chapter name"
              fullWidth
              required
              value={createForm.name}
              onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
            />
            <TextField
              label="Address"
              fullWidth
              value={createForm.address_line}
              onChange={(e) => setCreateForm((f) => ({ ...f, address_line: e.target.value }))}
            />
            <TextField
              label="City"
              fullWidth
              value={createForm.city}
              onChange={(e) => setCreateForm((f) => ({ ...f, city: e.target.value }))}
            />
            <StateSearchAutocomplete
              label="State"
              required
              value={usStateById(createForm.stateId)}
              onChange={(opt) =>
                setCreateForm((f) => ({ ...f, stateId: opt?.id ?? "" }))
              }
            />
            <TextField
              label="ZIP code"
              value={createForm.zip_code}
              onChange={(e) => setCreateForm((f) => ({ ...f, zip_code: e.target.value }))}
            />
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                label="Status"
                value={createForm.status}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, status: e.target.value as ChapterRow["status"] }))
                }
              >
                <MenuItem value="created">Created</MenuItem>
                <MenuItem value="pending_approval">Pending Approval</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
              </Select>
            </FormControl>
            <LeadersMultiAutocomplete
              label="Leaders (optional)"
              options={leaderOptions}
              value={createLeaders}
              onChange={setCreateLeaders}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          {canCreate ? (
            <Button
              variant="contained"
              onClick={() => void saveCreate()}
              disabled={!createForm.name.trim() || !createForm.stateId}
            >
              Create
            </Button>
          ) : null}
        </DialogActions>
      </Dialog>

      <Dialog open={importOpen} onClose={() => !importing && setImportOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Import Chapters</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: "grid", gap: 2 }}>
            {importError ? <Typography color="error">{importError}</Typography> : null}
            <Typography variant="body2" color="text.secondary">
              Optional columns per row: <strong>Leader email</strong>, <strong>Leader name</strong>,{" "}
              <strong>Leader phone</strong> — after each chapter is created, the app creates a local leader account or
              links an existing user to that chapter.
            </Typography>
            <Button component="label" variant="outlined" disabled={importing}>
              Upload Excel, CSV, or JSON
              <input
                hidden
                type="file"
                accept=".xlsx,.xls,.csv,.json"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void onPickImportFile(f);
                }}
              />
            </Button>
            <Typography variant="body2" color="text.secondary">
              File: {importFileName || "—"} | Records detected: {importRows.length}
            </Typography>
            {importing ? <LinearProgress variant="determinate" value={importProgress} /> : null}
            {importResults.length > 0 ? (
              <Box sx={{ maxHeight: 260, overflow: "auto", border: "1px solid rgba(255,255,255,0.12)", p: 1 }}>
                {importResults.map((r, idx) => (
                  <Typography key={`${r.chapter || "row"}-${idx}`} variant="caption" display="block">
                    [{r.status.toUpperCase()}] {r.chapter || "chapter"} {r.reason ? `- ${r.reason}` : ""}
                  </Typography>
                ))}
              </Box>
            ) : null}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportOpen(false)} disabled={importing}>
            Close
          </Button>
          <Button variant="contained" onClick={() => void runImport()} disabled={importing || importRows.length === 0}>
            {importing ? "Importing..." : "Import data"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteRow} onClose={() => setDeleteRow(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Delete chapter</DialogTitle>
        <DialogContent>
          <Typography variant="body2" paragraph>
            This action cannot be undone. If this chapter is linked to other records, you must resolve those links first or accept cascading impact.
          </Typography>
          {deps ? (
            <Box sx={{ mb: 2, p: 1, bgcolor: "rgba(255,200,0,0.08)", borderRadius: 1 }}>
              <Typography variant="caption" display="block">
                Linked records: gatherings {deps.gatherings ?? 0}, chapter leaders {deps.chapter_leaders ?? 0},
                profiles (primary chapter) {deps.profiles_primary_chapter ?? 0}
              </Typography>
            </Box>
          ) : null}
          <Typography variant="body2" sx={{ mb: 1 }}>
            Type <strong>DELETE</strong> to confirm.
          </Typography>
          <TextField
            fullWidth
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder="DELETE"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteRow(null)}>Cancel</Button>
          <Button
            color="error"
            disabled={deleteConfirm !== "DELETE"}
            onClick={() => void confirmDelete()}
          >
            Delete permanently
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}
