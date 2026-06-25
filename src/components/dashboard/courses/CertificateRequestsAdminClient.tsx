"use client";

import {
  CertificateFilePreview,
} from "@/components/dashboard/training/ExternalTrainingCertificateBanner";
import { StateChapterFilterControls } from "@/components/forms/StateChapterFilterControls";
import { matchesStateChapterFilter, type ChapterSearchRow } from "@/lib/chapters/chapter-search";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import {
  Alert,
  Box,
  Button,
  Chip,
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

type RequestStatus = "pending" | "approved" | "rejected";

type ListRow = {
  id: string;
  user_id: string;
  completion_date: string;
  organization_name: string;
  certificate_url: string;
  certificate_file_name: string | null;
  certificate_mime: string | null;
  status: RequestStatus;
  admin_note: string | null;
  created_at: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    address_line: string | null;
    city: string | null;
    state: string | null;
    zip_code: string | null;
    chapter_id: string | null;
    chapter_name: string | null;
    chapter_city: string | null;
    chapter_state: string | null;
  };
};

type DetailRequest = ListRow & {
  course_slug: string | null;
  course_title: string | null;
  user: ListRow["user"] & {
    roles: string[];
    chapter: {
      id: string;
      name: string;
      city: string | null;
      state: string | null;
      address_line: string | null;
      zip_code: string | null;
    } | null;
  };
};

type Props = {
  chapterOptions: ChapterSearchRow[];
  courseSlug: string;
};

function statusChip(status: RequestStatus) {
  if (status === "approved") return <Chip size="small" label="Approved" color="success" />;
  if (status === "rejected") return <Chip size="small" label="Rejected" color="error" />;
  return <Chip size="small" label="Pending" color="warning" />;
}

function formatAddress(parts: (string | null | undefined)[]): string {
  return parts.filter((p) => p?.trim()).join(", ") || "—";
}

export function CertificateRequestsAdminClient({ chapterOptions, courseSlug }: Props) {
  const [rows, setRows] = useState<ListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | RequestStatus>("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterState, setFilterState] = useState("all");
  const [filterChapterId, setFilterChapterId] = useState("all");

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<DetailRequest | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [acting, setActing] = useState(false);

  const loadList = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const params = new URLSearchParams({ admin: "1", courseSlug });
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/training/certificate-requests?${params.toString()}`);
      const json = (await res.json()) as { error?: string; requests?: ListRow[] };
      if (!res.ok) throw new Error(json.error ?? "Failed to load requests.");
      setRows(json.requests ?? []);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [courseSlug, statusFilter]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const filteredRows = useMemo(() => {
    let list = rows;
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((r) => {
        const blob = [
          r.user.name,
          r.user.email,
          r.organization_name,
          r.user.chapter_name ?? "",
          r.user.city ?? "",
          r.user.state ?? "",
        ]
          .join(" ")
          .toLowerCase();
        return blob.includes(q);
      });
    }
    return list.filter((r) =>
      matchesStateChapterFilter(r.user.chapter_id, chapterOptions, filterState, filterChapterId)
    );
  }, [rows, searchQuery, filterState, filterChapterId, chapterOptions]);

  async function openDetail(id: string) {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetail(null);
    setAdminNote("");
    setConfirmText("");
    setActionError(null);
    try {
      const res = await fetch(`/api/training/certificate-requests/${id}`);
      const json = (await res.json()) as { error?: string; request?: DetailRequest };
      if (!res.ok) throw new Error(json.error ?? "Failed to load details.");
      setDetail(json.request ?? null);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to load details.");
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleAction(action: "approve" | "reject") {
    if (!detail) return;
    setActionError(null);
    if (action === "approve" && confirmText.trim() !== "CONFIRM") {
      setActionError('Type CONFIRM to approve this request.');
      return;
    }
    setActing(true);
    try {
      const res = await fetch(`/api/training/certificate-requests/${detail.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          admin_note: adminNote.trim() || null,
          confirmText: action === "approve" ? confirmText.trim() : undefined,
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Action failed.");
      setDetailOpen(false);
      await loadList();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Action failed.");
    } finally {
      setActing(false);
    }
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
        Certificate requests
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Review external Biblical Citizenship completion certificates submitted by members and leaders.
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
            placeholder="Search name, email, organization…"
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
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Status</InputLabel>
            <Select
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
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
                <TableCell>Submitted</TableCell>
                <TableCell>Person</TableCell>
                <TableCell>Chapter</TableCell>
                <TableCell>Organization (external)</TableCell>
                <TableCell>Completion date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ py: 4, textAlign: "center", color: "text.secondary" }}>
                    No requests match your filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>{new Date(row.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {row.user.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {row.user.email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {row.user.chapter_name ?? "—"}
                      {row.user.chapter_city || row.user.chapter_state
                        ? ` (${[row.user.chapter_city, row.user.chapter_state].filter(Boolean).join(", ")})`
                        : ""}
                    </TableCell>
                    <TableCell>{row.organization_name}</TableCell>
                    <TableCell>{row.completion_date}</TableCell>
                    <TableCell>{statusChip(row.status)}</TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        startIcon={<VisibilityOutlinedIcon />}
                        onClick={() => void openDetail(row.id)}
                      >
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Paper>

      <Dialog open={detailOpen} onClose={() => !acting && setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Certificate request details</DialogTitle>
        <DialogContent dividers>
          {detailLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : detail ? (
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Person
                </Typography>
                <Typography fontWeight={700}>{detail.user.name}</Typography>
                <Typography variant="body2">{detail.user.email}</Typography>
                <Typography variant="body2">Phone: {detail.user.phone ?? "—"}</Typography>
                <Typography variant="body2">
                  Address:{" "}
                  {formatAddress([
                    detail.user.address_line,
                    detail.user.city,
                    detail.user.state,
                    detail.user.zip_code,
                  ])}
                </Typography>
                <Typography variant="body2">Roles: {detail.user.roles.join(", ") || "—"}</Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Chapter
                </Typography>
                <Typography variant="body2">
                  {detail.user.chapter?.name ?? detail.user.chapter_name ?? "—"}
                </Typography>
                {detail.user.chapter ? (
                  <Typography variant="body2" color="text.secondary">
                    {formatAddress([
                      detail.user.chapter.address_line,
                      detail.user.chapter.city,
                      detail.user.chapter.state,
                      detail.user.chapter.zip_code,
                    ])}
                  </Typography>
                ) : null}
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  External completion
                </Typography>
                <Typography variant="body2">Course: {detail.course_title ?? courseSlug}</Typography>
                <Typography variant="body2">Organization: {detail.organization_name}</Typography>
                <Typography variant="body2">Completion date: {detail.completion_date}</Typography>
                <Typography variant="body2">Status: {detail.status}</Typography>
                {detail.admin_note ? (
                  <Typography variant="body2" color="text.secondary">
                    Admin note: {detail.admin_note}
                  </Typography>
                ) : null}
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Certificate
                </Typography>
                <CertificateFilePreview
                  url={detail.certificate_url}
                  mime={detail.certificate_mime}
                  fileName={detail.certificate_file_name}
                />
              </Box>

              {detail.status === "pending" ? (
                <>
                  <TextField
                    label="Admin note (optional)"
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    fullWidth
                    multiline
                    minRows={2}
                  />
                  <TextField
                    label='Type CONFIRM to approve'
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    fullWidth
                    helperText="Approving will mark all Biblical Citizenship sessions complete for this user."
                  />
                </>
              ) : null}

              {actionError ? <Alert severity="error">{actionError}</Alert> : null}
            </Stack>
          ) : (
            <Typography color="text.secondary">No details available.</Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDetailOpen(false)} disabled={acting}>
            Close
          </Button>
          {detail?.status === "pending" ? (
            <>
              <Button color="error" onClick={() => void handleAction("reject")} disabled={acting}>
                Reject
              </Button>
              <Button
                variant="contained"
                color="success"
                onClick={() => void handleAction("approve")}
                disabled={acting || confirmText.trim() !== "CONFIRM"}
              >
                {acting ? <CircularProgress size={22} color="inherit" /> : "Approve"}
              </Button>
            </>
          ) : null}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
