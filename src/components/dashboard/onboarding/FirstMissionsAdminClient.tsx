"use client";

import { OnboardingStatusChip } from "@/components/dashboard/onboarding/onboarding-admin-utils";
import { AdminStaffSearchAutocomplete } from "@/components/forms/AdminStaffSearchAutocomplete";
import { StateChapterFilterControls } from "@/components/forms/StateChapterFilterControls";
import { matchesStateChapterFilter, type ChapterSearchRow } from "@/lib/chapters/chapter-search";
import type { AdminStaffOption } from "@/lib/onboarding/onboarding-records";
import type { FirstMissionStepStatus, TrainingStepStatus } from "@/lib/onboarding/member-onboarding-status";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
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
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";

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

export function FirstMissionsAdminClient({ chapterOptions }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [adminStaff, setAdminStaff] = useState<AdminStaffOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterState, setFilterState] = useState("all");
  const [filterChapterId, setFilterChapterId] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | FirstMissionStepStatus>("all");

  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState<Row | null>(null);
  const [status, setStatus] = useState<FirstMissionStepStatus>("locked");
  const [tutorId, setTutorId] = useState("");
  const [description, setDescription] = useState("");
  const [observations, setObservations] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const loadList = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/onboarding/first-missions");
      const json = (await res.json()) as { error?: string; rows?: Row[]; adminStaff?: AdminStaffOption[] };
      if (!res.ok) throw new Error(json.error ?? "Failed to load.");
      setRows(json.rows ?? []);
      setAdminStaff(json.adminStaff ?? []);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const filteredRows = useMemo(() => {
    let list = rows;
    if (statusFilter !== "all") {
      list = list.filter((r) => r.first_mission.status === statusFilter);
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((r) => {
        const blob = [r.name, r.email, r.chapter_name ?? "", r.first_mission.tutor_name ?? ""]
          .join(" ")
          .toLowerCase();
        return blob.includes(q);
      });
    }
    return list.filter((r) =>
      matchesStateChapterFilter(r.chapter_id, chapterOptions, filterState, filterChapterId)
    );
  }, [rows, statusFilter, searchQuery, filterState, filterChapterId, chapterOptions]);

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
      await loadList();
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
        Manage first mission status for members and local leaders. Training status reflects Biblical Citizenship course
        progress and is read-only here.
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

      <Paper sx={{ bgcolor: "rgba(0,0,0,0.35)", overflow: "auto" }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Person</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Chapter</TableCell>
                <TableCell>Training</TableCell>
                <TableCell>First mission</TableCell>
                <TableCell>Coach / tutor</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ py: 4, textAlign: "center", color: "text.secondary" }}>
                    No members match your filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((row) => (
                  <TableRow key={row.user_id} hover>
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
                    <TableCell align="right">
                      <Button size="small" startIcon={<EditOutlinedIcon />} onClick={() => openEdit(row)}>
                        Update
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
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
