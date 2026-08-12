"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import SearchIcon from "@mui/icons-material/Search";
import {
  Avatar,
  Box,
  Button,
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

/**
 * Popup to add an existing dashboard user directly to a mobilize group.
 * Lists users (name/email search) excluding current members; the chosen user is
 * inserted as an approved Member via POST /api/mobilize/groups/[id]/members.
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
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
        setSelectedId((prev) => (prev && list.some((u) => u.id === prev) ? prev : null));
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
    setSelectedId(null);
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

  async function addSelected() {
    if (!selectedId || adding) return;
    setAdding(true);
    try {
      const res = await fetch(`/api/mobilize/groups/${groupId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedId }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error || "Failed to add member.");
      toast("Member added to the group.", "success");
      onAdded();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed to add member.", "error");
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
      <DialogTitle>Add member</DialogTitle>
      <DialogContent>
        <Stack spacing={1.5} sx={{ mt: 1 }}>
          {groupName ? (
            <Typography variant="body2" color="text.secondary">
              Add an existing user to <strong>{groupName}</strong>. The user is added as an
              approved Member and can be promoted to Leader later.
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
            <TableContainer sx={{ maxHeight: 360 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>User</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((u) => {
                    const selected = u.id === selectedId;
                    return (
                      <TableRow
                        key={u.id}
                        hover
                        selected={selected}
                        onClick={() => setSelectedId(u.id)}
                        sx={{ cursor: "pointer" }}
                      >
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
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={adding}>
          Cancel
        </Button>
        <Button
          variant="contained"
          disabled={!selectedId || adding}
          onClick={() => void addSelected()}
          startIcon={adding ? <CircularProgress size={14} color="inherit" /> : undefined}
        >
          {adding ? "Adding…" : "Add member"}
        </Button>
      </DialogActions>
    </MobilizeDialog>
  );
}
