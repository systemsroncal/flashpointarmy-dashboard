"use client";

import type { AnnouncementTargetUser } from "@/lib/dashboard/announcement-recipients";
import {
  audienceChipLabel,
  normalizeAnnouncementAudience,
  type AnnouncementAudience,
  type AnnouncementCta,
  type AnnouncementListItem,
} from "@/lib/dashboard/announcements-types";
import { AnnouncementTargetUsersField } from "@/components/dashboard/notifications/AnnouncementTargetUsersField";
import { InlinePdfPreview } from "@/components/dashboard/notifications/InlinePdfPreview";
import {
  ANNOUNCEMENT_PDF_MAX_BYTES,
  normalizeAnnouncementPdfUrl,
} from "@/lib/dashboard/announcement-pdf";
import {
  getMissionUpdateSoundEnabled,
  setMissionUpdateSoundEnabled as persistMissionUpdateSoundEnabled,
} from "@/lib/notifications/mission-update-sound-pref";
import { GatheringDescriptionEditor } from "@/components/dashboard/gatherings/GatheringDescriptionEditor";
import {
  AnnouncementDescriptionBody,
  announcementPlainTextPreview,
} from "@/components/dashboard/notifications/AnnouncementDescriptionBody";
import AddIcon from "@mui/icons-material/Add";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const PREVIEW_CHARS = 240;

function emptyCta(): AnnouncementCta {
  return {
    label: "",
    url: "",
    open_in_new_tab: true,
    bg_color: "#1976d2",
    text_color: "#ffffff",
  };
}

function toLocalDatetimeValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalDatetimeValue(s: string): string | null {
  if (!s.trim()) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

type Snack = { message: string; severity: "success" | "error" };

export function NotificationsAppClient({ canManage }: { canManage: boolean }) {
  const [items, setItems] = useState<AnnouncementListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [snack, setSnack] = useState<Snack | null>(null);
  const [expandedDesc, setExpandedDesc] = useState<Record<string, boolean>>({});

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [readMoreCollapsed, setReadMoreCollapsed] = useState(false);
  const [audience, setAudience] = useState<AnnouncementAudience>("everyone");
  const [targetUsers, setTargetUsers] = useState<AnnouncementTargetUser[]>([]);
  const [missionUpdateSoundEnabled, setMissionUpdateSoundEnabled] = useState(true);
  const [useExpiry, setUseExpiry] = useState(false);
  const [expiresLocal, setExpiresLocal] = useState("");
  const [ctas, setCtas] = useState<AnnouncementCta[]>([]);
  const [pdfUrl, setPdfUrl] = useState("");
  const [pdfFileName, setPdfFileName] = useState("");
  const [pdfUploading, setPdfUploading] = useState(false);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const [confirmSaveEdit, setConfirmSaveEdit] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDismissId, setConfirmDismissId] = useState<string | null>(null);

  useEffect(() => {
    setMissionUpdateSoundEnabled(getMissionUpdateSoundEnabled());
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/announcements", { cache: "no-store" });
      const data = (await res.json()) as { announcements?: AnnouncementListItem[]; error?: string };
      if (!res.ok) throw new Error(data.error || "Could not load notifications.");
      setItems(data.announcements ?? []);
    } catch (e) {
      setSnack({ message: e instanceof Error ? e.message : "Error", severity: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setReadMoreCollapsed(false);
    setAudience("everyone");
    setTargetUsers([]);
    setUseExpiry(false);
    setExpiresLocal("");
    setCtas([]);
    setPdfUrl("");
    setPdfFileName("");
    setDialogOpen(true);
  };

  const openEdit = (row: AnnouncementListItem) => {
    setEditingId(row.id);
    setTitle(row.title);
    setDescription(row.description);
    setReadMoreCollapsed(row.read_more_collapsed);
    setAudience(normalizeAnnouncementAudience(row.audience));
    setTargetUsers(row.target_users ?? []);
    const ex = row.expires_at;
    if (ex) {
      setUseExpiry(true);
      setExpiresLocal(toLocalDatetimeValue(ex));
    } else {
      setUseExpiry(false);
      setExpiresLocal("");
    }
    setCtas(row.ctas?.length ? row.ctas.map((c) => ({ ...c })) : []);
    setPdfUrl(row.pdf_url?.trim() ?? "");
    setPdfFileName(row.pdf_file_name?.trim() ?? "");
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setConfirmSaveEdit(false);
  };

  const submitPayload = useMemo(
    () => ({
      title: title.trim(),
      description: description.trim(),
      read_more_collapsed: readMoreCollapsed,
      audience,
      target_user_ids: audience === "specific_users" ? targetUsers.map((u) => u.id) : [],
      expires_at: useExpiry ? fromLocalDatetimeValue(expiresLocal) : null,
      pdf_url: pdfUrl.trim() ? normalizeAnnouncementPdfUrl(pdfUrl) : null,
      pdf_file_name: pdfUrl.trim()
        ? pdfFileName.trim() || "document.pdf"
        : null,
      ctas: ctas
        .filter((c) => c.label.trim() && c.url.trim())
        .slice(0, 3)
        .map((c) => ({
          label: c.label.trim(),
          url: c.url.trim(),
          open_in_new_tab: c.open_in_new_tab !== false,
          bg_color: c.bg_color || "#1976d2",
          text_color: c.text_color || "#ffffff",
        })),
    }),
    [
      title,
      description,
      readMoreCollapsed,
      audience,
      targetUsers,
      useExpiry,
      expiresLocal,
      ctas,
      pdfUrl,
      pdfFileName,
    ]
  );

  async function uploadPdfFile(file: File) {
    if (file.size > ANNOUNCEMENT_PDF_MAX_BYTES) {
      setSnack({ message: "PDF must be 7 MB or smaller.", severity: "error" });
      return;
    }
    setPdfUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/dashboard/announcements/pdf", { method: "POST", body: fd });
      const data = (await res.json()) as {
        error?: string;
        pdf_url?: string;
        pdf_file_name?: string;
      };
      if (!res.ok) throw new Error(data.error || "PDF upload failed.");
      setPdfUrl(data.pdf_url ?? "");
      setPdfFileName(data.pdf_file_name ?? file.name);
      setSnack({ message: "PDF uploaded.", severity: "success" });
    } catch (e) {
      setSnack({ message: e instanceof Error ? e.message : "Upload failed.", severity: "error" });
    } finally {
      setPdfUploading(false);
      if (pdfInputRef.current) pdfInputRef.current.value = "";
    }
  }

  const performSave = async () => {
    if (!submitPayload.title) {
      setSnack({ message: "Title is required.", severity: "error" });
      return;
    }
    if (audience === "specific_users" && targetUsers.length === 0) {
      setSnack({ message: "Select at least one user.", severity: "error" });
      return;
    }
    if (pdfUrl.trim() && !submitPayload.pdf_url) {
      setSnack({
        message: "PDF must be an https link or an uploaded file.",
        severity: "error",
      });
      return;
    }
    try {
      if (editingId) {
        const res = await fetch(`/api/dashboard/announcements/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(submitPayload),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(data.error || "Update failed.");
      } else {
        const res = await fetch("/api/dashboard/announcements", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(submitPayload),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(data.error || "Create failed.");
      }
      setSnack({
        message: editingId ? "Mission Update saved." : "Mission Update created.",
        severity: "success",
      });
      closeDialog();
      await load();
    } catch (e) {
      setSnack({ message: e instanceof Error ? e.message : "Error", severity: "error" });
    }
  };

  const requestSave = () => {
    if (editingId) setConfirmSaveEdit(true);
    else void performSave();
  };

  const performDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/dashboard/announcements/${id}`, { method: "DELETE" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Delete failed.");
      setSnack({ message: "Mission Update deleted.", severity: "success" });
      setConfirmDeleteId(null);
      await load();
    } catch (e) {
      setSnack({ message: e instanceof Error ? e.message : "Error", severity: "error" });
    }
  };

  const performDismiss = async (id: string) => {
    try {
      const res = await fetch(`/api/dashboard/announcements/${id}/dismiss`, { method: "POST" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Could not remove.");
      setSnack({ message: "Removed from your list.", severity: "success" });
      setConfirmDismissId(null);
      await load();
    } catch (e) {
      setSnack({ message: e instanceof Error ? e.message : "Error", severity: "error" });
    }
  };

  const setRead = async (id: string, read: boolean) => {
    try {
      const res = await fetch(`/api/dashboard/announcements/${id}/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Could not update read state.");
      await load();
    } catch (e) {
      setSnack({ message: e instanceof Error ? e.message : "Error", severity: "error" });
    }
  };

  const addCtaRow = () => {
    if (ctas.length >= 3) return;
    setCtas((prev) => [...prev, emptyCta()]);
  };

  const updateCta = (i: number, patch: Partial<AnnouncementCta>) => {
    setCtas((prev) => prev.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  };

  const removeCta = (i: number) => {
    setCtas((prev) => prev.filter((_, j) => j !== i));
  };

  return (
    <Box sx={{ maxWidth: 920, mx: "auto" }}>
      <Stack spacing={2} sx={{ mb: 3 }}>
        {canManage ? (
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} sx={{ alignSelf: "flex-start" }}>
            Add new Mission Update
          </Button>
        ) : null}
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <NotificationsActiveOutlinedIcon sx={{ color: "primary.main", fontSize: 32 }} />
          <Box>
            <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: 0.3 }}>
              Missions updates
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {canManage
                ? "Create Mission Updates and choose who can see them. Expired items are hidden automatically."
                : "Stay up to date with Mission Updates from your organization."}
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={missionUpdateSoundEnabled}
                  onChange={(_, checked) => {
                    setMissionUpdateSoundEnabled(checked);
                    persistMissionUpdateSoundEnabled(checked);
                  }}
                />
              }
              label="Play trumpet sound for new Mission Updates"
              sx={{ mt: 0.5 }}
            />
          </Box>
        </Stack>
      </Stack>

      {loading ? (
        <Typography color="text.secondary">Loading…</Typography>
      ) : items.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 4,
            textAlign: "center",
            bgcolor: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,215,0,0.12)",
            borderRadius: 2,
          }}
        >
          <Typography color="text.secondary">No Mission Updates right now.</Typography>
        </Paper>
      ) : (
        <Stack spacing={2.5}>
          {items.map((row) => {
            const unread = !row.read_at;
            const expanded = expandedDesc[row.id];
            const plainPreview = announcementPlainTextPreview(row.description);
            const useCollapse = row.read_more_collapsed && plainPreview.length > PREVIEW_CHARS;
            const previewSnippet =
              useCollapse && !expanded ? `${plainPreview.slice(0, PREVIEW_CHARS).trim()}…` : null;

            return (
              <Paper
                key={row.id}
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  bgcolor: "rgba(12,14,20,0.75)",
                  border: "1px solid rgba(255,215,0,0.14)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
                  position: "relative",
                  overflow: "hidden",
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 4,
                    bgcolor: unread ? "primary.main" : "rgba(255,255,255,0.15)",
                  },
                }}
              >
                <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2} sx={{ pl: 0.5 }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
                      <Typography variant="h6" component="h2" sx={{ fontWeight: 700, color: "grey.100" }}>
                        {row.title}
                      </Typography>
                      {unread ? <Chip size="small" label="Unread" color="primary" variant="outlined" /> : null}
                      <Chip
                        size="small"
                        icon={<AccessTimeIcon sx={{ fontSize: "16px !important" }} />}
                        label={new Date(row.created_at).toLocaleString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        variant="outlined"
                        sx={{ borderColor: "rgba(255,255,255,0.25)", color: "grey.400" }}
                      />
                      <Chip
                        size="small"
                        label={`Visible to: ${audienceChipLabel(normalizeAnnouncementAudience(row.audience), row.target_users)}`}
                        variant="outlined"
                        sx={{ borderColor: "rgba(129,140,248,0.45)", color: "primary.light" }}
                      />
                      {row.expires_at ? (
                        <Chip
                          size="small"
                          label={`Expires ${new Date(row.expires_at).toLocaleString()}`}
                          variant="outlined"
                          sx={{ borderColor: "rgba(255,255,255,0.25)", color: "grey.400" }}
                        />
                      ) : (
                        <Chip
                          size="small"
                          label="No expiry"
                          variant="outlined"
                          sx={{ borderColor: "rgba(255,255,255,0.2)", color: "grey.500" }}
                        />
                      )}
                    </Stack>
                    {previewSnippet ? (
                      <Typography
                        variant="body2"
                        sx={{ color: "grey.300", whiteSpace: "pre-wrap", lineHeight: 1.65, mb: row.ctas?.length ? 2 : 0 }}
                      >
                        {previewSnippet}
                      </Typography>
                    ) : (
                      <Box sx={{ mb: row.ctas?.length ? 2 : 0 }}>
                        <AnnouncementDescriptionBody html={row.description} />
                      </Box>
                    )}
                    {useCollapse ? (
                      <Button
                        size="small"
                        onClick={() => setExpandedDesc((m) => ({ ...m, [row.id]: !expanded }))}
                        endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        sx={{ mt: 0.5, color: "primary.light", textTransform: "none" }}
                      >
                        {expanded ? "Read less" : "Read more"}
                      </Button>
                    ) : null}

                    {row.ctas?.length ? (
                      <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 2 }}>
                        {row.ctas.map((c, idx) => (
                          <Button
                            key={`${row.id}-cta-${idx}`}
                            component="a"
                            href={c.url}
                            target={c.open_in_new_tab !== false ? "_blank" : undefined}
                            rel={c.open_in_new_tab !== false ? "noopener noreferrer" : undefined}
                            variant="contained"
                            disableElevation
                            sx={{
                              bgcolor: c.bg_color,
                              color: c.text_color,
                              "&:hover": { bgcolor: c.bg_color, filter: "brightness(1.08)" },
                              textTransform: "none",
                              fontWeight: 600,
                            }}
                          >
                            {c.label}
                          </Button>
                        ))}
                      </Stack>
                    ) : null}

                    {row.pdf_url?.trim() ? (
                      <InlinePdfPreview
                        pdfUrl={row.pdf_url.trim()}
                        fileName={row.pdf_file_name}
                      />
                    ) : null}
                  </Box>
                </Stack>

                <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.08)" }} />

                <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center">
                  {unread ? (
                    <Button size="small" variant="outlined" onClick={() => void setRead(row.id, true)}>
                      Mark as read
                    </Button>
                  ) : (
                    <Button size="small" variant="outlined" onClick={() => void setRead(row.id, false)}>
                      Mark as unread
                    </Button>
                  )}
                  <Button size="small" color="warning" variant="outlined" onClick={() => setConfirmDismissId(row.id)}>
                    Remove from my list
                  </Button>
                  {canManage ? (
                    <>
                      <Button size="small" startIcon={<EditOutlinedIcon />} onClick={() => openEdit(row)}>
                        Edit
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        variant="outlined"
                        startIcon={<DeleteOutlineIcon />}
                        onClick={() => setConfirmDeleteId(row.id)}
                      >
                        Delete
                      </Button>
                    </>
                  ) : null}
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      )}

      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        fullWidth
        maxWidth="lg"
        disableEnforceFocus
        disableRestoreFocus
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pr: 1 }}>
          {editingId ? "Edit Mission Update" : "New Mission Update"}
          <IconButton aria-label="Close" onClick={closeDialog} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ maxHeight: "min(88vh, 900px)", overflow: "auto" }}>
          <Stack spacing={2.25}>
            <TextField label="Mission Update title" value={title} onChange={(e) => setTitle(e.target.value)} fullWidth required />
            <GatheringDescriptionEditor
              key={editingId ?? "new-notification"}
              label="Description"
              value={description}
              onChange={setDescription}
              videoEmbedButton
              imageUploadEndpoint="/api/dashboard/announcements/image"
              helperText='Rich text (TinyMCE). Use Image to upload a file or paste an HTTPS image URL. Video: toolbar “Video” inserts [fpa_video]URL[/fpa_video]. Plyr plays YouTube, Vimeo, and direct MP4. Source: Code button.'
            />
            {canManage ? (
              <FormControl fullWidth>
                <InputLabel id="announcement-audience-label">Visible to</InputLabel>
                <Select
                  labelId="announcement-audience-label"
                  label="Visible to"
                  value={audience}
                  onChange={(e) => {
                    const next = e.target.value as AnnouncementAudience;
                    setAudience(next);
                    if (next !== "specific_users") setTargetUsers([]);
                  }}
                >
                  <MenuItem value="everyone">Everyone</MenuItem>
                  <MenuItem value="leaders">Leaders</MenuItem>
                  <MenuItem value="members">Members</MenuItem>
                  <MenuItem value="admins">Admins</MenuItem>
                  <MenuItem value="specific_users">Specific user(s)</MenuItem>
                </Select>
                <FormHelperText>
                  Everyone: all signed-in users. Leaders: Local leader role. Members: Member role without Local
                  leader. Admins: Administrator, Sub administrator, and Super administrator. Specific user(s): only the
                  people you select below.
                </FormHelperText>
              </FormControl>
            ) : null}
            {canManage && audience === "specific_users" ? (
              <AnnouncementTargetUsersField value={targetUsers} onChange={setTargetUsers} />
            ) : null}
            <FormControlLabel
              control={<Switch checked={readMoreCollapsed} onChange={(_, v) => setReadMoreCollapsed(v)} />}
              label="Read more / Read less (long descriptions collapse)"
            />
            <FormControlLabel
              control={<Switch checked={useExpiry} onChange={(_, v) => setUseExpiry(v)} />}
              label="Set expiration"
            />
            {useExpiry ? (
              <TextField
                label="Expires"
                type="datetime-local"
                value={expiresLocal}
                onChange={(e) => setExpiresLocal(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            ) : null}

            <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />
            <Typography variant="subtitle2" color="text.secondary">
              PDF attachment (optional, max 7 MB)
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Paste an https PDF link or upload a file. Recipients preview it inside Notifications
              (no new tab).
            </Typography>
            <TextField
              size="small"
              label="PDF link (https)"
              value={pdfUrl}
              onChange={(e) => {
                setPdfUrl(e.target.value);
                if (!pdfFileName.trim()) {
                  const name = e.target.value.split("/").pop()?.split("?")[0] ?? "";
                  if (name.toLowerCase().endsWith(".pdf")) setPdfFileName(decodeURIComponent(name));
                }
              }}
              fullWidth
              placeholder="https://example.com/file.pdf"
            />
            <TextField
              size="small"
              label="PDF display name"
              value={pdfFileName}
              onChange={(e) => setPdfFileName(e.target.value)}
              fullWidth
              disabled={!pdfUrl.trim()}
            />
            <input
              ref={pdfInputRef}
              type="file"
              accept="application/pdf,.pdf"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void uploadPdfFile(f);
              }}
            />
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Button
                variant="outlined"
                startIcon={
                  pdfUploading ? <CircularProgress size={16} /> : <UploadFileOutlinedIcon />
                }
                disabled={pdfUploading}
                onClick={() => pdfInputRef.current?.click()}
                sx={{ textTransform: "none" }}
              >
                {pdfUploading ? "Uploading…" : "Upload PDF"}
              </Button>
              {pdfUrl.trim() ? (
                <Button
                  color="inherit"
                  startIcon={<DeleteOutlineIcon />}
                  onClick={() => {
                    setPdfUrl("");
                    setPdfFileName("");
                  }}
                  sx={{ textTransform: "none" }}
                >
                  Remove PDF
                </Button>
              ) : null}
            </Stack>
            {pdfUrl.trim() && normalizeAnnouncementPdfUrl(pdfUrl) ? (
              <Stack direction="row" spacing={1} alignItems="center">
                <PictureAsPdfOutlinedIcon fontSize="small" color="primary" />
                <Typography variant="caption" color="primary.light">
                  {pdfFileName.trim() || "PDF ready"}
                </Typography>
              </Stack>
            ) : null}

            <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />
            <Typography variant="subtitle2" color="text.secondary">
              Call to actions (max 3)
            </Typography>
            {ctas.map((c, i) => (
              <Paper key={i} variant="outlined" sx={{ p: 2, bgcolor: "rgba(0,0,0,0.2)", borderColor: "rgba(255,255,255,0.12)" }}>
                <Stack spacing={1.5}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" color="primary.main">
                      Button {i + 1}
                    </Typography>
                    <Button size="small" color="inherit" onClick={() => removeCta(i)}>
                      Remove
                    </Button>
                  </Stack>
                  <TextField
                    size="small"
                    label="Label"
                    value={c.label}
                    onChange={(e) => updateCta(i, { label: e.target.value })}
                    fullWidth
                  />
                  <TextField size="small" label="URL" value={c.url} onChange={(e) => updateCta(i, { url: e.target.value })} fullWidth />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={c.open_in_new_tab !== false}
                        onChange={(_, v) => updateCta(i, { open_in_new_tab: v })}
                      />
                    }
                    label="Open in new tab"
                  />
                  <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                    <Typography variant="caption" sx={{ minWidth: 90 }}>
                      Background
                    </Typography>
                    <input
                      type="color"
                      value={c.bg_color}
                      onChange={(e) => updateCta(i, { bg_color: e.target.value })}
                      style={{ width: 48, height: 36, border: "none", borderRadius: 4, cursor: "pointer" }}
                    />
                    <Typography variant="caption" sx={{ minWidth: 70 }}>
                      Text
                    </Typography>
                    <input
                      type="color"
                      value={c.text_color}
                      onChange={(e) => updateCta(i, { text_color: e.target.value })}
                      style={{ width: 48, height: 36, border: "none", borderRadius: 4, cursor: "pointer" }}
                    />
                  </Stack>
                </Stack>
              </Paper>
            ))}
            {ctas.length < 3 ? (
              <Button variant="outlined" startIcon={<AddIcon />} onClick={addCtaRow} sx={{ alignSelf: "flex-start" }}>
                Add call to action
              </Button>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button variant="contained" onClick={requestSave}>
            {editingId ? "Save changes" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(confirmSaveEdit)} onClose={() => setConfirmSaveEdit(false)}>
        <DialogTitle>Save changes?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            This will update the notification for all users who can see it.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmSaveEdit(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              setConfirmSaveEdit(false);
              void performSave();
            }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(confirmDeleteId)} onClose={() => setConfirmDeleteId(null)}>
        <DialogTitle>Delete notification?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            This permanently removes the announcement for everyone. This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={() => confirmDeleteId && void performDelete(confirmDeleteId)}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(confirmDismissId)} onClose={() => setConfirmDismissId(null)}>
        <DialogTitle>Remove from your list?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            You can no longer see this announcement. Other users are not affected.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDismissId(null)}>Cancel</Button>
          <Button variant="contained" onClick={() => confirmDismissId && void performDismiss(confirmDismissId)}>
            Remove
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(snack)}
        autoHideDuration={5000}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        {snack ? (
          <Alert severity={snack.severity} onClose={() => setSnack(null)} sx={{ width: "100%" }}>
            {snack.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  );
}
