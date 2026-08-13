"use client";

import { GatheringDescriptionEditor } from "@/components/dashboard/gatherings/GatheringDescriptionEditor";
import { MobilizeDialog } from "@/components/mobilize/MobilizeDialog";
import { MobilizeFeedHtml } from "@/components/mobilize/social/MobilizeFeedHtml";
import { formatMobilizeTimeAgo } from "@/components/mobilize/useMobilizeNotifications";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";

type GroupUpdateNotification = {
  id: string;
  title: string;
  body: string;
  body_html: string | null;
  created_at: string;
  author?: { display_name?: string };
};

type Props = {
  groupId: string;
};

export function MobilizeGroupCustomNotifications({ groupId }: Props) {
  const [items, setItems] = useState<GroupUpdateNotification[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [saving, setSaving] = useState(false);
  const [editTarget, setEditTarget] = useState<GroupUpdateNotification | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editHtml, setEditHtml] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/mobilize/groups/${groupId}/update-notifications`);
      const json = (await res.json()) as {
        error?: string;
        notifications?: GroupUpdateNotification[];
        can_manage?: boolean;
      };
      if (!res.ok) throw new Error(json.error || "Failed to load notifications.");
      setItems(json.notifications ?? []);
      setCanManage(Boolean(json.can_manage));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function createNotification() {
    const trimmed = title.trim();
    if (!trimmed) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/mobilize/groups/${groupId}/update-notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed, body_html: bodyHtml }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error || "Could not create notification.");
      setTitle("");
      setBodyHtml("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create notification.");
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit() {
    if (!editTarget) return;
    const trimmed = editTitle.trim();
    if (!trimmed) return;
    setEditSaving(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/mobilize/groups/${groupId}/update-notifications/${editTarget.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: trimmed, body_html: editHtml }),
        }
      );
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error || "Could not update notification.");
      setEditTarget(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update notification.");
    } finally {
      setEditSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/mobilize/groups/${groupId}/update-notifications/${deleteId}`,
        { method: "DELETE" }
      );
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error || "Could not delete notification.");
      setDeleteId(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete notification.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
        <NotificationsActiveOutlinedIcon sx={{ fontSize: 22, color: "primary.main" }} />
        <Typography variant="subtitle1" fontWeight={700}>
          Custom notifications
        </Typography>
      </Stack>

      {error ? (
        <Alert severity="error" sx={{ mb: 1.5 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      ) : null}

      {canManage ? (
        <Card variant="outlined" sx={{ mb: 2, bgcolor: "#fafafa" }}>
          <CardContent>
            <Stack spacing={1.5}>
              <TextField
                label="Title"
                size="small"
                fullWidth
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={saving}
                inputProps={{ maxLength: 200 }}
              />
              <GatheringDescriptionEditor value={bodyHtml} onChange={setBodyHtml} />
              <Box>
                <Button
                  variant="contained"
                  size="small"
                  disabled={saving || !title.trim()}
                  onClick={() => void createNotification()}
                >
                  {saving ? "Posting…" : "Add notification"}
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      ) : null}

      {!loading && !items.length ? (
        <Typography variant="body2" color="text.secondary">
          No custom notifications yet.
        </Typography>
      ) : null}

      <Stack spacing={1.25}>
        {items.map((item) => (
          <Card
            key={item.id}
            variant="outlined"
            sx={{
              bgcolor: "#fafafa",
              borderLeft: "4px solid",
              borderLeftColor: "primary.main",
            }}
          >
            <CardContent sx={{ py: 1.75, "&:last-child": { pb: 1.75 } }}>
              <Stack direction="row" spacing={1} alignItems="flex-start">
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                    <Typography fontWeight={700}>{item.title}</Typography>
                    <Chip size="small" label={formatMobilizeTimeAgo(item.created_at)} variant="outlined" />
                  </Stack>
                  {(item.body_html || item.body) ? (
                    <Box sx={{ mt: 0.75 }}>
                      <MobilizeFeedHtml html={item.body_html} plain={item.body} />
                    </Box>
                  ) : null}
                </Box>
                {canManage ? (
                  <Stack direction="row" spacing={0.25}>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        aria-label="Edit notification"
                        onClick={() => {
                          setEditTarget(item);
                          setEditTitle(item.title);
                          setEditHtml(item.body_html || item.body || "");
                        }}
                      >
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        aria-label="Delete notification"
                        onClick={() => setDeleteId(item.id)}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                ) : null}
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>

      <MobilizeDialog
        open={Boolean(editTarget)}
        onClose={() => setEditTarget(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Edit notification</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ mt: 1 }}>
            <TextField
              label="Title"
              size="small"
              fullWidth
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              disabled={editSaving}
              inputProps={{ maxLength: 200 }}
            />
            <GatheringDescriptionEditor value={editHtml} onChange={setEditHtml} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditTarget(null)} disabled={editSaving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={editSaving || !editTitle.trim()}
            onClick={() => void saveEdit()}
          >
            Save
          </Button>
        </DialogActions>
      </MobilizeDialog>

      <MobilizeDialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete notification</DialogTitle>
        <DialogContent>
          <Typography variant="body2">Delete this custom notification? This cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button color="error" variant="contained" disabled={deleting} onClick={() => void confirmDelete()}>
            Delete
          </Button>
        </DialogActions>
      </MobilizeDialog>
    </Box>
  );
}
