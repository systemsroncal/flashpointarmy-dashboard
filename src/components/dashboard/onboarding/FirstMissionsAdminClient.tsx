"use client";

import { OnboardingStatusChip } from "@/components/dashboard/onboarding/onboarding-admin-utils";
import { AdminStaffSearchAutocomplete } from "@/components/forms/AdminStaffSearchAutocomplete";
import { StateChapterFilterControls } from "@/components/forms/StateChapterFilterControls";
import type { ChapterSearchRow } from "@/lib/chapters/chapter-search";
import type { AdminStaffOption } from "@/lib/onboarding/onboarding-records";
import type { FirstMissionStepStatus, TrainingStepStatus } from "@/lib/onboarding/member-onboarding-status";
import SearchIcon from "@mui/icons-material/Search";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";

type FirstMissionData = {
  user_id: string;
  status: FirstMissionStepStatus;
  tutor_id: string | null;
  description: string | null;
  observations: string | null;
  updated_at: string;
  tutor_name: string | null;
  tutor_email: string | null;
};

type Row = {
  user_id: string;
  name: string;
  email: string;
  role_label: string;
  chapter_id: string | null;
  chapter_name: string | null;
  chapter_state: string | null;
  training_status: TrainingStepStatus;
  first_mission: FirstMissionData;
};

type Props = {
  chapterOptions: ChapterSearchRow[];
};

const HIDDEN_ACTIONS_SX = { display: "none" } as const;

export function FirstMissionsAdminClient({ chapterOptions }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [adminStaff, setAdminStaff] = useState<AdminStaffOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCommitted, setSearchCommitted] = useState("");
  const [filterState, setFilterState] = useState("all");
  const [filterChapterId, setFilterChapterId] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | FirstMissionStepStatus>("all");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);

  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState<Row | null>(null);
  const [status, setStatus] = useState<FirstMissionStepStatus>("locked");
  const [tutorId, setTutorId] = useState("");
  const [description, setDescription] = useState("");
  const [observations, setObservations] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        perPage: String(rowsPerPage),
        chapterId: filterChapterId,
        state: filterState,
        status: statusFilter,
      });
      if (searchCommitted.length >= 2) {
        params.set("q", searchCommitted);
      }
      const res = await fetch(`/api/onboarding/first-missions?${params.toString()}`, { cache: "no-store" });
      const json = (await res.json()) as {
        error?: string;
        rows?: Row[];
        total?: number;
        adminStaff?: AdminStaffOption[];
      };
      if (!res.ok) throw new Error(json.error ?? "Failed to load.");
      setRows(json.rows ?? []);
      setTotalCount(json.total ?? 0);
      if (json.adminStaff?.length) setAdminStaff(json.adminStaff);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load.");
      setRows([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, filterState, filterChapterId, searchCommitted, statusFilter]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  useEffect(() => {
    setPage(0);
  }, [filterState, filterChapterId, searchCommitted, statusFilter]);

  function openEdit(row: Row) {
    setEditRow(row);
    setStatus(row.first_mission.status);
    setTutorId(row.first_mission.tutor_id ?? "");
    setDescription(row.first_mission.description ?? "");
    setObservations(row.first_mission.observations ?? "");
    setSaveError(null);
    setEditOpen(true);
  }

  async function handleSave() {
    if (!editRow) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/onboarding/first-missions/${editRow.user_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          tutor_id: tutorId || null,
          description,
          observations,
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Save failed.");
      setEditOpen(false);
      await fetchRows();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
        First mission
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Manage first mission status for members and local leaders. Click a row to update. Training status reflects
        Biblical Citizenship course progress (100% = Completed, not started = Pending, partial progress = In progress).
      </Typography>

      {loadError ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {loadError}
        </Alert>
      ) : null}

      <Paper sx={{ p: 2, mb: 2, bgcolor: "rgba(0,0,0,0.35)" }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2 }}>
          <TextField
            size="small"
            placeholder="Search name, email, coach/tutor…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setSearchCommitted(searchQuery.trim());
            }}
            onBlur={() => setSearchCommitted(searchQuery.trim())}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>First mission status</InputLabel>
            <Select
              label="First mission status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="locked">Locked</MenuItem>
              <MenuItem value="in_progress">In progress</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
            </Select>
          </FormControl>
        </Stack>
        <StateChapterFilterControls
          chapters={chapterOptions}
          filterState={filterState}
          filterChapterId={filterChapterId}
          onStateChange={setFilterState}
          onChapterChange={setFilterChapterId}
        />
      </Paper>

      <Paper sx={{ bgcolor: "rgba(0,0,0,0.35)", maxWidth: "100%", overflow: "hidden" }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer sx={{ maxWidth: "100%", overflowX: "auto" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Person</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Chapter</TableCell>
                    <TableCell>Training</TableCell>
                    <TableCell>First mission</TableCell>
                    <TableCell>Coach / tutor</TableCell>
                    <TableCell align="right" sx={HIDDEN_ACTIONS_SX}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ py: 4, textAlign: "center", color: "text.secondary" }}>
                        No members match your filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((row) => (
                      <TableRow
                        key={row.user_id}
                        hover
                        sx={{ cursor: "pointer" }}
                        onClick={() => openEdit(row)}
                      >
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {row.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {row.email}
                          </Typography>
                        </TableCell>
                        <TableCell>{row.role_label}</TableCell>
                        <TableCell>
                          {row.chapter_name ?? "—"}
                          {row.chapter_state ? ` (${row.chapter_state})` : ""}
                        </TableCell>
                        <TableCell>
                          <OnboardingStatusChip status={row.training_status} />
                        </TableCell>
                        <TableCell>
                          <OnboardingStatusChip status={row.first_mission.status} />
                        </TableCell>
                        <TableCell>{row.first_mission.tutor_name ?? "—"}</TableCell>
                        <TableCell align="right" sx={HIDDEN_ACTIONS_SX} />
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={totalCount}
              page={page}
              onPageChange={(_, nextPage) => setPage(nextPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setPage(0);
              }}
              rowsPerPageOptions={[10, 25, 50, 100]}
            />
          </>
        )}
      </Paper>

      <Dialog open={editOpen} onClose={() => !saving && setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update first mission</DialogTitle>
        <DialogContent dividers>
          {editRow ? (
            <Stack spacing={2} sx={{ pt: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                {editRow.name} · {editRow.email}
              </Typography>
              <Typography variant="body2">
                Training (Biblical Citizenship): <OnboardingStatusChip status={editRow.training_status} />
              </Typography>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  label="Status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as FirstMissionStepStatus)}
                >
                  <MenuItem value="locked">Locked</MenuItem>
                  <MenuItem value="in_progress">In progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                </Select>
              </FormControl>
              <AdminStaffSearchAutocomplete
                options={adminStaff}
                valueId={tutorId}
                onChangeId={setTutorId}
                label="Coach / tutor"
              />
              <TextField
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                fullWidth
                multiline
                minRows={3}
              />
              <TextField
                label="Observations"
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                fullWidth
                multiline
                minRows={3}
              />
              {saveError ? <Alert severity="error">{saveError}</Alert> : null}
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setEditOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={() => void handleSave()} disabled={saving}>
            {saving ? <CircularProgress size={22} color="inherit" /> : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
