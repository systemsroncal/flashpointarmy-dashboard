"use client";

import { publicAssetSrc } from "@/lib/media/public-asset-url";
import { formatEventLocationLine } from "@/lib/gatherings/event-location";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type EventListItem = {
  id: string;
  title: string;
  starts_at: string;
  status: string;
  slug: string | null;
  featured_image_url: string | null;
  is_virtual: boolean;
  virtual_url: string | null;
  location_manual: string | null;
  use_chapter_address: boolean;
  chapter: {
    name: string;
    city: string | null;
    state: string | null;
    zip_code: string | null;
  } | null;
};

function formatEventDateTime(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}

export function EventsListClient({
  events,
  canUpdate,
  canDelete,
}: {
  events: EventListItem[];
  canUpdate: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<EventListItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function confirmDelete() {
    if (!deleteTarget || deleteConfirm !== "DELETE") return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/dashboard/gatherings/${deleteTarget.id}`, { method: "DELETE" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setDeleteError(data.error || "Could not delete event.");
        return;
      }
      setDeleteTarget(null);
      setDeleteConfirm("");
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  if (events.length === 0) {
    return (
      <Typography color="text.secondary">No events yet. Create categories and an event to get started.</Typography>
    );
  }

  return (
    <>
      {events.map((e) => {
        const locationText = formatEventLocationLine({
          is_virtual: e.is_virtual,
          location_manual: e.location_manual,
          use_chapter_address: e.use_chapter_address,
          chapter: e.chapter,
        });
        return (
          <Box
            key={e.id}
            sx={{
              py: 1.5,
              borderBottom: "1px solid rgba(255,215,0,0.12)",
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "96px 1fr auto" },
              gap: 1.5,
              alignItems: "center",
            }}
          >
            <Box
              component="img"
              src={publicAssetSrc(e.featured_image_url || "/favicon.ico")}
              alt=""
              sx={{
                width: 96,
                height: 72,
                borderRadius: 1,
                objectFit: "contain",
                bgcolor: "rgba(255,255,255,0.06)",
              }}
            />
            <Box>
              <Typography sx={{ fontWeight: 700 }}>{e.title}</Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                {formatEventDateTime(e.starts_at)}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                {locationText}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 0.5, alignItems: "center", justifyContent: "flex-end", flexWrap: "wrap" }}>
              <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>
                {e.status}
              </Typography>
              {e.slug ? (
                <Tooltip title="Public page">
                  <IconButton
                    component={Link}
                    href={`/events/${e.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    size="small"
                    color="inherit"
                    aria-label="Open public event page"
                  >
                    <OpenInNewIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              ) : null}
              <Tooltip title="View">
                <IconButton
                  component={Link}
                  href={`/dashboard/gatherings/${e.id}`}
                  size="small"
                  color="inherit"
                  aria-label="View event"
                >
                  <VisibilityOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              {canUpdate ? (
                <Tooltip title="Edit">
                  <IconButton
                    component={Link}
                    href={`/dashboard/gatherings/${e.id}/edit`}
                    size="small"
                    color="primary"
                    aria-label="Edit event"
                  >
                    <EditOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              ) : null}
              {canDelete ? (
                <Tooltip title="Delete">
                  <IconButton
                    size="small"
                    color="error"
                    aria-label="Delete event"
                    onClick={() => {
                      setDeleteTarget(e);
                      setDeleteConfirm("");
                      setDeleteError(null);
                    }}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              ) : null}
            </Box>
          </Box>
        );
      })}

      <Dialog
        open={!!deleteTarget}
        onClose={() => !deleting && setDeleteTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete event</DialogTitle>
        <DialogContent>
          {deleteTarget ? (
            <Box sx={{ display: "grid", gap: 2, pt: 0.5 }}>
              <Typography variant="body2">
                This will permanently delete <strong>{deleteTarget.title}</strong>. Type{" "}
                <strong>DELETE</strong> to confirm.
              </Typography>
              <TextField
                label="Confirmation"
                value={deleteConfirm}
                onChange={(ev) => setDeleteConfirm(ev.target.value)}
                placeholder="DELETE"
                disabled={deleting}
                autoComplete="off"
                fullWidth
                size="small"
              />
              {deleteError ? (
                <Typography color="error" variant="body2">
                  {deleteError}
                </Typography>
              ) : null}
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            disabled={deleting || deleteConfirm !== "DELETE"}
            onClick={() => void confirmDelete()}
          >
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
