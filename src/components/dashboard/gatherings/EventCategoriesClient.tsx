"use client";

import { createClient } from "@/utils/supabase/client";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useSyncedState } from "@/hooks/useSyncedState";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Cat = { id: string; name: string; slug: string; sort_order: number | null };

export function EventCategoriesClient({
  initial,
  canMutate,
}: {
  initial: Cat[];
  canMutate: boolean;
}) {
  const router = useRouter();
  const [rows, setRows] = useSyncedState(initial);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Cat | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  async function add() {
    if (!canMutate || !name.trim()) return;
    const supabase = createClient();
    const s = slug.trim() || name.toLowerCase().replace(/\s+/g, "_");
    const { data, error } = await supabase
      .from("event_categories")
      .insert({ name: name.trim(), slug: s, sort_order: rows.length })
      .select("id, name, slug, sort_order")
      .single();
    if (!error && data) {
      setRows((r) => [...r, data as Cat]);
      setName("");
      setSlug("");
      router.refresh();
    }
  }

  async function confirmRemoveCategory() {
    if (!canMutate || !deleteTarget || deleteConfirm !== "DELETE") return;
    const id = deleteTarget.id;
    const supabase = createClient();
    await supabase.from("event_categories").delete().eq("id", id);
    setRows((r) => r.filter((x) => x.id !== id));
    setDeleteTarget(null);
    setDeleteConfirm("");
    router.refresh();
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ color: "primary.main", mb: 2 }}>
        Event categories
      </Typography>
      {canMutate ? (
        <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
          <TextField label="Name" size="small" value={name} onChange={(e) => setName(e.target.value)} />
          <TextField
            label="Slug"
            size="small"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            helperText="Optional; defaults from name"
          />
          <Button variant="contained" onClick={() => void add()}>
            Add
          </Button>
        </Box>
      ) : null}
      <Paper sx={{ bgcolor: "rgba(0,0,0,0.45)" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: "primary.main" }}>Name</TableCell>
              <TableCell sx={{ color: "primary.main" }}>Slug</TableCell>
              {canMutate ? <TableCell align="right" /> : null}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.name}</TableCell>
                <TableCell>{r.slug}</TableCell>
                {canMutate ? (
                  <TableCell align="right">
                    <Button
                      size="small"
                      color="error"
                      onClick={() => {
                        setDeleteTarget(r);
                        setDeleteConfirm("");
                      }}
                    >
                      Delete
                    </Button>
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Dialog
        open={!!deleteTarget}
        onClose={() => {
          setDeleteTarget(null);
          setDeleteConfirm("");
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete event category</DialogTitle>
        <DialogContent>
          <Typography variant="body2" paragraph>
            This action cannot be undone. Gatherings using this category may need to be reassigned.
          </Typography>
          {deleteTarget ? (
            <Typography variant="body2" sx={{ mb: 2 }}>
              <strong>{deleteTarget.name}</strong> ({deleteTarget.slug})
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
            onClick={() => void confirmRemoveCategory()}
          >
            Delete permanently
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
