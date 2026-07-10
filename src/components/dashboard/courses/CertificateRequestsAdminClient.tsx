"use client";

import { CertificateRequestsStatsPanel } from "@/components/dashboard/courses/CertificateRequestsStatsPanel";
import { CertificateFilePreview } from "@/components/dashboard/training/ExternalTrainingCertificateBanner";
import { StateChapterFilterControls } from "@/components/forms/StateChapterFilterControls";
import { hasCertificateAttachment } from "@/lib/training/certificate-requests";
import type { ChapterSearchRow } from "@/lib/chapters/chapter-search";
import type { CertSortKey } from "@/lib/training/certificate-requests-admin-list";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";

type RequestStatus = "pending" | "approved" | "rejected";
type AdminTab = "pending" | "responded" | "stats";
type SortDir = "asc" | "desc";

type StatsRow = {
  status: RequestStatus;
  created_at: string;
  reviewed_at: string | null;
};

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
  reviewed_by: string | null;
  reviewed_at: string | null;
  reviewed_by_name: string | null;
  notification_resend_count: number;
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

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

export function CertificateRequestsAdminClient({ chapterOptions, courseSlug }: Props) {
  const [rows, setRows] = useState<ListRow[]>([]);
  const [statsRows, setStatsRows] = useState<StatsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCommitted, setSearchCommitted] = useState("");
  const [filterState, setFilterState] = useState("all");
  const [filterChapterId, setFilterChapterId] = useState("all");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [respondedCount, setRespondedCount] = useState(0);
  const [sortBy, setSortBy] = useState<CertSortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<DetailRequest | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [acting, setActing] = useState(false);
  const [resendTarget, setResendTarget] = useState<ListRow | null>(null);
  const [resending, setResending] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<"resend_notification" | "">("");
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);

  const loadList = useCallback(
    async (overrides?: {
      tab?: "pending" | "responded";
      page?: number;
      sort?: CertSortKey;
      dir?: SortDir;
    }) => {
      const tab = overrides?.tab ?? (activeTab === "stats" ? "pending" : activeTab);
      if (activeTab === "stats" && !overrides?.tab) return;
      setLoading(true);
      setLoadError(null);
      try {
        const params = new URLSearchParams({
          admin: "1",
          courseSlug,
          tab,
          page: String(overrides?.page ?? page),
          perPage: String(rowsPerPage),
          sort: overrides?.sort ?? sortBy,
          dir: overrides?.dir ?? sortDir,
          state: filterState,
          chapterId: filterChapterId,
        });
        if (searchCommitted.length >= 2) params.set("q", searchCommitted);
        const res = await fetch(`/api/training/certificate-requests?${params.toString()}`, {
          cache: "no-store",
        });
        const json = (await res.json()) as {
          error?: string;
          requests?: ListRow[];
          total?: number;
          pendingCount?: number;
          respondedCount?: number;
        };
        if (!res.ok) throw new Error(json.error ?? "Failed to load requests.");
        setRows(
          (json.requests ?? []).map((r) => ({
            ...r,
            notification_resend_count: Number(r.notification_resend_count ?? 0) || 0,
          }))
        );
        setTotalCount(json.total ?? 0);
        setPendingCount(json.pendingCount ?? 0);
        setRespondedCount(json.respondedCount ?? 0);
        setSelectedIds([]);
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : "Failed to load.");
        setRows([]);
        setTotalCount(0);
        setSelectedIds([]);
      } finally {
        setLoading(false);
      }
    },
    [
      activeTab,
      courseSlug,
      page,
      rowsPerPage,
      sortBy,
      sortDir,
      filterState,
      filterChapterId,
      searchCommitted,
    ]
  );

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    setLoadError(null);
    try {
      const params = new URLSearchParams({ admin: "1", courseSlug, view: "stats" });
      const res = await fetch(`/api/training/certificate-requests?${params.toString()}`, {
        cache: "no-store",
      });
      const json = (await res.json()) as {
        error?: string;
        statsRows?: StatsRow[];
      };
      if (!res.ok) throw new Error(json.error ?? "Failed to load statistics.");
      setStatsRows(json.statsRows ?? []);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load statistics.");
      setStatsRows([]);
    } finally {
      setStatsLoading(false);
    }
  }, [courseSlug]);

  useEffect(() => {
    if (activeTab === "stats") {
      void loadStats();
      return;
    }
    void loadList();
  }, [activeTab, loadList, loadStats]);

  useEffect(() => {
    const t = setTimeout(() => {
      const next = searchQuery.trim();
      setSearchCommitted((prev) => {
        if (prev === next) return prev;
        setPage(0);
        return next;
      });
    }, 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  function handleTabChange(value: AdminTab) {
    setActiveTab(value);
    setPage(0);
    setSelectedIds([]);
    setBulkAction("");
    if (value === "pending") {
      setSortBy("created_at");
      setSortDir("desc");
    } else if (value === "responded") {
      setSortBy("reviewed_at");
      setSortDir("desc");
    }
  }

  function handleSort(column: CertSortKey) {
    setPage(0);
    if (sortBy === column) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }
    setSortBy(column);
    setSortDir(column === "person" || column === "chapter" || column === "organization_name" ? "asc" : "desc");
  }

  function SortHeader({
    id,
    label,
    align,
  }: {
    id: CertSortKey;
    label: string;
    align?: "right" | "left";
  }) {
    return (
      <TableCell align={align} sortDirection={sortBy === id ? sortDir : false}>
        <TableSortLabel
          active={sortBy === id}
          direction={sortBy === id ? sortDir : "asc"}
          onClick={() => handleSort(id)}
        >
          {label}
        </TableSortLabel>
      </TableCell>
    );
  }

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
      setActionError("Type CONFIRM to approve this request.");
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
      setActiveTab("responded");
      setPage(0);
      setSortBy("reviewed_at");
      setSortDir("desc");
      await loadList({ tab: "responded", page: 0, sort: "reviewed_at", dir: "desc" });
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Action failed.");
    } finally {
      setActing(false);
    }
  }

  async function handleResendNotification() {
    if (!resendTarget) return;
    setResendError(null);
    setResending(true);
    try {
      const res = await fetch(`/api/training/certificate-requests/${resendTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resend_notification" }),
      });
      const json = (await res.json()) as {
        error?: string;
        notification_resend_count?: number;
      };
      if (!res.ok) throw new Error(json.error ?? "Failed to resend notification.");
      const nextCount = Number(json.notification_resend_count ?? 0) || 0;
      setRows((prev) =>
        prev.map((r) =>
          r.id === resendTarget.id ? { ...r, notification_resend_count: nextCount } : r
        )
      );
      setResendSuccess(
        `Notification email resent to ${resendTarget.user.email || resendTarget.user.name}.`
      );
      setResendTarget(null);
    } catch (e) {
      setResendError(e instanceof Error ? e.message : "Failed to resend notification.");
    } finally {
      setResending(false);
    }
  }

  const pageIds = useMemo(() => rows.map((r) => r.id), [rows]);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
  const somePageSelected = pageIds.some((id) => selectedIds.includes(id)) && !allPageSelected;

  function toggleSelectAllPage() {
    if (allPageSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
      return;
    }
    setSelectedIds((prev) => [...new Set([...prev, ...pageIds])]);
  }

  function toggleSelectOne(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function runBulkResend() {
    if (!selectedIds.length || bulkAction !== "resend_notification") return;
    setBulkBusy(true);
    setResendError(null);
    try {
      const res = await fetch("/api/training/certificate-requests/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resend_notification", ids: selectedIds }),
      });
      const json = (await res.json()) as {
        error?: string;
        sent?: number;
        failed?: number;
        results?: Array<{ id: string; ok: boolean; error?: string; notification_resend_count?: number }>;
      };
      if (!res.ok) throw new Error(json.error ?? "Bulk resend failed.");
      const countById = new Map(
        (json.results ?? [])
          .filter((r) => r.ok && typeof r.notification_resend_count === "number")
          .map((r) => [r.id, r.notification_resend_count as number])
      );
      if (countById.size) {
        setRows((prev) =>
          prev.map((row) =>
            countById.has(row.id)
              ? { ...row, notification_resend_count: countById.get(row.id)! }
              : row
          )
        );
      }
      const sent = json.sent ?? 0;
      const failed = json.failed ?? 0;
      if (failed > 0) {
        setResendError(`Resent ${sent}, failed ${failed}. Check individual rows and try again.`);
      } else {
        setResendSuccess(`Resent notifications for ${sent} request${sent === 1 ? "" : "s"}.`);
      }
      setSelectedIds([]);
      setBulkAction("");
      setBulkConfirmOpen(false);
    } catch (e) {
      setResendError(e instanceof Error ? e.message : "Bulk resend failed.");
    } finally {
      setBulkBusy(false);
    }
  }

  const tableRows = rows;
  const respondedColSpan = 12;

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
        Certificate requests
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Review external Biblical Citizenship completion certificates submitted by members and leaders.
      </Typography>

      <Tabs
        value={activeTab}
        onChange={(_, value) => handleTabChange(value as AdminTab)}
        sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}
      >
        <Tab value="pending" label={`Pending (${pendingCount})`} />
        <Tab value="responded" label={`Responded (${respondedCount})`} />
        <Tab value="stats" label="Statistics" />
      </Tabs>

      {loadError ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {loadError}
        </Alert>
      ) : null}

      {resendSuccess ? (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setResendSuccess(null)}>
          {resendSuccess}
        </Alert>
      ) : null}

      {activeTab === "stats" ? (
        <CertificateRequestsStatsPanel rows={statsRows} loading={statsLoading} />
      ) : (
        <>
          <Paper sx={{ p: 2, mb: 2, bgcolor: "rgba(0,0,0,0.35)" }}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                "@media (min-width: 768px)": {
                  flexDirection: "row",
                  alignItems: "flex-start",
                },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  width: "100%",
                  "@media (min-width: 768px)": {
                    flexDirection: "row",
                    alignItems: "center",
                    flex: "1 1 auto",
                    minWidth: 0,
                    width: "auto",
                  },
                }}
              >
                <TextField
                  size="small"
                  placeholder="Search name, email, organization, reviewer…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  sx={{
                    width: "100%",
                    "@media (min-width: 768px)": {
                      flex: "1 1 200px",
                      minWidth: 180,
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
                <Button
                  variant="outlined"
                  onClick={() => void loadList()}
                  disabled={loading}
                  sx={{
                    width: "100%",
                    "@media (min-width: 768px)": {
                      width: "auto",
                      flexShrink: 0,
                    },
                  }}
                >
                  Refresh
                </Button>
              </Box>
              <Box
                sx={{
                  width: "100%",
                  "@media (min-width: 768px)": {
                    width: "auto",
                    flexShrink: 0,
                  },
                }}
              >
                <StateChapterFilterControls
                  chapters={chapterOptions}
                  filterState={filterState}
                  filterChapterId={filterChapterId}
                  onStateChange={(v) => {
                    setFilterState(v);
                    setPage(0);
                  }}
                  onChapterChange={(v) => {
                    setFilterChapterId(v);
                    setPage(0);
                  }}
                />
              </Box>
            </Box>
          </Paper>

          <Paper sx={{ bgcolor: "rgba(0,0,0,0.35)", overflow: "auto" }}>
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                {activeTab === "responded" ? (
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1.5}
                    alignItems={{ xs: "stretch", sm: "center" }}
                    sx={{ px: 2, pt: 2, pb: 1 }}
                  >
                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>
                      {selectedIds.length} selected
                    </Typography>
                    <FormControl size="small" sx={{ minWidth: 220 }}>
                      <InputLabel id="cert-bulk-action-label">Bulk action</InputLabel>
                      <Select
                        labelId="cert-bulk-action-label"
                        label="Bulk action"
                        value={bulkAction}
                        onChange={(e) =>
                          setBulkAction(e.target.value as "resend_notification" | "")
                        }
                      >
                        <MenuItem value="">
                          <em>Choose action</em>
                        </MenuItem>
                        <MenuItem value="resend_notification">Resend notification</MenuItem>
                      </Select>
                    </FormControl>
                    <Button
                      variant="contained"
                      disabled={
                        !selectedIds.length || bulkAction !== "resend_notification" || bulkBusy
                      }
                      onClick={() => {
                        setResendError(null);
                        setBulkConfirmOpen(true);
                      }}
                    >
                      Resend notifications
                    </Button>
                  </Stack>
                ) : null}
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {activeTab === "responded" ? (
                        <TableCell padding="checkbox">
                          <Checkbox
                            size="small"
                            checked={allPageSelected}
                            indeterminate={somePageSelected}
                            onChange={toggleSelectAllPage}
                            inputProps={{ "aria-label": "Select all on this page" }}
                          />
                        </TableCell>
                      ) : null}
                      <SortHeader id="created_at" label="Submitted" />
                      {activeTab === "responded" ? (
                        <SortHeader id="reviewed_at" label="Reviewed" />
                      ) : null}
                      <SortHeader id="person" label="Person" />
                      <SortHeader id="chapter" label="Chapter" />
                      <SortHeader id="organization_name" label="Organization (external)" />
                      <SortHeader id="completion_date" label="Completion date" />
                      {activeTab === "responded" ? (
                        <SortHeader id="reviewed_by" label="Reviewed by" />
                      ) : null}
                      <SortHeader id="status" label="Status" />
                      {activeTab === "responded" ? <TableCell>Admin note</TableCell> : null}
                      {activeTab === "responded" ? (
                        <SortHeader id="notification_resend_count" label="Resends" align="right" />
                      ) : null}
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tableRows.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={activeTab === "responded" ? respondedColSpan : 7}
                          sx={{ py: 4, textAlign: "center", color: "text.secondary" }}
                        >
                          {activeTab === "pending"
                            ? "No pending requests match your filters."
                            : "No reviewed requests match your filters."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      tableRows.map((row) => (
                        <TableRow key={row.id} hover selected={selectedIds.includes(row.id)}>
                          {activeTab === "responded" ? (
                            <TableCell padding="checkbox">
                              <Checkbox
                                size="small"
                                checked={selectedIds.includes(row.id)}
                                onChange={() => toggleSelectOne(row.id)}
                                inputProps={{ "aria-label": `Select ${row.user.name}` }}
                              />
                            </TableCell>
                          ) : null}
                          <TableCell>{new Date(row.created_at).toLocaleDateString()}</TableCell>
                          {activeTab === "responded" ? (
                            <TableCell>{formatDateTime(row.reviewed_at)}</TableCell>
                          ) : null}
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
                          {activeTab === "responded" ? (
                            <TableCell>{row.reviewed_by_name ?? "—"}</TableCell>
                          ) : null}
                          <TableCell>{statusChip(row.status)}</TableCell>
                          {activeTab === "responded" ? (
                            <TableCell sx={{ maxWidth: 220 }}>
                              <Typography variant="body2" noWrap title={row.admin_note ?? undefined}>
                                {row.admin_note?.trim() || "—"}
                              </Typography>
                            </TableCell>
                          ) : null}
                          {activeTab === "responded" ? (
                            <TableCell align="right">
                              {row.notification_resend_count ?? 0}
                            </TableCell>
                          ) : null}
                          <TableCell align="right">
                            <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                              <Tooltip title="View details">
                                <IconButton
                                  size="small"
                                  aria-label="View details"
                                  onClick={() => void openDetail(row.id)}
                                >
                                  <VisibilityOutlinedIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              {activeTab === "responded" ? (
                                <Tooltip title="Resend notification">
                                  <IconButton
                                    size="small"
                                    aria-label="Resend notification"
                                    onClick={() => {
                                      setResendError(null);
                                      setResendTarget(row);
                                    }}
                                  >
                                    <MailOutlineIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              ) : null}
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
                  onPageChange={(_, p) => setPage(p)}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={(e) => {
                    setRowsPerPage(parseInt(e.target.value, 10));
                    setPage(0);
                  }}
                  rowsPerPageOptions={[10, 25, 50, 100]}
                />
              </>
            )}
          </Paper>
        </>
      )}

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
                <Typography variant="body2">Submitted: {formatDateTime(detail.created_at)}</Typography>
              </Box>

              {detail.status !== "pending" ? (
                <Paper variant="outlined" sx={{ p: 2, bgcolor: "rgba(0,0,0,0.2)" }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Review history
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    {statusChip(detail.status)}
                    <Typography variant="body2" color="text.secondary">
                      Reviewed {formatDateTime(detail.reviewed_at)}
                      {detail.reviewed_by_name ? ` by ${detail.reviewed_by_name}` : ""}
                    </Typography>
                  </Stack>
                  <Typography variant="body2">
                    Admin note: {detail.admin_note?.trim() || "—"}
                  </Typography>
                </Paper>
              ) : (
                <Typography variant="body2">Status: {detail.status}</Typography>
              )}

              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Certificate
                </Typography>
                {hasCertificateAttachment(detail.certificate_url) ? (
                  <CertificateFilePreview
                    url={detail.certificate_url}
                    mime={detail.certificate_mime}
                    fileName={detail.certificate_file_name}
                  />
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No file was attached to this request.
                  </Typography>
                )}
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
                    label="Type CONFIRM to approve"
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

      <Dialog
        open={Boolean(resendTarget)}
        onClose={() => !resending && setResendTarget(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Resend notification?</DialogTitle>
        <DialogContent dividers>
          {resendTarget ? (
            <Stack spacing={1.5}>
              <Typography>
                Resend the {resendTarget.status === "approved" ? "approval" : "rejection"} email to{" "}
                <strong>{resendTarget.user.name}</strong>
                {resendTarget.user.email ? ` (${resendTarget.user.email})` : ""}?
              </Typography>
              {resendTarget.status === "approved" ? (
                <Typography variant="body2" color="text.secondary">
                  The email will include a link to continue with Mission Briefing.
                </Typography>
              ) : null}
              {resendError ? <Alert severity="error">{resendError}</Alert> : null}
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setResendTarget(null)} disabled={resending}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => void handleResendNotification()}
            disabled={resending}
            startIcon={resending ? <CircularProgress size={16} color="inherit" /> : <MailOutlineIcon />}
          >
            {resending ? "Sending…" : "Resend email"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={bulkConfirmOpen}
        onClose={() => !bulkBusy && setBulkConfirmOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Resend notifications?</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1.5}>
            <Typography>
              Resend review notification emails for <strong>{selectedIds.length}</strong> selected
              request{selectedIds.length === 1 ? "" : "s"}?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Each successful resend increments the Resends counter for that request.
            </Typography>
            {resendError ? <Alert severity="error">{resendError}</Alert> : null}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setBulkConfirmOpen(false)} disabled={bulkBusy}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => void runBulkResend()}
            disabled={bulkBusy || !selectedIds.length}
            startIcon={bulkBusy ? <CircularProgress size={16} color="inherit" /> : <MailOutlineIcon />}
          >
            {bulkBusy ? "Sending…" : "Resend notifications"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
