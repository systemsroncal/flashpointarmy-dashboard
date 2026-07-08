"use client";

import { CertificateRequestsStatsPanel } from "@/components/dashboard/courses/CertificateRequestsStatsPanel";
import { CertificateFilePreview } from "@/components/dashboard/training/ExternalTrainingCertificateBanner";
import { StateChapterFilterControls } from "@/components/forms/StateChapterFilterControls";
import { hasCertificateAttachment } from "@/lib/training/certificate-requests";
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
  InputAdornment,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";

type RequestStatus = "pending" | "approved" | "rejected";
type AdminTab = "pending" | "responded" | "stats";

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
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>("pending");
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
  }, [courseSlug]);

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
          r.admin_note ?? "",
          r.reviewed_by_name ?? "",
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

  const pendingRows = useMemo(
    () => filteredRows.filter((r) => r.status === "pending"),
    [filteredRows]
  );

  const respondedRows = useMemo(
    () =>
      filteredRows
        .filter((r) => r.status === "approved" || r.status === "rejected")
        .sort((a, b) => {
          const aTime = a.reviewed_at ? new Date(a.reviewed_at).getTime() : 0;
          const bTime = b.reviewed_at ? new Date(b.reviewed_at).getTime() : 0;
          return bTime - aTime;
        }),
    [filteredRows]
  );

  const tabCounts = useMemo(() => {
    const pending = rows.filter((r) => r.status === "pending").length;
    const reviewed = rows.filter((r) => r.status === "approved" || r.status === "rejected").length;
    return { pending, reviewed };
  }, [rows]);

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
      setActiveTab(action === "approve" || action === "reject" ? "responded" : activeTab);
      await loadList();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Action failed.");
    } finally {
      setActing(false);
    }
  }

  const tableRows = activeTab === "pending" ? pendingRows : respondedRows;

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
        onChange={(_, value) => setActiveTab(value as AdminTab)}
        sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}
      >
        <Tab value="pending" label={`Pending (${tabCounts.pending})`} />
        <Tab value="responded" label={`Responded (${tabCounts.reviewed})`} />
        <Tab value="stats" label="Statistics" />
      </Tabs>

      {loadError ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {loadError}
        </Alert>
      ) : null}

      {activeTab === "stats" ? (
        <CertificateRequestsStatsPanel rows={rows} loading={loading} />
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
                  onStateChange={setFilterState}
                  onChapterChange={setFilterChapterId}
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
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Submitted</TableCell>
                    {activeTab === "responded" ? <TableCell>Reviewed</TableCell> : null}
                    <TableCell>Person</TableCell>
                    <TableCell>Chapter</TableCell>
                    <TableCell>Organization (external)</TableCell>
                    <TableCell>Completion date</TableCell>
                    {activeTab === "responded" ? <TableCell>Reviewed by</TableCell> : null}
                    <TableCell>Status</TableCell>
                    {activeTab === "responded" ? <TableCell>Admin note</TableCell> : null}
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tableRows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={activeTab === "responded" ? 10 : 7}
                        sx={{ py: 4, textAlign: "center", color: "text.secondary" }}
                      >
                        {activeTab === "pending"
                          ? "No pending requests match your filters."
                          : "No reviewed requests match your filters."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    tableRows.map((row) => (
                      <TableRow key={row.id} hover>
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
    </Box>
  );
}
