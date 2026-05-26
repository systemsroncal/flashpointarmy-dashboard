"use client";

import DeleteOutline from "@mui/icons-material/DeleteOutline";
import Edit from "@mui/icons-material/Edit";
import { PasswordTextField } from "@/components/auth/PasswordTextField";
import Search from "@mui/icons-material/Search";
import SwitchAccount from "@mui/icons-material/SwitchAccount";
import Upgrade from "@mui/icons-material/Upgrade";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  LinearProgress,
  FormControl,
  FormControlLabel,
  IconButton,
  InputAdornment,
  InputLabel,
  List,
  ListItemButton,
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
  Tooltip,
  Typography,
} from "@mui/material";
import { SignInEmailChangePanel } from "@/components/auth/SignInEmailChangePanel";
import { CourseGraduateBadge, AvatarWithGraduateIcon } from "@/components/dashboard/training/CourseGraduateBadge";
import { ChapterSearchAutocomplete } from "@/components/forms/ChapterSearchAutocomplete";
import type { TrainingGraduateBadgeRole } from "@/lib/courses/course-completion";
import { UsStateSearchAutocomplete } from "@/components/forms/UsStateSearchAutocomplete";
import { publicAssetSrc } from "@/lib/media/public-asset-url";
import { parseUploadFile } from "@/lib/import/parse-upload";
import { usStateByCode } from "@/data/usStates";
import { isAdminButNotSuper } from "@/lib/auth/user-roles";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type CommunityUserRow = {
  id: string;
  avatar_url?: string | null;
  email: string;
  phone: string | null;
  display_name: string | null;
  created_at: string;
  primary_chapter_id: string | null;
  first_name: string | null;
  last_name: string | null;
  address_line: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  /** Role slugs from `public.roles.name` (e.g. member, local_leader). */
  role_names: string[];
  /** Biblical Citizenship graduate badge, when applicable. */
  training_graduate_badge?: TrainingGraduateBadgeRole | null;
};

export type ChapterOption = {
  id: string;
  name: string;
  city: string | null;
  state: string;
  zip_code: string | null;
  address_line?: string | null;
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

function emailFromSuggestionLabel(label: string): string {
  const parts = label.split("—");
  if (parts.length >= 2) return parts[parts.length - 1]!.trim();
  return label.trim();
}

/** Text used for client-side directory search (Leaders / Admins). */
function buildUserSearchBlob(
  u: CommunityUserRow,
  chapterOptions: ChapterOption[],
  variant: "community" | "leaders" | "admins",
): string {
  const roleLabel = tableRoleLabel(u, variant);
  const parts: string[] = [
    u.email,
    u.phone ?? "",
    u.first_name ?? "",
    u.last_name ?? "",
    u.display_name ?? "",
    u.address_line ?? "",
    u.city ?? "",
    u.zip_code ?? "",
    u.created_at ? new Date(u.created_at).toLocaleDateString() : "",
    roleLabel,
    ...(u.role_names ?? []),
  ];
  const st = u.state?.trim();
  if (st) {
    parts.push(st);
    const meta = usStateByCode(st);
    if (meta?.name) parts.push(meta.name);
  }
  if (u.primary_chapter_id) {
    const ch = chapterOptions.find((c) => c.id === u.primary_chapter_id);
    if (ch) {
      parts.push(ch.name, ch.city ?? "", ch.zip_code ?? "");
      const chSt = ch.state?.trim();
      if (chSt) {
        parts.push(chSt);
        const chMeta = usStateByCode(chSt);
        if (chMeta?.name) parts.push(chMeta.name);
      }
    }
  }
  return parts
    .join(" ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
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
  const remoteMode = !isLeaders && !isAdmins;
  const searchFieldId = isAdmins
    ? "fp-user-dir-search-admins"
    : isLeaders
      ? "fp-user-dir-search-leaders"
      : "fp-user-dir-search-community";
  const tablePaginationRppId = isAdmins
    ? "fp-user-dir-rpp-admins"
    : isLeaders
      ? "fp-user-dir-rpp-leaders"
      : "fp-user-dir-rpp-community";
  const tablePaginationRppLabelId = `${tablePaginationRppId}-label`;
  /** Admin (not super) cannot remove other admins; no one removes super admin from the UI */
  const restrictDeletesForPeerAdmin = elevated && !isSuperAdmin;
  const router = useRouter();
  const [users, setUsers] = useState<CommunityUserRow[]>(initialUsers);
  useEffect(() => {
    if (remoteMode) return;
    setUsers(initialUsers);
  }, [remoteMode, initialUsers]);
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
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(initialUsers.length);
  const [tableLoading, setTableLoading] = useState(false);
  const [tableFetchError, setTableFetchError] = useState<string | null>(null);
  const [searchOptions, setSearchOptions] = useState<Array<{ id: string; label: string }>>([]);
  const [searchInput, setSearchInput] = useState("");
  const [searchCommitted, setSearchCommitted] = useState("");
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  const searchInputRef = useRef("");
  searchInputRef.current = searchInput;

  const [importOpen, setImportOpen] = useState(false);
  const [importRows, setImportRows] = useState<Record<string, string>[]>([]);
  const [importFileName, setImportFileName] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<
    { status: "imported" | "omitted"; email?: string; phone?: string; reason?: string; chapter?: string }[]
  >([]);
  const [syncOpen, setSyncOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncFromDate, setSyncFromDate] = useState("");
  const [syncToDate, setSyncToDate] = useState("");
  const [syncChapters, setSyncChapters] = useState(true);
  const [syncLeaders, setSyncLeaders] = useState(true);
  const [syncMembers, setSyncMembers] = useState(true);
  const [syncAddressForExisting, setSyncAddressForExisting] = useState(false);
  const [assignDefaultPasswordForExisting, setAssignDefaultPasswordForExisting] = useState(false);
  const [syncSummary, setSyncSummary] = useState<{
    usersAdded: number;
    membersAdded: number;
    localLeadersAdded: number;
    chaptersAdded: number;
    usersSkipped: number;
    skippedUsers: { email: string; reason: string }[];
  } | null>(null);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [syncError, setSyncError] = useState<string | null>(null);

  const allowChapterNameSearch = elevated || isSuperAdmin;

  const [viewUser, setViewUser] = useState<CommunityUserRow | null>(null);
  const [editUser, setEditUser] = useState<CommunityUserRow | null>(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editChapterId, setEditChapterId] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddrLine, setEditAddrLine] = useState("");
  const [editAddrCity, setEditAddrCity] = useState("");
  const [editAddrState, setEditAddrState] = useState("");
  const [editAddrZip, setEditAddrZip] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editRoleDraft, setEditRoleDraft] = useState<EditableRole>("member");
  const [editRoleSaving, setEditRoleSaving] = useState(false);
  const [editRoleError, setEditRoleError] = useState<string | null>(null);
  const [editNewPassword, setEditNewPassword] = useState("");
  const [editPasswordVisible, setEditPasswordVisible] = useState(false);

  const [deleteUser, setDeleteUser] = useState<CommunityUserRow | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const [promoteError, setPromoteError] = useState<string | null>(null);
  const [promoteSubmitting, setPromoteSubmitting] = useState(false);
  const [superPromoteSubmitting, setSuperPromoteSubmitting] = useState(false);

  /** Impersonation: super_admin signs in as the target user via a magic-link token. */
  const [impersonateUser, setImpersonateUser] = useState<CommunityUserRow | null>(null);
  const [impersonateSubmitting, setImpersonateSubmitting] = useState(false);
  const [impersonateError, setImpersonateError] = useState<string | null>(null);

  const [orderBy, setOrderBy] = useState<CommunitySortKey>("joined");
  const [order, setOrder] = useState<"asc" | "desc">("desc");

  const [roleChangeDraft, setRoleChangeDraft] = useState<"member" | "local_leader">("member");
  const [roleChangeSaving, setRoleChangeSaving] = useState(false);
  const [roleChangeError, setRoleChangeError] = useState<string | null>(null);

  const applySearchQuery = useCallback((raw: string) => {
    const v = raw.trim();
    setSearchCommitted(v);
    setPage(0);
    setSuggestionsOpen(false);
  }, []);

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

  /** Lista de administradores: un super admin puede ascender a otro admin a super admin. */
  function eligibleForSuperAdminPromotionFromAdminsList(u: CommunityUserRow): boolean {
    if (!isAdmins || !isSuperAdmin) return false;
    return isAdminButNotSuper(u.role_names ?? []);
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

  async function runPromoteSuperAdmin(u: CommunityUserRow) {
    if (
      !window.confirm(
        "Promote this user to super administrator? They will have full platform access (same level as you)."
      )
    ) {
      return;
    }
    setSuperPromoteSubmitting(true);
    try {
      const res = await fetch(`/api/community/members/${u.id}/promote-super-admin`, {
        method: "POST",
      });
      const data = (await res.json()) as { error?: string; role_names?: string[] };
      if (!res.ok) {
        setInviteFlash(`ERROR:${data.error || "Could not assign super administrator."}`);
        window.setTimeout(() => setInviteFlash(null), 14000);
        return;
      }
      const nextRoles = data.role_names ?? ["super_admin"];
      setUsers((prev) =>
        prev.map((row) => (row.id === u.id ? { ...row, role_names: nextRoles } : row))
      );
      setInviteFlash("User promoted to super administrator.");
      window.setTimeout(() => setInviteFlash(null), 12000);
      setViewUser(null);
      router.refresh();
    } finally {
      setSuperPromoteSubmitting(false);
    }
  }

  /**
   * Display name for the impersonation confirm dialog: prefer first+last, fall
   * back to display name or email so we always render something readable.
   */
  function displayNameFor(u: CommunityUserRow): string {
    const full = [u.first_name, u.last_name].filter(Boolean).join(" ").trim();
    return full || u.display_name?.trim() || u.email;
  }

  /** POST to /api/admin/impersonate and reload as the target user. */
  async function runImpersonate(u: CommunityUserRow) {
    setImpersonateError(null);
    setImpersonateSubmitting(true);
    try {
      const res = await fetch("/api/admin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: u.id }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        redirectTo?: string;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        setImpersonateError(data.error || "Could not start the impersonated session.");
        return;
      }
      /**
       * Full reload so the browser uses the new auth cookies that the
       * endpoint set in this response (in-memory Supabase client caches
       * would otherwise still hold the old session).
       */
      window.location.assign(data.redirectTo || "/dashboard");
    } catch (e) {
      setImpersonateError(e instanceof Error ? e.message : "Network error.");
    } finally {
      setImpersonateSubmitting(false);
    }
  }

  useEffect(() => {
    setPage(0);
  }, [searchCommitted, orderBy, order, filterChapterId]);

  const fetchRemoteRows = useCallback(async () => {
    if (!remoteMode) return;
    setTableLoading(true);
    setTableFetchError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        perPage: String(rowsPerPage < 0 ? 200 : rowsPerPage),
        chapterId: filterChapterId,
        sort: orderBy,
        order,
      });
      if (searchCommitted.length >= 2) {
        params.set("q", searchCommitted);
      }
      const res = await fetch(`/api/community/members?${params.toString()}`, { cache: "no-store" });
      const payload = (await res.json()) as { rows?: CommunityUserRow[]; total?: number; error?: string };
      if (!res.ok) {
        setTableFetchError(payload.error || res.statusText || "Could not load members.");
        return;
      }
      setUsers(payload.rows ?? []);
      setTotalCount(payload.total ?? 0);
    } finally {
      setTableLoading(false);
    }
  }, [remoteMode, page, rowsPerPage, filterChapterId, searchCommitted, orderBy, order]);

  useEffect(() => {
    void fetchRemoteRows();
  }, [fetchRemoteRows]);

  useEffect(() => {
    if (!remoteMode) return;
    const q = searchInput.trim();
    if (q.length < 2) {
      setSearchOptions([]);
      setSearchLoading(false);
      return;
    }
    const tid = window.setTimeout(async () => {
      setSearchLoading(true);
      try {
        const params = new URLSearchParams({
          autocomplete: "1",
          q,
          chapterId: filterChapterId,
        });
        const res = await fetch(`/api/community/members?${params.toString()}`, { cache: "no-store" });
        const payload = (await res.json()) as { options?: Array<{ id: string; label: string }> };
        if (!res.ok) return;
        setSearchOptions(payload.options ?? []);
      } finally {
        setSearchLoading(false);
      }
    }, 250);
    return () => window.clearTimeout(tid);
  }, [remoteMode, searchInput, filterChapterId]);

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
    if (remoteMode) return users;
    const chapterScoped =
      filterChapterId === "all" ? users : users.filter((u) => u.primary_chapter_id === filterChapterId);
    const q = searchCommitted.trim().toLowerCase().replace(/\s+/g, " ");
    if (!q) return chapterScoped;
    return chapterScoped.filter((u) => {
      const blob = buildUserSearchBlob(u, chapterOptions, variant);
      return blob.includes(q);
    });
  }, [remoteMode, users, filterChapterId, searchCommitted, variant, chapterOptions]);

  const sorted = useMemo(() => {
    if (remoteMode) return users;
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
  }, [remoteMode, users, filtered, order, orderBy, variant]);

  const paged = useMemo(() => {
    if (remoteMode) return users;
    if (rowsPerPage < 0) return sorted;
    return sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [remoteMode, users, sorted, page, rowsPerPage]);

  const showChapterFilter =
    chapterOptions.length > 0 && (elevated || (isLocalLeader && chapterOptions.length > 1));

  const showActionsColumn = elevated;

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
    setEditAddrLine(u.address_line?.trim() ?? "");
    setEditAddrCity(u.city?.trim() ?? "");
    setEditAddrState(u.state?.trim() ?? "");
    setEditAddrZip(u.zip_code?.trim() ?? "");
    setEditChapterId(u.primary_chapter_id ?? chapterOptions[0]?.id ?? "");
    setEditError(null);
    setEditRoleError(null);
    setEditRoleDraft(editableRoleFromUser(u));
    setEditNewPassword("");
    setEditPasswordVisible(false);
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
    const passwordPayload: { newPassword?: string } = {};
    if (elevated) {
      const np = editNewPassword.trim();
      if (np) {
        if (np.length < 8) {
          setEditError("Password must be at least 8 characters.");
          return;
        }
        passwordPayload.newPassword = np;
      }
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
          addressLine: editAddrLine.trim() || null,
          city: editAddrCity.trim() || null,
          state: usStateByCode(editAddrState)?.code ?? null,
          zipCode: editAddrZip.trim() || null,
          ...passwordPayload,
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
                  address_line:
                    row.address_line !== undefined ? row.address_line : editAddrLine.trim() || null,
                  city: row.city !== undefined ? row.city : editAddrCity.trim() || null,
                  state:
                    row.state !== undefined
                      ? row.state
                      : usStateByCode(editAddrState)?.code ?? null,
                  zip_code: row.zip_code !== undefined ? row.zip_code : editAddrZip.trim() || null,
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
      setEditNewPassword("");
      setEditPasswordVisible(false);
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

  async function runFluentSync() {
    if (!syncFromDate || !syncToDate) {
      setSyncError("Select start and end dates.");
      return;
    }
    if (!syncChapters && !syncLeaders && !syncMembers) {
      setSyncError("Select at least one sync target.");
      return;
    }
    setSyncError(null);
    setSyncLogs([]);
    setSyncSummary(null);
    setSyncing(true);
    try {
      const res = await fetch("/api/external/fluent-form-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromDate: syncFromDate,
          toDate: syncToDate,
          syncChapters,
          syncLeaders,
          syncMembers,
          syncAddressForExisting,
          assignDefaultPasswordForExisting,
        }),
      });
      if (!res.ok || !res.body) {
        const payload = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error || "Could not start Fluent Forms sync.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const evt = JSON.parse(trimmed) as {
              level: string;
              message: string;
              summary?: {
                usersAdded: number;
                membersAdded: number;
                localLeadersAdded: number;
                chaptersAdded: number;
                usersSkipped: number;
                skippedUsers: { email: string; reason: string }[];
              };
            };
            if (evt.level === "summary" && evt.summary) {
              setSyncSummary(evt.summary);
            }
            const prefix =
              evt.level === "ok"
                ? "[OK]"
                : evt.level === "warn"
                  ? "[WARN]"
                  : evt.level === "error"
                    ? "[ERROR]"
                    : evt.level === "summary"
                      ? "[SUMMARY]"
                      : "[INFO]";
            setSyncLogs((prev) => [...prev, `${prefix} ${evt.message}`]);
          } catch {
            setSyncLogs((prev) => [...prev, trimmed]);
          }
        }
      }
      router.refresh();
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : "Sync failed.");
    } finally {
      setSyncing(false);
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
          severity={
            inviteFlash.startsWith("ERROR:")
              ? "error"
              : inviteFlash.startsWith("User created, but email")
                ? "warning"
                : "success"
          }
          sx={{ mb: 2 }}
          onClose={() => setInviteFlash(null)}
        >
          {inviteFlash.startsWith("ERROR:") ? inviteFlash.slice(6) : inviteFlash}
        </Alert>
      ) : null}
      {tableFetchError ? (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setTableFetchError(null)}>
          {tableFetchError}
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
              {!isLeaders && !isAdmins ? (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    // Community sync should default to all targets on each open.
                    setSyncChapters(true);
                    setSyncLeaders(true);
                    setSyncMembers(true);
                    setSyncError(null);
                    setSyncLogs([]);
                    setSyncOpen(true);
                  }}
                >
                  Sync Fluent Forms
                </Button>
              ) : null}
            </>
          ) : null}
        </Box>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }}>
          <Box sx={{ position: "relative", minWidth: { sm: 320 }, flex: { sm: "0 1 420px" } }}>
            <TextField
              id={searchFieldId}
              size="small"
              fullWidth
              label="Search"
              placeholder={
                remoteMode
                  ? "Email, name, phone, address, city, state, ZIP. Suggestions while typing — press Enter, the search icon, or click outside to run."
                  : "Email, name, phone, address, city, state, ZIP, role. Press Enter, the search icon, or click outside to filter."
              }
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                if (remoteMode) setSuggestionsOpen(true);
              }}
              onFocus={() => {
                if (remoteMode && searchInput.trim().length >= 2) setSuggestionsOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  applySearchQuery(searchInput);
                }
              }}
              onBlur={() => {
                window.setTimeout(() => {
                  setSuggestionsOpen(false);
                  applySearchQuery(searchInputRef.current);
                }, 200);
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      aria-label="Run search"
                      edge="end"
                      onMouseDown={(ev) => ev.preventDefault()}
                      onClick={() => applySearchQuery(searchInput)}
                    >
                      <Search fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            {remoteMode &&
            suggestionsOpen &&
            searchOptions.length > 0 &&
            searchInput.trim().length >= 2 ? (
              <Paper
                elevation={6}
                sx={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  zIndex: 20,
                  mt: 0.5,
                  maxHeight: 260,
                  overflow: "auto",
                }}
              >
                <List dense disablePadding>
                  {searchOptions.map((opt) => (
                    <ListItemButton
                      key={opt.id}
                      onMouseDown={(ev) => ev.preventDefault()}
                      onClick={() => {
                        const email = emailFromSuggestionLabel(opt.label);
                        setSearchInput(email);
                        applySearchQuery(email);
                      }}
                    >
                      {opt.label}
                    </ListItemButton>
                  ))}
                </List>
              </Paper>
            ) : null}
            {remoteMode && searchLoading ? (
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
                Loading suggestions…
              </Typography>
            ) : null}
          </Box>
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
                id={
                  isAdmins ? "fp-chapter-filter-admins" : isLeaders ? "fp-chapter-filter-leaders" : "fp-chapter-filter-community"
                }
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
      {tableLoading ? <LinearProgress sx={{ mb: 1 }} /> : null}

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ color: "primary.main" }}>Avatar</TableCell>
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
            {showActionsColumn ? (
              <TableCell sx={{ color: "primary.main" }} align="right">
                Actions
              </TableCell>
            ) : null}
          </TableRow>
        </TableHead>
        <TableBody>
          {paged.map((u) => (
            <TableRow key={u.id}>
              <TableCell>
                <AvatarWithGraduateIcon
                  graduateRole={u.training_graduate_badge}
                  size={30}
                  src={u.avatar_url ? publicAssetSrc(u.avatar_url) : undefined}
                >
                  {(u.display_name || u.email || "U").slice(0, 1).toUpperCase()}
                </AvatarWithGraduateIcon>
              </TableCell>
              <TableCell>{u.first_name ?? "—"}</TableCell>
              <TableCell>{u.last_name ?? "—"}</TableCell>
              <TableCell>{u.display_name ?? "—"}</TableCell>
              <TableCell>{u.email}</TableCell>
              <TableCell>{u.phone?.trim() || "—"}</TableCell>
              <TableCell>
                {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
              </TableCell>
              <TableCell>{tableRoleLabel(u, variant)}</TableCell>
              {showActionsColumn ? (
                <TableCell align="right">
                  <IconButton
                    size="small"
                    color="inherit"
                    onClick={() => setViewUser(u)}
                    aria-label="View"
                  >
                    <Visibility fontSize="small" />
                  </IconButton>
                  {isSuperAdmin && u.id !== currentUserId ? (
                    <Tooltip title="Sign in as this user">
                      <span>
                        <IconButton
                          size="small"
                          color="info"
                          aria-label="Sign in as this user"
                          onClick={() => {
                            setImpersonateError(null);
                            setImpersonateUser(u);
                          }}
                        >
                          <SwitchAccount fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  ) : null}
                  {isAdmins && isSuperAdmin && eligibleForSuperAdminPromotionFromAdminsList(u) ? (
                    <Tooltip title="Make super administrator">
                      <span>
                        <IconButton
                          size="small"
                          color="warning"
                          aria-label="Make super administrator"
                          disabled={superPromoteSubmitting}
                          onClick={() => void runPromoteSuperAdmin(u)}
                        >
                          <Upgrade fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  ) : null}
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
              ) : null}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <TablePagination
        component="div"
        count={remoteMode ? totalCount : sorted.length}
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
        slotProps={{
          select: {
            id: tablePaginationRppId,
            labelId: tablePaginationRppLabelId,
          },
        }}
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
            <PasswordTextField
              id="invite-temporary-password"
              label="Temporary password"
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
              helperText="At least 8 characters. Share this only with the member. They must choose their own password after the first sign-in."
            />
            {chapterOptions.length > 0 ? (
              <ChapterSearchAutocomplete
                chapters={chapterOptions}
                valueId={isLocalLeader && localChapterId ? localChapterId : chapterId}
                onChangeId={setChapterId}
                allowNameAndAddressSearch={allowChapterNameSearch}
                disabled={Boolean(isLocalLeader && localChapterId)}
                required
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
              Excel: include a <strong>phone</strong> column (or Fluent <strong>numeric_field</strong>) for each
              user&apos;s phone (also used as temporary password when present).
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
              {viewUser.training_graduate_badge ? (
                <Box>
                  <CourseGraduateBadge role={viewUser.training_graduate_badge} />
                </Box>
              ) : null}
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
                Mailing address (profile)
              </Typography>
              <Typography>
                <strong>Street / address:</strong> {viewUser.address_line?.trim() || "—"}
              </Typography>
              <Typography>
                <strong>City:</strong> {viewUser.city?.trim() || "—"}
              </Typography>
              <Typography>
                <strong>State:</strong>{" "}
                {viewUser.state?.trim()
                  ? usStateByCode(viewUser.state)
                    ? `${usStateByCode(viewUser.state)!.name} (${viewUser.state})`
                    : viewUser.state
                  : "—"}
              </Typography>
              <Typography>
                <strong>ZIP code:</strong> {viewUser.zip_code?.trim() || "—"}
              </Typography>
              <Typography variant="subtitle2" sx={{ mt: 1, color: "primary.main" }}>
                Primary chapter
              </Typography>
              <Typography>
                <strong>Chapter name:</strong>{" "}
                {chapterById(viewUser.primary_chapter_id)?.name ??
                  chapterName(viewUser.primary_chapter_id)}
              </Typography>
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
              {viewUser && isAdmins && eligibleForSuperAdminPromotionFromAdminsList(viewUser) ? (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  This person is an <strong>Administrator</strong> (not super admin). You can promote them to{" "}
                  <strong>super administrator</strong> for the same access level as you.
                </Typography>
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
          {viewUser && isAdmins && eligibleForSuperAdminPromotionFromAdminsList(viewUser) ? (
            <Button
              color="warning"
              variant="contained"
              disabled={superPromoteSubmitting}
              onClick={() => void runPromoteSuperAdmin(viewUser)}
            >
              {superPromoteSubmitting ? "Saving…" : "Make super administrator"}
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
          setEditNewPassword("");
          setEditPasswordVisible(false);
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
            {editUser && elevated ? (
              <>
                <Divider />
                <SignInEmailChangePanel
                  key={`${editUser.id}-${editUser.email}`}
                  currentEmail={editUser.email}
                  sendOtpUrl={`/api/community/members/${editUser.id}/change-email/send-otp`}
                  confirmUrl={`/api/community/members/${editUser.id}/change-email/confirm`}
                  adminMode
                  disabled={editSaving || editRoleSaving}
                  onSuccess={(newEmail) => {
                    setEditUser((prev) => (prev ? { ...prev, email: newEmail } : prev));
                    setUsers((prev) =>
                      prev.map((u) => (u.id === editUser.id ? { ...u, email: newEmail } : u))
                    );
                    router.refresh();
                  }}
                />
              </>
            ) : editUser ? (
              <Typography variant="body2" color="text.secondary">
                Email: <strong>{editUser.email}</strong> (only administrators can change sign-in email here.)
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
            <Typography variant="subtitle2" sx={{ color: "primary.main", mt: 0.5 }}>
              Mailing address (optional)
            </Typography>
            <TextField
              label="Street address"
              fullWidth
              value={editAddrLine}
              onChange={(e) => setEditAddrLine(e.target.value)}
              autoComplete="street-address"
            />
            <TextField
              label="City"
              fullWidth
              value={editAddrCity}
              onChange={(e) => setEditAddrCity(e.target.value)}
              autoComplete="address-level2"
            />
            <UsStateSearchAutocomplete
              valueCode={editAddrState}
              onSelectCode={setEditAddrState}
              disabled={editSaving || editRoleSaving}
              label="State"
              size="medium"
            />
            <TextField
              label="ZIP code"
              fullWidth
              value={editAddrZip}
              onChange={(e) => setEditAddrZip(e.target.value)}
              autoComplete="postal-code"
            />
            {elevated ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Typography variant="subtitle2" sx={{ color: "primary.main", mt: 0.5 }}>
                  Sign-in password (optional)
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Administrators only. Leave blank to keep the current password. Minimum 8 characters if you set a
                  new one.
                </Typography>
                <TextField
                  label="New password"
                  type={editPasswordVisible ? "text" : "password"}
                  fullWidth
                  value={editNewPassword}
                  onChange={(e) => setEditNewPassword(e.target.value)}
                  autoComplete="new-password"
                  disabled={editSaving || editRoleSaving}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label={editPasswordVisible ? "Hide password" : "Show password"}
                          edge="end"
                          onClick={() => setEditPasswordVisible((v) => !v)}
                          disabled={editSaving || editRoleSaving}
                        >
                          {editPasswordVisible ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
            ) : null}
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
              <ChapterSearchAutocomplete
                chapters={chapterOptions}
                valueId={editChapterId}
                onChangeId={setEditChapterId}
                allowNameAndAddressSearch={allowChapterNameSearch}
                required
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
              setEditNewPassword("");
              setEditPasswordVisible(false);
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
        open={!!impersonateUser}
        onClose={() => {
          if (impersonateSubmitting) return;
          setImpersonateUser(null);
          setImpersonateError(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Sign in as this user</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {impersonateError ? <Alert severity="error">{impersonateError}</Alert> : null}
            <Alert severity="warning">
              You are about to start a session as another user. Your current super
              administrator session will end. To return to your account, sign out
              and sign back in with your own credentials.
            </Alert>
            {impersonateUser ? (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Target account
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {displayNameFor(impersonateUser)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {impersonateUser.email}
                </Typography>
              </Box>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              if (impersonateSubmitting) return;
              setImpersonateUser(null);
              setImpersonateError(null);
            }}
            disabled={impersonateSubmitting}
          >
            Cancel
          </Button>
          <Button
            color="info"
            variant="contained"
            disabled={impersonateSubmitting || !impersonateUser}
            onClick={() => {
              if (impersonateUser) void runImpersonate(impersonateUser);
            }}
          >
            {impersonateSubmitting ? "Signing in…" : "Sign in as user"}
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

      <Dialog open={syncOpen} onClose={() => !syncing && setSyncOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Sync from WordPress Fluent Forms</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: "grid", gap: 2 }}>
            {syncError ? <Alert severity="error">{syncError}</Alert> : null}
            <Typography variant="body2" color="text.secondary">
              Pulls Fluent Forms records by date range and imports in real time. Existing chapters are skipped.
              <strong> New users</strong> always receive mailing address from the form and the default password
              (FLASHPOINT). <strong>Existing users</strong> are only updated when you enable the options below (off by
              default — no address or password changes).
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="From"
                value={syncFromDate}
                onChange={(e) => setSyncFromDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                size="small"
                type="date"
                label="To"
                value={syncToDate}
                onChange={(e) => setSyncToDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} flexWrap="wrap" useFlexGap>
              <FormControlLabel
                control={<Checkbox checked={syncChapters} onChange={(e) => setSyncChapters(e.target.checked)} />}
                label="Chapters (by Church Affiliation)"
              />
              <FormControlLabel
                control={<Checkbox checked={syncLeaders} onChange={(e) => setSyncLeaders(e.target.checked)} />}
                label="Local leaders"
              />
              <FormControlLabel
                control={<Checkbox checked={syncMembers} onChange={(e) => setSyncMembers(e.target.checked)} />}
                label="Members"
              />
            </Stack>
            <Typography variant="subtitle2" sx={{ color: "primary.main" }}>
              Existing users only
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} flexWrap="wrap" useFlexGap>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={syncAddressForExisting}
                    onChange={(e) => setSyncAddressForExisting(e.target.checked)}
                  />
                }
                label="Sync mailing address from form"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={assignDefaultPasswordForExisting}
                    onChange={(e) => setAssignDefaultPasswordForExisting(e.target.checked)}
                  />
                }
                label="Assign default password (FLASHPOINT)"
              />
            </Stack>
            {syncSummary ? (
              <Alert severity="info" sx={{ "& .MuiAlert-message": { width: "100%" } }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Sync summary
                </Typography>
                <Typography variant="body2">
                  Total users added: {syncSummary.usersAdded} (Members: {syncSummary.membersAdded}, Local leaders:{" "}
                  {syncSummary.localLeadersAdded})
                  <br />
                  Total chapters: {syncSummary.chaptersAdded}
                  <br />
                  Users skipped: {syncSummary.usersSkipped}
                </Typography>
                {syncSummary.skippedUsers.length > 0 ? (
                  <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2.5 }}>
                    {syncSummary.skippedUsers.map((row) => (
                      <Typography key={`${row.email}-${row.reason}`} component="li" variant="caption" display="list-item">
                        {row.email} - {row.reason}
                      </Typography>
                    ))}
                  </Box>
                ) : null}
              </Alert>
            ) : null}
            <Box sx={{ maxHeight: 260, overflow: "auto", border: "1px solid rgba(255,255,255,0.12)", p: 1 }}>
              {syncLogs.length === 0 ? (
                <Typography variant="caption" color="text.secondary">
                  Sync logs will appear here...
                </Typography>
              ) : (
                syncLogs.map((line, idx) => (
                  <Typography key={`${line}-${idx}`} variant="caption" display="block">
                    {line}
                  </Typography>
                ))
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSyncOpen(false)} disabled={syncing}>
            Close
          </Button>
          <Button variant="contained" onClick={() => void runFluentSync()} disabled={syncing}>
            {syncing ? "Syncing..." : "Start sync"}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
