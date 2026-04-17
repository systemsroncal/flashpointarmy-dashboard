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
  TableSortLabel,
  TextField,
  Typography,
} from "@mui/material";
import { useSyncedState } from "@/hooks/useSyncedState";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type Cat = { id: string; name: string; slug: string; sort_order: number | null };

type CatSortKey = "name" | "slug" | "sort_order";

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
  const [tableSearch, setTableSearch] = useState("");
  const [orderBy, setOrderBy] = useState<CatSortKey>("sort_order");
  const [order, setOrder] = useState<"asc" | "desc">("asc");

  function handleRequestSort(property: CatSortKey) {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  }

  const displayed = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    const base = !q ? rows : rows.filter((r) => `${r.name} ${r.slug}`.toLowerCase().includes(q));
    const dir = order === "asc" ? 1 : -1;
    return [...base].sort((a, b) => {
      switch (orderBy) {
        case "name":
          return dir * a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
        case "slug":
          return dir * a.slug.localeCompare(b.slug, undefined, { sensitivity: "base" });
        case "sort_order": {
          const sa = a.sort_order ?? 0;
          const sb = b.sort_order ?? 0;
          return dir * (sa - sb);
        }
        default:
          return 0;
      }
    });
  }, [rows, tableSearch, order, orderBy]);

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
      <Box sx={{ mb: 2, maxWidth: 420 }}>
        <TextField
          size="small"
          fullWidth
          label="Search"
          placeholder="Name or slug…"
          value={tableSearch}
          onChange={(e) => setTableSearch(e.target.value)}
        />
      </Box>
      <Paper sx={{ bgcolor: "rgba(0,0,0,0.45)" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: "primary.main" }}>
                <TableSortLabel
                  active={orderBy === "name"}
                  direction={orderBy === "name" ? order : "asc"}
                  onClick={() => handleRequestSort("name")}
                >
                  Name
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ color: "primary.main" }}>
                <TableSortLabel
                  active={orderBy === "slug"}
                  direction={orderBy === "slug" ? order : "asc"}
                  onClick={() => handleRequestSort("slug")}
                >
                  Slug
                </TableSortLabel>
              </TableCell>
              {canMutate ? (
                <TableCell sx={{ color: "primary.main" }}>
                  <TableSortLabel
                    active={orderBy === "sort_order"}
                    direction={orderBy === "sort_order" ? order : "asc"}
                    onClick={() => handleRequestSort("sort_order")}
                  >
                    Order
                  </TableSortLabel>
                </TableCell>
              ) : null}
              {canMutate ? <TableCell align="right" /> : null}
            </TableRow>
          </TableHead>
          <TableBody>
            {displayed.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.name}</TableCell>
                <TableCell>{r.slug}</TableCell>
                {canMutate ? <TableCell>{r.sort_order ?? "—"}</TableCell> : null}
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
