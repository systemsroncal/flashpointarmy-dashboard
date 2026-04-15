"use client";

import { writeAuditLog } from "@/lib/audit";
import { createClient } from "@/utils/supabase/client";
import { Add, DeleteOutline, Edit } from "@mui/icons-material";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
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
import { useSyncedState } from "@/hooks/useSyncedState";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type LocationRow = {
  id: string;
  name: string;
  region: string | null;
  created_at: string | null;
};

export function LocationsSection({
  rows: initial,
  canCreate,
  canUpdate,
  canDelete,
  forbidden,
}: {
  rows: LocationRow[];
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  forbidden: boolean;
}) {
  const router = useRouter();
  const [rows, setRows] = useSyncedState(initial);
  const [name, setName] = useState("");
  const [region, setRegion] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editRegion, setEditRegion] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<LocationRow | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  async function refresh() {
    router.refresh();
  }

  if (forbidden) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography color="error">You do not have access to Locations.</Typography>
      </Paper>
    );
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("locations")
      .insert({ name: name.trim(), region: region.trim() || null })
      .select("id, name, region, created_at")
      .single();
    if (!error && data) {
      setRows((r) => [data as LocationRow, ...r]);
      setName("");
      setRegion("");
      await writeAuditLog(supabase, "location.created", "location", data.id, {
        name: data.name,
        region: data.region ?? undefined,
      });
      void refresh();
    }
  }

  async function confirmDeleteLocation() {
    if (!deleteTarget || deleteConfirm !== "DELETE") return;
    const id = deleteTarget.id;
    const supabase = createClient();
    await supabase.from("locations").delete().eq("id", id);
    setRows((r) => r.filter((x) => x.id !== id));
    await writeAuditLog(supabase, "location.deleted", "location", id);
    setDeleteTarget(null);
    setDeleteConfirm("");
    void refresh();
  }

  async function saveEdit(id: string) {
    const supabase = createClient();
    await supabase
      .from("locations")
      .update({ name: editName, region: editRegion || null })
      .eq("id", id);
    setRows((r) =>
      r.map((x) =>
        x.id === id
          ? { ...x, name: editName, region: editRegion || null }
          : x
      )
    );
    setEditing(null);
    await writeAuditLog(supabase, "location.updated", "location", id, {
      name: editName,
      region: editRegion || undefined,
    });
    void refresh();
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ color: "primary.main" }}>
        Locations
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Location records. Open <strong>Chaperts</strong> from the sidebar for the linked
        subsection.
      </Typography>

      {canCreate ? (
        <Paper component="form" onSubmit={handleCreate} sx={{ p: 2, mb: 3 }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="flex-end">
            <TextField
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              fullWidth
              size="small"
            />
            <TextField
              label="Region"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              fullWidth
              size="small"
            />
            <Button type="submit" variant="contained" startIcon={<Add />}>
              Create
            </Button>
          </Stack>
        </Paper>
      ) : null}

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Region</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((loc) => (
              <TableRow key={loc.id}>
                <TableCell>
                  {editing === loc.id ? (
                    <TextField
                      size="small"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      fullWidth
                    />
                  ) : (
                    loc.name
                  )}
                </TableCell>
                <TableCell>
                  {editing === loc.id ? (
                    <TextField
                      size="small"
                      value={editRegion}
                      onChange={(e) => setEditRegion(e.target.value)}
                      fullWidth
                    />
                  ) : (
                    loc.region ?? "—"
                  )}
                </TableCell>
                <TableCell align="right">
                  {editing === loc.id ? (
                    <Button size="small" onClick={() => void saveEdit(loc.id)}>
                      Save
                    </Button>
                  ) : (
                    <>
                      {canUpdate ? (
                        <IconButton
                          size="small"
                          aria-label="Edit"
                          onClick={() => {
                            setEditing(loc.id);
                            setEditName(loc.name);
                            setEditRegion(loc.region ?? "");
                          }}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      ) : null}
                      {canDelete ? (
                        <IconButton
                          size="small"
                          aria-label="Delete"
                          onClick={() => {
                            setDeleteTarget(loc);
                            setDeleteConfirm("");
                          }}
                        >
                          <DeleteOutline fontSize="small" />
                        </IconButton>
                      ) : null}
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3}>
                  <Typography color="text.secondary" variant="body2">
                    No locations yet.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={!!deleteTarget}
        onClose={() => {
          setDeleteTarget(null);
          setDeleteConfirm("");
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete location</DialogTitle>
        <DialogContent>
          <Typography variant="body2" paragraph>
            This action cannot be undone. Any references to this location may need to be updated
            elsewhere.
          </Typography>
          {deleteTarget ? (
            <Typography variant="body2" sx={{ mb: 2 }}>
              <strong>{deleteTarget.name}</strong>
            </Typography>
          ) : null}
          <Typography variant="body2" sx={{ mb: 1 }}>
            Type <strong>DELETE</strong> to confirm.
          </Typography>
          <TextField
            fullWidth
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder="DELETE"
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDeleteTarget(null);
              setDeleteConfirm("");
            }}
          >
            Cancel
          </Button>
          <Button
            color="error"
            disabled={deleteConfirm !== "DELETE"}
            onClick={() => void confirmDeleteLocation()}
          >
            Delete permanently
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
