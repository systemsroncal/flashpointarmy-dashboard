"use client";

import type { AutoFollowTarget } from "@/app/api/mobilize/settings/auto-follow-targets/route";
import {
  type AddMemberSearchableUser,
  parseCommaSeparatedEmails,
} from "@/components/mobilize/MobilizeAddMemberDialog";
import { MobilizeDialog } from "@/components/mobilize/MobilizeDialog";
import { useMobilizeToast } from "@/components/mobilize/MobilizeToastProvider";
import { publicAssetSrc } from "@/lib/media/public-asset-url";
import DeleteIcon from "@mui/icons-material/Delete";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import SearchIcon from "@mui/icons-material/Search";
import TerminalIcon from "@mui/icons-material/Terminal";
import {
  Avatar,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

function userInitials(label: string): string {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.slice(0, 1) ?? "?";
  const last = parts.length > 1 ? parts[parts.length - 1].slice(0, 1) : "";
  return (first + last).toUpperCase();
}

function primaryRoleLabel(roleNames: string[]): string {
  if (roleNames.includes("super_admin")) return "Super admin";
  if (roleNames.includes("admin")) return "Administrator";
  if (roleNames.includes("sub_admin")) return "Sub administrator";
  if (roleNames.includes("local_leader")) return "Local leader";
  return roleNames.length ? roleNames[0] : "Member";
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

/**
 * Super-admin tab in Mobilize settings: manages the auto-follow whitelist.
 * New dashboard users automatically follow every user on this list.
 */
export function MobilizeAutoFollowSettings() {
  const toast = useMobilizeToast();
  const [targets, setTargets] = useState<AutoFollowTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [syncOpen, setSyncOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<AutoFollowTarget | null>(null);
  const [deleteTyped, setDeleteTyped] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/mobilize/settings/auto-follow-targets");
      const json = (await res.json()) as { targets?: AutoFollowTarget[]; error?: string };
      if (!res.ok) throw new Error(json.error || "Failed to load targets.");
      setTargets(json.targets ?? []);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed to load targets.", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function removeTarget(userId: string) {
    if (deletingId) return;
    setDeletingId(userId);
    try {
      const res = await fetch(
        `/api/mobilize/settings/auto-follow-targets/${userId}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(json.error || "Failed to remove target.");
      }
      toast("Target removed. New users will no longer auto-follow this user.", "success");
      setTargets((prev) => prev.filter((t) => t.user_id !== userId));
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed to remove target.", "error");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Box>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        spacing={1.5}
        sx={{ mb: 1 }}
      >
        <Box>
          <Typography variant="h6" fontWeight={700}>
            Auto-follow whitelist
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Members, local leaders, and admins (admin, sub-admin, super-admin)
            automatically follow every user on this list. Use Sync to apply the
            same follows to existing accounts.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button
            variant="outlined"
            startIcon={<TerminalIcon />}
            onClick={() => setSyncOpen(true)}
          >
            Sync users
          </Button>
          <Button
            variant="contained"
            startIcon={<PersonAddAlt1Icon />}
            onClick={() => setAddOpen(true)}
          >
            Add users
          </Button>
        </Stack>
      </Stack>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
          <CircularProgress size={30} />
        </Box>
      ) : targets.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 5, textAlign: "center" }}>
          No auto-follow targets yet. Click “Add users” to whitelist the users
          members, leaders, and admins should follow automatically.
        </Typography>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>User</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Added</TableCell>
                <TableCell align="right" sx={{ width: 64 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {targets.map((t) => (
                <TableRow key={t.user_id} hover>
                  <TableCell>
                    <Stack direction="row" spacing={1.25} alignItems="center">
                      <Avatar
                        src={t.user.avatar_url ? publicAssetSrc(t.user.avatar_url) : undefined}
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: "rgba(233,196,106,0.18)",
                          color: "primary.main",
                          fontSize: "0.75rem",
                        }}
                      >
                        {userInitials(t.user.label)}
                      </Avatar>
                      <Typography variant="body2" fontWeight={600}>
                        {t.user.label}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {t.user.email || "—"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={primaryRoleLabel(t.user.roleNames)} variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(t.created_at)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Remove from whitelist">
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setDeleteTyped("");
                            setConfirmTarget(t);
                          }}
                          disabled={deletingId === t.user_id || deletingId !== null}
                          color="error"
                          aria-label={`Remove ${t.user.label}`}
                        >
                          {deletingId === t.user_id ? (
                            <CircularProgress size={16} color="inherit" />
                          ) : (
                            <DeleteIcon fontSize="small" />
                          )}
                        </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <MobilizeAutoFollowAddDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdded={() => {
          setAddOpen(false);
          void load();
        }}
      />

      <MobilizeAutoFollowSyncDialog open={syncOpen} onClose={() => setSyncOpen(false)} />

      <MobilizeDialog
        open={confirmTarget !== null}
        onClose={() => {
          setConfirmTarget(null);
          setDeleteTyped("");
        }}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Remove auto-follow target</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            You are about to remove <strong>{confirmTarget?.user.label}</strong> from the
            auto-follow whitelist. New users will no longer automatically follow this user.
            Existing follows are kept.
          </Typography>
          <TextField
            size="small"
            label='Type “DELETE” to confirm'
            fullWidth
            value={deleteTyped}
            onChange={(e) => setDeleteTyped(e.target.value)}
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setConfirmTarget(null);
              setDeleteTyped("");
            }}
          >
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            disabled={deleteTyped.trim() !== "DELETE"}
            onClick={() => {
              const target = confirmTarget;
              setConfirmTarget(null);
              setDeleteTyped("");
              if (target) void removeTarget(target.user_id);
            }}
          >
            Remove
          </Button>
        </DialogActions>
      </MobilizeDialog>
    </Box>
  );
}

function MobilizeAutoFollowAddDialog({
  open,
  onClose,
  onAdded,
}: {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
}) {
  const toast = useMobilizeToast();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<AddMemberSearchableUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [emailsText, setEmailsText] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(
    async (q: string) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ limit: "200" });
        if (q.trim()) params.set("q", q.trim());
        const res = await fetch(`/api/mobilize/users-search?${params.toString()}`);
        const json = (await res.json()) as {
          users?: AddMemberSearchableUser[];
          error?: string;
        };
        if (!res.ok) throw new Error(json.error || "Failed to load users.");
        const list = json.users ?? [];
        setUsers(list);
        setSelectedIds((prev) => {
          const ids = new Set([...prev].filter((id) => list.some((u) => u.id === id)));
          return ids;
        });
      } catch (e) {
        toast(e instanceof Error ? e.message : "Failed to load users.", "error");
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setUsers([]);
    setSelectedIds(new Set());
    setEmailsText("");
    setAdding(false);
    void search("");
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [open, search]);

  function handleQueryChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => void search(value), 300);
  }

  function toggleUser(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const parsedEmails = useMemo(() => parseCommaSeparatedEmails(emailsText), [emailsText]);
  const canAdd = selectedIds.size > 0 || parsedEmails.length > 0;

  async function addSelected() {
    if (!canAdd || adding) return;
    setAdding(true);
    try {
      const res = await fetch("/api/mobilize/settings/auto-follow-targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userIds: [...selectedIds],
          emails: parsedEmails,
        }),
      });
      const json = (await res.json()) as {
        error?: string;
        added?: number;
        notFound?: string[];
      };
      if (!res.ok) throw new Error(json.error || "Failed to add targets.");
      const added = json.added ?? 0;
      const notFound = json.notFound?.length ?? 0;
      const notes: string[] = [];
      if (notFound > 0) notes.push(`${notFound} email(s) not found`);
      const suffix = notes.length ? ` (${notes.join(", ")})` : "";
      toast(`${added} target${added === 1 ? "" : "s"} added${suffix}.`, "success");
      onAdded();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed to add targets.", "error");
      setAdding(false);
    }
  }

  return (
    <MobilizeDialog open={open} onClose={() => !adding && onClose()} fullWidth maxWidth="sm">
      <DialogTitle>Add auto-follow targets</DialogTitle>
      <DialogContent>
        <Stack spacing={1.5} sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Users on this list are automatically followed by every new user. Select
            users in the table and/or paste a comma-separated email list.
          </Typography>
          <TextField
            size="small"
            label="Search by name or email"
            fullWidth
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: "text.secondary" }} />,
            }}
            autoFocus
          />
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          ) : users.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
              No matching users.
            </Typography>
          ) : (
            <TableContainer sx={{ maxHeight: 280 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox" sx={{ width: 44 }} />
                    <TableCell sx={{ fontWeight: 700 }}>User</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((u) => {
                    const checked = selectedIds.has(u.id);
                    return (
                      <TableRow
                        key={u.id}
                        hover
                        selected={checked}
                        onClick={() => toggleUser(u.id)}
                        sx={{ cursor: "pointer" }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            size="small"
                            checked={checked}
                            onClick={(e) => e.stopPropagation()}
                            onChange={() => toggleUser(u.id)}
                            inputProps={{ "aria-label": `Select ${u.label}` }}
                          />
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Avatar
                              src={u.avatar_url ? publicAssetSrc(u.avatar_url) : undefined}
                              sx={{
                                width: 30,
                                height: 30,
                                bgcolor: "rgba(233,196,106,0.18)",
                                color: "primary.main",
                                fontSize: "0.7rem",
                              }}
                            >
                              {userInitials(u.label)}
                            </Avatar>
                            <Typography variant="body2" fontWeight={600}>
                              {u.label}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {u.email || "—"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip size="small" label={primaryRoleLabel(u.roleNames)} variant="outlined" />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          <Box>
            <Typography variant="overline" sx={{ display: "block", color: "text.secondary", mb: 0.5 }}>
              or add by email
            </Typography>
            <TextField
              size="small"
              label="Emails separated by commas"
              fullWidth
              multiline
              minRows={2}
              placeholder="email1@example.com, email2@example.com, email3@example.com"
              value={emailsText}
              onChange={(e) => setEmailsText(e.target.value)}
              helperText={
                parsedEmails.length
                  ? `${parsedEmails.length} email${parsedEmails.length === 1 ? "" : "s"} will be added.`
                  : "Paste one or more emails to whitelist."
              }
            />
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={adding}>
          Cancel
        </Button>
        <Button
          variant="contained"
          disabled={!canAdd || adding}
          onClick={() => void addSelected()}
          startIcon={adding ? <CircularProgress size={14} color="inherit" /> : undefined}
        >
          {adding
            ? "Adding…"
            : `Add ${selectedIds.size + parsedEmails.length} user${selectedIds.size + parsedEmails.length === 1 ? "" : "s"}`}
        </Button>
      </DialogActions>
    </MobilizeDialog>
  );
}

type SyncLogLine = { level: string; text: string };

function logColor(level: string): string {
  if (level === "ok") return "#4ade80";
  if (level === "warn") return "#fbbf24";
  if (level === "error") return "#f87171";
  if (level === "summary") return "#67e8f9";
  return "#cbd5e1";
}

function MobilizeAutoFollowSyncDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const toast = useMobilizeToast();
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<SyncLogLine[]>([]);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const startedRef = useRef(false);
  const runningRef = useRef(false);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [logs]);

  const runSync = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    setRunning(true);
    setLogs([{ level: "info", text: "[INFO] Connecting…" }]);
    try {
      const res = await fetch("/api/mobilize/settings/auto-follow-targets/sync", {
        method: "POST",
      });
      if (!res.ok || !res.body) {
        const payload = (await res.json().catch(() => ({}))) as { error?: string };
        const retryAfter = res.headers.get("Retry-After");
        const msg =
          payload.error ||
          (res.status === 429
            ? `Too many requests. Retry after ${retryAfter || "60"}s.`
            : "Could not start sync.");
        throw new Error(msg);
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
        const incoming: SyncLogLine[] = [];
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const evt = JSON.parse(trimmed) as { level?: string; message?: string };
            const level = evt.level || "info";
            const prefix =
              level === "ok"
                ? "[OK]"
                : level === "warn"
                  ? "[WARN]"
                  : level === "error"
                    ? "[ERROR]"
                    : level === "summary"
                      ? "[SUMMARY]"
                      : "[INFO]";
            incoming.push({ level, text: `${prefix} ${evt.message ?? trimmed}` });
          } catch {
            incoming.push({ level: "info", text: trimmed });
          }
        }
        if (incoming.length) {
          setLogs((prev) => {
            const next = [...prev, ...incoming];
            return next.length > 4000 ? next.slice(-4000) : next;
          });
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Sync failed.";
      setLogs((prev) => [...prev, { level: "error", text: `[ERROR] ${msg}` }]);
      toast(msg, "error");
    } finally {
      runningRef.current = false;
      setRunning(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!open) {
      startedRef.current = false;
      runningRef.current = false;
      setLogs([]);
      setRunning(false);
      return;
    }
    if (startedRef.current) return;
    startedRef.current = true;
    void runSync();
  }, [open, runSync]);

  return (
    <MobilizeDialog
      open={open}
      onClose={() => !running && onClose()}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>Auto-follow sync</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Applies the whitelist to existing members and local leaders. New
          registrations follow automatically; this backfills everyone already in
          the system.
        </Typography>
        <Box
          ref={scrollerRef}
          sx={{
            bgcolor: "#0b1220",
            color: "#e2e8f0",
            fontFamily:
              'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            fontSize: "0.75rem",
            lineHeight: 1.55,
            borderRadius: 1,
            p: 1.5,
            height: { xs: 280, sm: 380 },
            overflow: "auto",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {logs.length === 0 ? (
            <Box component="span" sx={{ color: "#64748b" }}>
              $ waiting…
            </Box>
          ) : (
            logs.map((line, i) => (
              <Box key={`${i}-${line.text.slice(0, 24)}`} sx={{ color: logColor(line.level) }}>
                {line.text}
              </Box>
            ))
          )}
          {running ? (
            <Box component="span" sx={{ color: "#64748b" }}>
              ▍
            </Box>
          ) : null}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          variant="outlined"
          onClick={() => void runSync()}
          disabled={running}
          startIcon={running ? <CircularProgress size={14} color="inherit" /> : <TerminalIcon />}
        >
          {running ? "Running…" : "Run again"}
        </Button>
        <Button onClick={onClose} disabled={running} variant="contained">
          Close
        </Button>
      </DialogActions>
    </MobilizeDialog>
  );
}
