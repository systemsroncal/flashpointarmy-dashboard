"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import SearchIcon from "@mui/icons-material/Search";
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
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { MobilizeDialog } from "@/components/mobilize/MobilizeDialog";
import { useMobilizeToast } from "@/components/mobilize/MobilizeToastProvider";
import { publicAssetSrc } from "@/lib/media/public-asset-url";

export type AddMemberSearchableUser = {
  id: string;
  label: string;
  email: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  state: string | null;
  avatar_url: string | null;
  roleNames: string[];
};

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

/** Splits a comma-separated list of emails into trimmed, unique, non-empty entries. */
export function parseCommaSeparatedEmails(raw: string): string[] {
  return [
    ...new Set(
      raw
        .split(",")
        .map((e) => e.trim())
        .filter((e) => e.length > 0)
    ),
  ];
}

/**
 * Popup to add existing dashboard users directly to a mobilize group. Supports
 * multi-select from the searchable table and bulk add by comma-separated emails;
 * the chosen users are inserted as approved Members via
 * POST /api/mobilize/groups/[id]/members.
 */
export function MobilizeAddMemberDialog({
  open,
  groupId,
  groupName,
  onClose,
  onAdded,
}: {
  open: boolean;
  groupId: string;
  groupName: string;
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
        const params = new URLSearchParams({
          excludeGroupId: groupId,
          limit: "200",
        });
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
    [groupId, toast]
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
      const res = await fetch(`/api/mobilize/groups/${groupId}/members`, {
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
        alreadyMember?: string[];
        notFound?: string[];
        failed?: { id: string; error: string }[];
      };
      if (!res.ok) throw new Error(json.error || "Failed to add members.");

      const added = json.added ?? 0;
      const already = json.alreadyMember?.length ?? 0;
      const notFound = json.notFound?.length ?? 0;
      const failed = json.failed?.length ?? 0;

      if (added > 0) {
        const notes: string[] = [];
        if (already > 0) notes.push(`${already} already member(s)`);
        if (notFound > 0) notes.push(`${notFound} email(s) not found`);
        if (failed > 0) notes.push(`${failed} failed`);
        const suffix = notes.length ? ` (${notes.join(", ")})` : "";
        toast(`${added} member${added === 1 ? "" : "s"} added${suffix}.`, "success");
        onAdded();
      } else {
        const reasons: string[] = [];
        if (already > 0) reasons.push(`${already} already member(s)`);
        if (notFound > 0) reasons.push(`${notFound} email(s) not found`);
        if (failed > 0) reasons.push(`${failed} failed`);
        toast(
          reasons.length
            ? `No members added: ${reasons.join(", ")}.`
            : "No members added.",
          "info"
        );
        setAdding(false);
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed to add members.", "error");
      setAdding(false);
    }
  }

  return (
    <MobilizeDialog
      open={open}
      onClose={() => !adding && onClose()}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>Add members</DialogTitle>
      <DialogContent>
        <Stack spacing={1.5} sx={{ mt: 1 }}>
          {groupName ? (
            <Typography variant="body2" color="text.secondary">
              Add existing users to <strong>{groupName}</strong> by selecting them in the
              table and/or pasting a comma-separated email list. Users are added as approved
              Members and can be promoted to Leader later.
            </Typography>
          ) : null}
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
              No matching users. Existing members are already excluded from this list.
            </Typography>
          ) : (
            <TableContainer sx={{ maxHeight: 300 }}>
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
                  : "Paste one or more emails; existing members are skipped."
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
            : `Add ${selectedIds.size + parsedEmails.length} member${selectedIds.size + parsedEmails.length === 1 ? "" : "s"}`}
        </Button>
      </DialogActions>
    </MobilizeDialog>
  );
}
