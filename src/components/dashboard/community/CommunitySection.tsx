"use client";

import DeleteOutline from "@mui/icons-material/DeleteOutline";
import Edit from "@mui/icons-material/Edit";
import Visibility from "@mui/icons-material/Visibility";
import {
  Alert,
  Autocomplete,
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
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
} from "@mui/material";
import { PHONE_EXCEL_KEYS } from "@/lib/import/bulk-import";
import { parseUploadFile } from "@/lib/import/parse-upload";
import { usStateByCode } from "@/data/usStates";
import { useSyncedState } from "@/hooks/useSyncedState";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

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

type EditableRole = "member" | "local_leader" | "admin";

function formatRoleLabel(slug: string) {
  return slug
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function communityPrimaryRole(roleNames: string[] | undefined): "member" | "local_leader" | null {
  const n = roleNames ?? [];
  if (n.includes("local_leader")) return "local_leader";
  if (n.includes("member")) return "member";
  return null;
}

function tableRoleLabel(
  u: CommunityUserRow,
  variant: "community" | "leaders" | "admins"
): string {
  const names = u.role_names ?? [];
  if (variant === "admins") {
    return names.length ? [...names].sort().map(formatRoleLabel).join(", ") : "—";
  }
  if (names.includes("super_admin")) return formatRoleLabel("super_admin");
  if (names.includes("admin")) return formatRoleLabel("admin");
  const pr = communityPrimaryRole(names);
  return pr ? formatRoleLabel(pr) : "—";
}

type CommunitySortKey =
  | "email"
  | "phone"
  | "first_name"
  | "last_name"
  | "display_name"
  | "joined"
  | "role";

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
  /** `leaders`: add flow creates Local leader. `admins`: directory of admin / super_admin users. */
  variant?: "community" | "leaders" | "admins";
}) {
  const isLeaders = variant === "leaders";
  const isAdmins = variant === "admins";
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

  const chapterSearchOptions = useMemo(
    () => chapterOptions.map((c) => ({ id: c.id, label: c.name })),
    [chapterOptions]
  );

  const [viewUser, setViewUser] = useState<CommunityUserRow | null>(null);
  const [editUser, setEditUser] = useState<CommunityUserRow | null>(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editChapterId, setEditChapterId] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editRoleDraft, setEditRoleDraft] = useState<EditableRole>("member");
  const [editRoleSaving, setEditRoleSaving] = useState(false);
  const [editRoleError, setEditRoleError] = useState<string | null>(null);

  const [deleteUser, setDeleteUser] = useState<CommunityUserRow | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const [promoteError, setPromoteError] = useState<string | null>(null);
  const [promoteSubmitting, setPromoteSubmitting] = useState(false);

  const [tableSearch, setTableSearch] = useState("");
  const [orderBy, setOrderBy] = useState<CommunitySortKey>("joined");
  const [order, setOrder] = useState<"asc" | "desc">("desc");

  const [roleChangeDraft, setRoleChangeDraft] = useState<"member" | "local_leader">("member");
  const [roleChangeSaving, setRoleChangeSaving] = useState(false);
  const [roleChangeError, setRoleChangeError] = useState<string | null>(null);

  function rowCanBeDeleted(u: CommunityUserRow): boolean {
    if (u.id === currentUserId) return false;
    if (u.role_names?.includes("super_admin")) return false;
    if (isAdmins) {
      if (!isSuperAdmin) return false;
      const names = u.role_names ?? [];
      return names.includes("admin") && !names.includes("super_admin");
    }
    if (restrictDeletesForPeerAdmin && u.role_names?.includes("admin")) return false;
    return true;
  }

  function rowCanBeEdited(u: CommunityUserRow): boolean {
    if (isAdmins && u.role_names?.includes("super_admin") && !isSuperAdmin) return false;
    return true;
  }

  function eligibleForAdminPromotion(u: CommunityUserRow): boolean {
    if (isAdmins) return false;
    if (!isSuperAdmin) return false;
    const names = u.role_names ?? [];
    if (names.includes("admin") || names.includes("super_admin")) return false;
    return names.some((n) => n === "member" || n === "local_leader");
  }

  function eligibleForSuperAdminRoleSwitch(u: CommunityUserRow): boolean {
    if (isAdmins) return false;
    if (!isSuperAdmin) return false;
    const names = u.role_names ?? [];
    if (names.includes("super_admin") || names.includes("admin")) return false;
    return names.includes("member") || names.includes("local_leader");
  }

  function editableRoleFromUser(u: CommunityUserRow): EditableRole {
    const names = u.role_names ?? [];
    if (names.includes("admin")) return "admin";
    if (names.includes("local_leader")) return "local_leader";
    return "member";
  }

  function canEditRoleInForm(u: CommunityUserRow): boolean {
    if (isAdmins) return false;
    if (!isSuperAdmin) return false;
    if (u.role_names?.includes("super_admin")) return false;
    return true;
  }

  async function applyPrimaryRole(
    u: CommunityUserRow,
    draft: "member" | "local_leader",
    ctx: "view" | "edit"
  ): Promise<boolean> {
    const setSaving = ctx === "view" ? setRoleChangeSaving : setEditRoleSaving;
    const setErr = ctx === "view" ? setRoleChangeError : setEditRoleError;
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch(`/api/community/members/${u.id}/primary-role`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleName: draft }),
      });
      const data = (await res.json()) as { error?: string; role_names?: string[] };
      if (!res.ok) {
        setErr(data.error || "Could not update role.");
        return false;
      }
      const nextRoles = data.role_names ?? [draft];
      setUsers((prev) =>
        prev.map((row) => (row.id === u.id ? { ...row, role_names: nextRoles } : row))
      );
      setViewUser((v) => (v && v.id === u.id ? { ...v, role_names: nextRoles } : v));
      setEditUser((e) => (e && e.id === u.id ? { ...e, role_names: nextRoles } : e));
      if (ctx === "view") {
        setRoleChangeDraft(nextRoles.includes("local_leader") ? "local_leader" : "member");
      } else {
        setEditRoleDraft(nextRoles.includes("local_leader") ? "local_leader" : "member");
      }
      setInviteFlash("Role updated.");
      window.setTimeout(() => setInviteFlash(null), 8000);
      router.refresh();
      return true;
    } finally {
      setSaving(false);
    }
  }

  async function saveRoleChange(u: CommunityUserRow) {
    await applyPrimaryRole(u, roleChangeDraft, "view");
  }

  async function applyAdminRole(
    u: CommunityUserRow,
    ctx: "view" | "edit"
  ): Promise<boolean> {
    const setSaving = ctx === "view" ? setRoleChangeSaving : setEditRoleSaving;
    const setErr = ctx === "view" ? setRoleChangeError : setEditRoleError;
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch(`/api/community/members/${u.id}/promote-admin`, {
        method: "POST",
      });
      const data = (await res.json()) as { error?: string; role_names?: string[] };
      if (!res.ok) {
        setErr(data.error || "Could not assign administrator role.");
        return false;
      }
      const nextRoles = data.role_names ?? ["admin"];
      setUsers((prev) =>
        prev.map((row) => (row.id === u.id ? { ...row, role_names: nextRoles } : row))
      );
      setViewUser((v) => (v && v.id === u.id ? { ...v, role_names: nextRoles } : v));
      setEditUser((e) => (e && e.id === u.id ? { ...e, role_names: nextRoles } : e));
      setEditRoleDraft("admin");
      setInviteFlash("Role updated.");
      window.setTimeout(() => setInviteFlash(null), 8000);
      router.refresh();
      return true;
    } finally {
      setSaving(false);
    }
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

  useEffect(() => {
    setPage(0);
  }, [tableSearch, orderBy, order, filterChapterId]);

  useEffect(() => {
    if (!viewUser) {
      setRoleChangeDraft("member");
      setRoleChangeError(null);
      return;
    }
    setRoleChangeDraft(
      viewUser.role_names?.includes("local_leader") ? "local_leader" : "member"
    );
    setRoleChangeError(null);
  }, [viewUser]);

  function handleRequestSort(property: CommunitySortKey) {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  }

  const filtered = useMemo(() => {
    const chapterScoped =
      filterChapterId === "all" ? users : users.filter((u) => u.primary_chapter_id === filterChapterId);
    const q = tableSearch.trim().toLowerCase();
    if (!q) return chapterScoped;
    return chapterScoped.filter((u) => {
      const roleLabel = tableRoleLabel(u, variant);
      const blob = [
        u.email,
        u.phone ?? "",
        u.first_name ?? "",
        u.last_name ?? "",
        u.display_name ?? "",
        u.created_at ? new Date(u.created_at).toLocaleDateString() : "",
        roleLabel,
        (u.role_names ?? []).join(" "),
      ]
        .join(" ")
        .toLowerCase();
      return blob.includes(q);
    });
  }, [users, filterChapterId, tableSearch, variant]);

  const sorted = useMemo(() => {
    const dir = order === "asc" ? 1 : -1;
    const cmpStr = (a: string | null | undefined, b: string | null | undefined) =>
      dir * String(a ?? "").localeCompare(String(b ?? ""), undefined, { sensitivity: "base" });
    const cmpTime = (a: string | null | undefined, b: string | null | undefined) => {
      const ta = a ? new Date(a).getTime() : 0;
      const tb = b ? new Date(b).getTime() : 0;
      return dir * (ta - tb);
    };
    return [...filtered].sort((a, b) => {
      switch (orderBy) {
        case "email":
          return cmpStr(a.email, b.email);
        case "phone":
          return cmpStr(a.phone, b.phone);
        case "first_name":
          return cmpStr(a.first_name, b.first_name);
        case "last_name":
          return cmpStr(a.last_name, b.last_name);
        case "display_name":
          return cmpStr(a.display_name, b.display_name);
        case "joined":
          return cmpTime(a.created_at, b.created_at);
        case "role": {
          return cmpStr(tableRoleLabel(a, variant), tableRoleLabel(b, variant));
        }
        default:
          return 0;
      }
    });
  }, [filtered, order, orderBy, variant]);

  const paged = useMemo(() => {
    if (rowsPerPage < 0) return sorted;
    return sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [sorted, page, rowsPerPage]);

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
    setEditRoleError(null);
    setEditRoleDraft(editableRoleFromUser(u));
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
      if (editUser && canEditRoleInForm(editUser) && editableRoleFromUser(editUser) !== editRoleDraft) {
        const roleSaved =
          editRoleDraft === "admin"
            ? await applyAdminRole(editUser, "edit")
            : await applyPrimaryRole(editUser, editRoleDraft, "edit");
        if (!roleSaved) return;
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

    if (isAdmins) {
      setSubmitting(true);
      try {
        const res = await fetch("/api/admins/invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim(),
            password,
            firstName: fn,
            lastName: ln,
            phone: phone.trim() || undefined,
            primaryChapterId: assignChapter,
          }),
        });
        const payload = (await res.json()) as {
          error?: string;
          user?: CommunityUserRow;
        };
        if (!res.ok) {
          setSubmitError(payload.error || "Could not invite administrator.");
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
          "Administrator created successfully. Email is already verified automatically."
        );
        window.setTimeout(() => setInviteFlash(null), 14000);
        setAddOpen(false);
        setEmail("");
        setFirstName("");
        setLastName("");
        setPassword("");
        setPhone("");
        router.refresh();
      } finally {
        setSubmitting(false);
      }
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
        {isAdmins ? "Administrators" : isLeaders ? "Leaders" : "Community"}
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
              {!isAdmins ? (
                <Button variant="outlined" size="small" onClick={() => setImportOpen(true)}>
                  {isLeaders ? "Import Local leaders" : "Import Members"}
                </Button>
              ) : null}
            </>
          ) : null}
        </Box>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }}>
          <TextField
            size="small"
            label="Search"
            placeholder="Email, name, phone, role…"
            value={tableSearch}
            onChange={(e) => setTableSearch(e.target.value)}
            sx={{ minWidth: { sm: 220 } }}
          />
          {showChapterFilter ? (
            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel
                id={
                  isAdmins ? "admins-ch-filter" : isLeaders ? "leaders-ch-filter" : "comm-ch-filter"
                }
              >
                Chapter
              </InputLabel>
              <Select
                labelId={
                  isAdmins ? "admins-ch-filter" : isLeaders ? "leaders-ch-filter" : "comm-ch-filter"
                }
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
        </Stack>
      </Box>

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ color: "primary.main" }}>
              <TableSortLabel
                active={orderBy === "email"}
                direction={orderBy === "email" ? order : "asc"}
                onClick={() => handleRequestSort("email")}
              >
                Email
              </TableSortLabel>
            </TableCell>
            <TableCell sx={{ color: "primary.main" }}>
              <TableSortLabel
                active={orderBy === "phone"}
                direction={orderBy === "phone" ? order : "asc"}
                onClick={() => handleRequestSort("phone")}
              >
                Phone
              </TableSortLabel>
            </TableCell>
            <TableCell sx={{ color: "primary.main" }}>
              <TableSortLabel
                active={orderBy === "first_name"}
                direction={orderBy === "first_name" ? order : "asc"}
                onClick={() => handleRequestSort("first_name")}
              >
                First name
              </TableSortLabel>
            </TableCell>
            <TableCell sx={{ color: "primary.main" }}>
              <TableSortLabel
                active={orderBy === "last_name"}
                direction={orderBy === "last_name" ? order : "asc"}
                onClick={() => handleRequestSort("last_name")}
              >
                Last name
              </TableSortLabel>
            </TableCell>
            <TableCell sx={{ color: "primary.main" }}>
              <TableSortLabel
                active={orderBy === "display_name"}
                direction={orderBy === "display_name" ? order : "asc"}
                onClick={() => handleRequestSort("display_name")}
              >
                Display name
              </TableSortLabel>
            </TableCell>
            <TableCell sx={{ color: "primary.main" }}>
              <TableSortLabel
                active={orderBy === "joined"}
                direction={orderBy === "joined" ? order : "asc"}
                onClick={() => handleRequestSort("joined")}
              >
                Joined
              </TableSortLabel>
            </TableCell>
            <TableCell sx={{ color: "primary.main" }}>
              <TableSortLabel
                active={orderBy === "role"}
                direction={orderBy === "role" ? order : "asc"}
                onClick={() => handleRequestSort("role")}
              >
                Role
              </TableSortLabel>
            </TableCell>
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
              <TableCell>{tableRoleLabel(u, variant)}</TableCell>
              <TableCell align="right">
                <IconButton
                  size="small"
                  color="inherit"
                  onClick={() => setViewUser(u)}
                  aria-label="View"
                >
                  <Visibility fontSize="small" />
                </IconButton>
                {canUpdate && rowCanBeEdited(u) ? (
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
        count={sorted.length}
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
          {isAdmins
            ? "No administrators match this filter."
            : isLeaders
              ? "No local leaders match this filter."
              : "No members match this filter."}
        </Typography>
      ) : null}

      <Dialog
        open={addOpen}
        onClose={() => !submitting && setAddOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {isAdmins
            ? "Add administrator"
            : isLeaders
              ? "Add local leader"
              : "Add community member"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            {submitError ? <Alert severity="error">{submitError}</Alert> : null}
            <Typography variant="body2" color="text.secondary">
              {isAdmins ? (
                <>
                  Creates a dashboard user with the <strong>Administrator</strong> role (super admin
                  only). If your session switches to the new user after sign-up, sign back in as an admin
                  to continue.
                </>
              ) : isLeaders ? (
                <>
                  Creates a dashboard user with the <strong>Local leader</strong> role. If your session
                  switches to the new user after sign-up, sign back in as an admin to finish setup if
                  needed.
                </>
              ) : (
                <>
                  Creates a dashboard login. The new user may need to confirm their email depending on your
                  Supabase Auth settings. If your session switches to the new user after sign-up, sign back
                  in as an admin and assign the role again if needed.
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
            {!isLeaders && !isAdmins && elevated ? (
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
            {!isLeaders && !isAdmins && !elevated && isLocalLeader ? (
              <Typography variant="body2" color="text.secondary">
                Role: <strong>Member</strong> (only admins can invite local leaders here.)
              </Typography>
            ) : null}
            {isAdmins ? (
              <Typography variant="body2" color="text.secondary">
                Role: <strong>Administrator</strong>
              </Typography>
            ) : isLeaders ? (
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
              <Autocomplete
                options={chapterSearchOptions}
                value={
                  chapterSearchOptions.find(
                    (o) => o.id === (isLocalLeader && localChapterId ? localChapterId : chapterId)
                  ) ?? null
                }
                onChange={(_, v) => setChapterId(v?.id ?? "")}
                getOptionLabel={(o) => o.label}
                isOptionEqualToValue={(a, b) => a.id === b.id}
                disabled={Boolean(isLocalLeader && localChapterId)}
                filterOptions={(opts, state) => {
                  const q = state.inputValue.trim().toLowerCase();
                  if (!q) return opts;
                  return opts.filter((o) => o.label.toLowerCase().includes(q));
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Primary chapter" required placeholder="Search chapter…" />
                )}
              />
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
            {submitting
              ? "Creating…"
              : isAdmins
                ? "Create administrator"
                : isLeaders
                  ? "Create leader"
                  : "Create user"}
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
          setRoleChangeError(null);
          setViewUser(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {isAdmins
            ? "Administrator details"
            : isLeaders
              ? "Leader details"
              : "Member details"}
        </DialogTitle>
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
              {viewUser && eligibleForSuperAdminRoleSwitch(viewUser) ? (
                <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid rgba(255,255,255,0.12)" }}>
                  {roleChangeError ? (
                    <Alert severity="error" sx={{ mb: 1 }}>
                      {roleChangeError}
                    </Alert>
                  ) : null}
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Super admin: switch between <strong>Member</strong> and <strong>Local leader</strong>.
                  </Typography>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }}>
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                      <InputLabel id="super-role-switch">Dashboard role</InputLabel>
                      <Select
                        labelId="super-role-switch"
                        label="Dashboard role"
                        value={roleChangeDraft}
                        onChange={(e) =>
                          setRoleChangeDraft(e.target.value as "member" | "local_leader")
                        }
                      >
                        <MenuItem value="member">Member</MenuItem>
                        <MenuItem value="local_leader">Local leader</MenuItem>
                      </Select>
                    </FormControl>
                    <Button
                      variant="outlined"
                      disabled={
                        roleChangeSaving ||
                        communityPrimaryRole(viewUser.role_names) === roleChangeDraft
                      }
                      onClick={() => void saveRoleChange(viewUser)}
                    >
                      {roleChangeSaving ? "Saving…" : "Apply role"}
                    </Button>
                  </Stack>
                </Box>
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
        onClose={() => {
          if (editSaving || editRoleSaving) return;
          setEditRoleError(null);
          setEditUser(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {isAdmins ? "Edit administrator" : isLeaders ? "Edit leader" : "Edit member"}
        </DialogTitle>
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
            {editUser && canEditRoleInForm(editUser) ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {editRoleError ? <Alert severity="error">{editRoleError}</Alert> : null}
                <Typography variant="body2" color="text.secondary">
                  Super admin: choose the role for this user.
                </Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }}>
                  <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel id="edit-primary-role">Dashboard role</InputLabel>
                    <Select
                      labelId="edit-primary-role"
                      label="Dashboard role"
                      value={editRoleDraft}
                      onChange={(e) =>
                        setEditRoleDraft(e.target.value as "member" | "local_leader")
                      }
                    >
                      <MenuItem value="member">Member</MenuItem>
                      <MenuItem value="local_leader">Local leader</MenuItem>
                      <MenuItem value="admin">Administrator</MenuItem>
                    </Select>
                  </FormControl>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  This role is applied when you click <strong>Save changes</strong>.
                </Typography>
              </Box>
            ) : null}
            {chapterOptions.length > 0 ? (
              <Autocomplete
                options={chapterSearchOptions}
                value={chapterSearchOptions.find((o) => o.id === editChapterId) ?? null}
                onChange={(_, v) => setEditChapterId(v?.id ?? "")}
                getOptionLabel={(o) => o.label}
                isOptionEqualToValue={(a, b) => a.id === b.id}
                filterOptions={(opts, state) => {
                  const q = state.inputValue.trim().toLowerCase();
                  if (!q) return opts;
                  return opts.filter((o) => o.label.toLowerCase().includes(q));
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Primary chapter" required placeholder="Search chapter…" />
                )}
              />
            ) : (
              <Typography variant="body2" color="warning.main">
                No chapters available.
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setEditRoleError(null);
              setEditUser(null);
            }}
            disabled={editSaving || editRoleSaving}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => void saveEditMember()}
            disabled={editSaving || editRoleSaving || chapterOptions.length === 0}
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
        <DialogTitle>
          {isAdmins ? "Delete administrator" : isLeaders ? "Delete leader" : "Delete member"}
        </DialogTitle>
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
