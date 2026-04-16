"use client";

import DeleteOutline from "@mui/icons-material/DeleteOutline";
import Edit from "@mui/icons-material/Edit";
import Visibility from "@mui/icons-material/Visibility";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
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
import { PHONE_EXCEL_KEYS } from "@/lib/import/bulk-import";
import { parseUploadFile } from "@/lib/import/parse-upload";
import { usStateByCode } from "@/data/usStates";
import { useSyncedState } from "@/hooks/useSyncedState";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export type CommunityUserRow = {
  id: string;
  email: string;
  phone: string | null;
  display_name: string | null;
  created_at: string;
  primary_chapter_id: string | null;
  first_name: string | null;
  last_name: string | null;
  /** Role slugs from `public.roles.name` (e.g. member, local_leader). */
  role_names: string[];
};

export type ChapterOption = {
  id: string;
  name: string;
  address_line: string | null;
  city: string | null;
  state: string;
  zip_code: string | null;
};

function formatRoleLabel(slug: string) {
  return slug
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export function CommunitySection({
  initialUsers,
  chapterOptions,
  canCreate,
  canUpdate,
  canDelete,
  currentUserId,
  elevated,
  isLocalLeader,
  localChapterId,
  subtitle,
  isSuperAdmin = false,
  variant = "community",
}: {
  initialUsers: CommunityUserRow[];
  chapterOptions: ChapterOption[];
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  currentUserId: string;
  elevated: boolean;
  isLocalLeader: boolean;
  localChapterId: string | null;
  subtitle: string;
  /** Super admin can promote members/local leaders to administrator. */
  isSuperAdmin?: boolean;
  /** `leaders`: same table/actions as Community, add flow always creates Local leader. */
  variant?: "community" | "leaders";
}) {
  const isLeaders = variant === "leaders";
  /** Admin (not super) cannot remove other admins; no one removes super admin from the UI */
  const restrictDeletesForPeerAdmin = elevated && !isSuperAdmin;
  const router = useRouter();
  const [users, setUsers] = useSyncedState(initialUsers);
  const [filterChapterId, setFilterChapterId] = useState<string>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [inviteRole, setInviteRole] = useState<"member" | "local_leader">("member");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [chapterId, setChapterId] = useState<string>(
    localChapterId ?? chapterOptions[0]?.id ?? ""
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [inviteFlash, setInviteFlash] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [importOpen, setImportOpen] = useState(false);
  const [importRows, setImportRows] = useState<Record<string, string>[]>([]);
  const [importFileName, setImportFileName] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<
    { status: "imported" | "omitted"; email?: string; phone?: string; reason?: string; chapter?: string }[]
  >([]);

  const [viewUser, setViewUser] = useState<CommunityUserRow | null>(null);
  const [editUser, setEditUser] = useState<CommunityUserRow | null>(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editChapterId, setEditChapterId] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [deleteUser, setDeleteUser] = useState<CommunityUserRow | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const [promoteError, setPromoteError] = useState<string | null>(null);
  const [promoteSubmitting, setPromoteSubmitting] = useState(false);

  function rowCanBeDeleted(u: CommunityUserRow): boolean {
    if (u.id === currentUserId) return false;
    if (u.role_names?.includes("super_admin")) return false;
    if (restrictDeletesForPeerAdmin && u.role_names?.includes("admin")) return false;
    return true;
  }

  function eligibleForAdminPromotion(u: CommunityUserRow): boolean {
    if (!isSuperAdmin) return false;
    const names = u.role_names ?? [];
    if (names.includes("admin") || names.includes("super_admin")) return false;
    return names.some((n) => n === "member" || n === "local_leader");
  }

  async function runPromoteAdmin(u: CommunityUserRow) {
    setPromoteSubmitting(true);
    setPromoteError(null);
    try {
      const res = await fetch(`/api/community/members/${u.id}/promote-admin`, {
        method: "POST",
      });
      const data = (await res.json()) as { error?: string; role_names?: string[] };
      if (!res.ok) {
        setPromoteError(data.error || "Could not assign administrator role.");
        return;
      }
      const nextRoles = data.role_names ?? ["admin"];
      setUsers((prev) =>
        prev.map((row) =>
          row.id === u.id ? { ...row, role_names: nextRoles } : row
        )
      );
      setInviteFlash("User promoted to administrator.");
      window.setTimeout(() => setInviteFlash(null), 12000);
      setViewUser(null);
      router.refresh();
    } finally {
      setPromoteSubmitting(false);
    }
  }

  const filtered = useMemo(() => {
    if (filterChapterId === "all") return users;
    return users.filter((u) => u.primary_chapter_id === filterChapterId);
  }, [users, filterChapterId]);
  const paged = useMemo(() => {
    if (rowsPerPage < 0) return filtered;
    return filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filtered, page, rowsPerPage]);

  const showChapterFilter =
    chapterOptions.length > 0 && (elevated || (isLocalLeader && chapterOptions.length > 1));

  function chapterName(id: string | null) {
    if (!id) return "—";
    return chapterOptions.find((c) => c.id === id)?.name ?? "—";
  }

  function chapterById(id: string | null): ChapterOption | null {
    if (!id) return null;
    return chapterOptions.find((c) => c.id === id) ?? null;
  }

  function openEditMember(u: CommunityUserRow) {
    setEditUser(u);
    setEditFirstName(u.first_name ?? "");
    setEditLastName(u.last_name ?? "");
    setEditPhone(u.phone?.trim() ?? "");
    setEditChapterId(u.primary_chapter_id ?? chapterOptions[0]?.id ?? "");
    setEditError(null);
  }

  function openDeleteMember(u: CommunityUserRow) {
    setDeleteUser(u);
    setDeleteConfirm("");
    setDeleteError(null);
  }

  async function saveEditMember() {
    if (!editUser) return;
    const fn = editFirstName.trim();
    const ln = editLastName.trim();
    if (!fn || !ln) {
      setEditError("First name and last name are required.");
      return;
    }
    if (!editChapterId) {
      setEditError("Select a primary chapter.");
      return;
    }
    setEditSaving(true);
    setEditError(null);
    try {
      const res = await fetch(`/api/community/members/${editUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: fn,
          lastName: ln,
          phone: editPhone.trim() || null,
          primaryChapterId: editChapterId,
        }),
      });
      const data = (await res.json()) as { error?: string; user?: Partial<CommunityUserRow> };
      if (!res.ok) {
        setEditError(data.error || "Could not update member.");
        return;
      }
      if (data.user) {
        const row = data.user;
        setUsers((prev) =>
          prev.map((x) =>
            x.id === editUser.id
              ? {
                  ...x,
                  first_name: row.first_name ?? fn,
                  last_name: row.last_name ?? ln,
                  display_name: row.display_name ?? `${fn} ${ln}`.trim(),
                  primary_chapter_id: row.primary_chapter_id ?? editChapterId,
                  phone: row.phone !== undefined ? row.phone : editPhone.trim() || null,
                }
              : x
          )
        );
      }
      setEditUser(null);
      router.refresh();
    } finally {
      setEditSaving(false);
    }
  }

  async function confirmDeleteMember() {
    if (!deleteUser || deleteConfirm !== "DELETE") return;
    setDeleteSubmitting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/community/members/${deleteUser.id}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setDeleteError(data.error || "Could not delete user.");
        return;
      }
      setUsers((prev) => prev.filter((x) => x.id !== deleteUser.id));
      setDeleteUser(null);
      router.refresh();
    } finally {
      setDeleteSubmitting(false);
    }
  }

  async function handleAddSubmit() {
    setSubmitError(null);
    if (!email.trim()) {
      setSubmitError("Email is required.");
      return;
    }
    const fn = firstName.trim();
    const ln = lastName.trim();
    if (!fn || !ln) {
      setSubmitError("First name and last name are required.");
      return;
    }
    if (password.length < 8) {
      setSubmitError("Password must be at least 8 characters.");
      return;
    }
    const assignChapter =
      isLocalLeader && localChapterId ? localChapterId : chapterId;
    if (!assignChapter) {
      setSubmitError("Select a primary chapter.");
      return;
    }

    const roleToAssign: "member" | "local_leader" = isLeaders
      ? "local_leader"
      : elevated && inviteRole === "local_leader"
        ? "local_leader"
        : "member";

    setSubmitting(true);
    try {
      const res = await fetch("/api/community/invite-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
        email: email.trim(),
        password,
          firstName: fn,
          lastName: ln,
          phone: phone.trim() || null,
          primaryChapterId: assignChapter,
          roleName: roleToAssign,
          context: isLeaders ? "leaders" : "community",
        }),
      });
      const payload = (await res.json()) as {
        error?: string;
        user?: CommunityUserRow;
      };
      if (!res.ok) {
        setSubmitError(payload.error || "Could not invite user.");
        return;
      }
      if (payload.user) {
        const row = payload.user;
        setUsers((prev) => [
          {
            ...row,
            phone: row.phone ?? null,
          } as CommunityUserRow,
          ...prev,
        ]);
      }
      setInviteFlash(
        "User created successfully. Email is already verified automatically."
      );
      window.setTimeout(() => setInviteFlash(null), 14000);
      setAddOpen(false);
      setEmail("");
      setFirstName("");
      setLastName("");
      if (!isLeaders) setInviteRole("member");
      setPassword("");
      setPhone("");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
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
    setImportResults([]);
    const allResults: {
      status: "imported" | "omitted";
      email?: string;
      phone?: string;
      reason?: string;
      chapter?: string;
    }[] = [];
    const endpoint = isLeaders ? "/api/import/leaders" : "/api/import/members";
    const chunkSize = 100;
    let processed = 0;
    try {
      for (let i = 0; i < importRows.length; i += chunkSize) {
        const chunk = importRows.slice(i, i + chunkSize);
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rows: chunk }),
        });
        const payload = (await res.json()) as {
          error?: string;
          results?: {
            status: "imported" | "omitted";
            email?: string;
            phone?: string;
            reason?: string;
            chapter?: string;
          }[];
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

  return (
    <Paper sx={{ p: 2, bgcolor: "rgba(0,0,0,0.45)" }}>
      <Typography variant="h6" sx={{ color: "primary.main", mb: 1 }}>
        {isLeaders ? "Leaders" : "Community"}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {subtitle}
      </Typography>
      {inviteFlash ? (
        <Alert
          severity={inviteFlash.startsWith("User created, but email") ? "warning" : "success"}
          sx={{ mb: 2 }}
          onClose={() => setInviteFlash(null)}
        >
          {inviteFlash}
        </Alert>
      ) : null}

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
                setFirstName("");
                setLastName("");
                  if (!isLeaders) setInviteRole("member");
                setEmail("");
                setPassword("");
                  setPhone("");
                setSubmitError(null);
                setAddOpen(true);
              }}
            >
              Add new
            </Button>
              <Button variant="outlined" size="small" onClick={() => setImportOpen(true)}>
                {isLeaders ? "Import Local leaders" : "Import Members"}
              </Button>
            </>
          ) : null}
        </Box>
        {showChapterFilter ? (
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel id={isLeaders ? "leaders-ch-filter" : "comm-ch-filter"}>Chapter</InputLabel>
            <Select
              labelId={isLeaders ? "leaders-ch-filter" : "comm-ch-filter"}
              label="Chapter"
              value={filterChapterId}
              onChange={(e) => setFilterChapterId(e.target.value)}
            >
              <MenuItem value="all">All chapters</MenuItem>
              {chapterOptions.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ) : null}
      </Box>

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ color: "primary.main" }}>Email</TableCell>
            <TableCell sx={{ color: "primary.main" }}>Phone</TableCell>
            <TableCell sx={{ color: "primary.main" }}>First name</TableCell>
            <TableCell sx={{ color: "primary.main" }}>Last name</TableCell>
            <TableCell sx={{ color: "primary.main" }}>Display name</TableCell>
            <TableCell sx={{ color: "primary.main" }}>Joined</TableCell>
            <TableCell sx={{ color: "primary.main" }} align="right">
              Actions
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {paged.map((u) => (
            <TableRow key={u.id}>
              <TableCell>{u.email}</TableCell>
              <TableCell>{u.phone?.trim() || "—"}</TableCell>
              <TableCell>{u.first_name ?? "—"}</TableCell>
              <TableCell>{u.last_name ?? "—"}</TableCell>
              <TableCell>{u.display_name ?? "—"}</TableCell>
              <TableCell>
                {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
              </TableCell>
              <TableCell align="right">
                <IconButton
                  size="small"
                  color="inherit"
                  onClick={() => setViewUser(u)}
                  aria-label="View"
                >
                  <Visibility fontSize="small" />
                </IconButton>
                {canUpdate ? (
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => openEditMember(u)}
                    aria-label="Edit"
                  >
                    <Edit fontSize="small" />
                  </IconButton>
                ) : null}
                {canDelete && rowCanBeDeleted(u) ? (
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => openDeleteMember(u)}
                    aria-label="Delete"
                  >
                    <DeleteOutline fontSize="small" />
                  </IconButton>
                ) : null}
              </TableCell>
            </TableRow>
          ))}
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
      {filtered.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          {isLeaders ? "No local leaders match this filter." : "No members match this filter."}
        </Typography>
      ) : null}

      <Dialog
        open={addOpen}
        onClose={() => !submitting && setAddOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{isLeaders ? "Add local leader" : "Add community member"}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            {submitError ? <Alert severity="error">{submitError}</Alert> : null}
            <Typography variant="body2" color="text.secondary">
              {isLeaders ? (
                <>
                  Creates a dashboard user with the <strong>Local leader</strong> role. If your session
                  switches to the new user after sign-up, sign back in as an admin to finish setup if
                  needed.
                </>
              ) : (
                <>
              Creates a dashboard login. The new user may need to confirm their email depending on your
              Supabase Auth settings. If your session switches to the new user after sign-up, sign back in
              as an admin and assign the role again if needed.
                </>
              )}
            </Typography>
            <TextField
              label="First name"
              fullWidth
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoComplete="given-name"
            />
            <TextField
              label="Last name"
              fullWidth
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              autoComplete="family-name"
            />
            <TextField
              label="Phone (optional)"
              fullWidth
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
            />
            <TextField
              label="Email"
              type="email"
              fullWidth
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="off"
            />
            {!isLeaders && elevated ? (
              <FormControl fullWidth>
                <InputLabel id="comm-invite-role">Role</InputLabel>
                <Select
                  labelId="comm-invite-role"
                  label="Role"
                  value={inviteRole}
                  onChange={(e) =>
                    setInviteRole(e.target.value as "member" | "local_leader")
                  }
                >
                  <MenuItem value="member">Member</MenuItem>
                  <MenuItem value="local_leader">Local leader</MenuItem>
                </Select>
              </FormControl>
            ) : null}
            {!isLeaders && !elevated && isLocalLeader ? (
              <Typography variant="body2" color="text.secondary">
                Role: <strong>Member</strong> (only admins can invite local leaders here.)
              </Typography>
            ) : null}
            {isLeaders ? (
              <Typography variant="body2" color="text.secondary">
                Role: <strong>Local leader</strong>
              </Typography>
            ) : null}
            <TextField
              label="Temporary password"
              type="password"
              fullWidth
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              helperText="At least 8 characters. User can change it after sign-in."
              autoComplete="new-password"
            />
            {chapterOptions.length > 0 ? (
              <FormControl fullWidth required disabled={Boolean(isLocalLeader && localChapterId)}>
                <InputLabel>Primary chapter</InputLabel>
                <Select
                  label="Primary chapter"
                  value={isLocalLeader && localChapterId ? localChapterId : chapterId}
                  onChange={(e) => setChapterId(e.target.value)}
                >
                  {chapterOptions.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <Typography variant="body2" color="warning.main">
                No chapters available. Create a chapter first.
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => void handleAddSubmit()}
            disabled={submitting || chapterOptions.length === 0}
          >
            {submitting ? "Creating…" : isLeaders ? "Create leader" : "Create user"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={importOpen} onClose={() => !importing && setImportOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{isLeaders ? "Import Local leaders" : "Import Members"}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: "grid", gap: 2 }}>
            {importError ? <Alert severity="error">{importError}</Alert> : null}
            <Typography variant="body2" color="text.secondary">
              Excel: include a <strong>{PHONE_EXCEL_KEYS[0]}</strong> column for each user&apos;s phone (also used as
              temporary password when present).
            </Typography>
            {!isLeaders ? (
              <Typography variant="body2" color="text.secondary">
                Import <strong>chapters first</strong> when possible. If members were imported without chapters, add a
                chapter name column (e.g. Church affiliation / Chapter name) so each row can match or create a chapter
                automatically.
              </Typography>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Each row creates the chapter if missing, then creates the local leader and links them to that chapter.
              </Typography>
            )}
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
                  <Typography key={`${r.email || r.chapter || "row"}-${idx}`} variant="caption" display="block">
                    [{r.status.toUpperCase()}] {r.email || r.chapter || "record"} {r.reason ? `- ${r.reason}` : ""}
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

      <Dialog
        open={!!viewUser}
        onClose={() => {
          setPromoteError(null);
          setViewUser(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{isLeaders ? "Leader details" : "Member details"}</DialogTitle>
        <DialogContent>
          {viewUser ? (
            <Box sx={{ display: "grid", gap: 1, pt: 1 }}>
              <Typography>
                <strong>Email:</strong> {viewUser.email}
              </Typography>
              <Typography>
                <strong>Phone:</strong> {viewUser.phone?.trim() || "—"}
              </Typography>
              <Typography>
                <strong>First name:</strong> {viewUser.first_name ?? "—"}
              </Typography>
              <Typography>
                <strong>Last name:</strong> {viewUser.last_name ?? "—"}
              </Typography>
              <Typography>
                <strong>Display name:</strong> {viewUser.display_name ?? "—"}
              </Typography>
              <Typography>
                <strong>Role(s):</strong>{" "}
                {viewUser.role_names?.length
                  ? [...viewUser.role_names].sort().map(formatRoleLabel).join(", ")
                  : "—"}
              </Typography>
              <Typography variant="subtitle2" sx={{ mt: 1, color: "primary.main" }}>
                Primary chapter
              </Typography>
              {(() => {
                const ch = chapterById(viewUser.primary_chapter_id);
                const st = ch?.state ? usStateByCode(ch.state) : null;
                return (
                  <>
                    <Typography>
                      <strong>Chapter name:</strong> {ch?.name ?? chapterName(viewUser.primary_chapter_id)}
                    </Typography>
                    <Typography>
                      <strong>Address:</strong> {ch?.address_line?.trim() || "—"}
                    </Typography>
                    <Typography>
                      <strong>City:</strong> {ch?.city?.trim() || "—"}
                    </Typography>
                    <Typography>
                      <strong>State:</strong>{" "}
                      {st ? `${st.name} (${st.code})` : ch?.state?.trim() || "—"}
                    </Typography>
                    <Typography>
                      <strong>ZIP code:</strong> {ch?.zip_code?.trim() || "—"}
                    </Typography>
                  </>
                );
              })()}
              <Typography sx={{ mt: 1 }}>
                <strong>Joined:</strong>{" "}
                {viewUser.created_at
                  ? new Date(viewUser.created_at).toLocaleString()
                  : "—"}
              </Typography>
              {viewUser && eligibleForAdminPromotion(viewUser) ? (
                <>
                  {promoteError ? (
                    <Alert severity="error" sx={{ mt: 2 }}>
                      {promoteError}
                    </Alert>
                  ) : null}
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Super admin: grant <strong>Administrator</strong> (replaces Member / Local leader roles for
                    dashboard access).
                  </Typography>
                </>
              ) : null}
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          {viewUser && eligibleForAdminPromotion(viewUser) ? (
            <Button
              color="secondary"
              variant="contained"
              disabled={promoteSubmitting}
              onClick={() => void runPromoteAdmin(viewUser)}
            >
              {promoteSubmitting ? "Saving…" : "Make administrator"}
            </Button>
          ) : null}
          <Button onClick={() => setViewUser(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!editUser}
        onClose={() => !editSaving && setEditUser(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{isLeaders ? "Edit leader" : "Edit member"}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            {editError ? <Alert severity="error">{editError}</Alert> : null}
            {editUser ? (
              <Typography variant="body2" color="text.secondary">
                Email: <strong>{editUser.email}</strong> (sign-in email cannot be changed here.)
              </Typography>
            ) : null}
            <TextField
              label="First name"
              fullWidth
              required
              value={editFirstName}
              onChange={(e) => setEditFirstName(e.target.value)}
              autoComplete="given-name"
            />
            <TextField
              label="Last name"
              fullWidth
              required
              value={editLastName}
              onChange={(e) => setEditLastName(e.target.value)}
              autoComplete="family-name"
            />
            <TextField
              label="Phone (optional)"
              fullWidth
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              autoComplete="tel"
            />
            {chapterOptions.length > 0 ? (
              <FormControl fullWidth required>
                <InputLabel>Primary chapter</InputLabel>
                <Select
                  label="Primary chapter"
                  value={editChapterId}
                  onChange={(e) => setEditChapterId(e.target.value)}
                >
                  {chapterOptions.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <Typography variant="body2" color="warning.main">
                No chapters available.
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditUser(null)} disabled={editSaving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => void saveEditMember()}
            disabled={editSaving || chapterOptions.length === 0}
          >
            {editSaving ? "Saving…" : "Save changes"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!deleteUser}
        onClose={() => {
          if (deleteSubmitting) return;
          setDeleteUser(null);
          setDeleteConfirm("");
          setDeleteError(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{isLeaders ? "Delete leader" : "Delete member"}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" paragraph>
            This permanently removes the user&apos;s dashboard account and auth access. Related data may
            be removed or unlinked depending on your database rules. This cannot be undone.
          </Typography>
          {deleteUser ? (
            <Typography variant="body2" sx={{ mb: 2 }}>
              <strong>{deleteUser.email}</strong>
            </Typography>
          ) : null}
          {deleteError ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {deleteError}
            </Alert>
          ) : null}
          <Typography variant="body2" sx={{ mb: 1 }}>
            Type <strong>DELETE</strong> to confirm.
          </Typography>
          <TextField
            fullWidth
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder="DELETE"
            disabled={deleteSubmitting}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDeleteUser(null);
              setDeleteConfirm("");
              setDeleteError(null);
            }}
            disabled={deleteSubmitting}
          >
            Cancel
          </Button>
          <Button
            color="error"
            disabled={deleteConfirm !== "DELETE" || deleteSubmitting}
            onClick={() => void confirmDeleteMember()}
          >
            Delete permanently
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
