"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import EditIcon from "@mui/icons-material/Edit";
import LinkIcon from "@mui/icons-material/Link";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { MobilizeDialog } from "@/components/mobilize/MobilizeDialog";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { MobilizeSectionEmptyState } from "@/components/mobilize/MobilizeSectionEmptyState";
import { MobilizeTypeDeleteDialog } from "@/components/mobilize/MobilizeTypeDeleteDialog";
import { MOBILIZE_EMPTY_STATE_IMAGES } from "@/lib/mobilize/mobilize-empty-state-icons";
import { mobilizeCardSx } from "@/lib/mobilize/mobilize-ui-surface";
import { publicAssetSrc } from "@/lib/media/public-asset-url";
import { useMobilizeToast } from "@/components/mobilize/MobilizeToastProvider";

export type MobilizeResourceType = "link" | "document" | "video" | "text";

export type MobilizeResourceRow = {
  id: string;
  group_id: string;
  author_id: string;
  resource_type: MobilizeResourceType;
  title: string;
  body: string | null;
  url: string | null;
  file_name: string | null;
  created_at: string;
  updated_at: string;
};

const TYPE_LABELS: Record<MobilizeResourceType, string> = {
  link: "Link",
  document: "Document",
  video: "Video",
  text: "Text",
};

const TYPE_ICONS: Record<MobilizeResourceType, React.ReactNode> = {
  link: <LinkIcon fontSize="small" />,
  document: <DescriptionOutlinedIcon fontSize="small" />,
  video: <PlayCircleOutlineIcon fontSize="small" />,
  text: <ArticleOutlinedIcon fontSize="small" />,
};

type ResourceForm = {
  resource_type: MobilizeResourceType;
  title: string;
  body: string;
  url: string;
  file_name: string;
};

const emptyForm = (type: MobilizeResourceType = "link"): ResourceForm => ({
  resource_type: type,
  title: "",
  body: "",
  url: "",
  file_name: "",
});

type Props = {
  groupId: string;
  currentUserId: string;
  isLeader: boolean;
  isSuperAdmin?: boolean;
  canPost: boolean;
};

export default function MobilizeGroupResourcesPanel({
  groupId,
  currentUserId,
  isLeader,
  isSuperAdmin = false,
  canPost,
}: Props) {
  const toast = useMobilizeToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [resources, setResources] = useState<MobilizeResourceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editRow, setEditRow] = useState<MobilizeResourceRow | null>(null);
  const [deleteRow, setDeleteRow] = useState<MobilizeResourceRow | null>(null);
  const [form, setForm] = useState<ResourceForm>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const loadResources = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/mobilize/groups/${groupId}/resources`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load resources.");
      setResources((json.resources ?? []) as MobilizeResourceRow[]);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed to load resources.", "error");
    } finally {
      setLoading(false);
    }
  }, [groupId, toast]);

  useEffect(() => {
    void loadResources();
  }, [loadResources]);

  function openAdd() {
    setForm(emptyForm());
    setAddOpen(true);
  }

  function openEdit(row: MobilizeResourceRow) {
    setEditRow(row);
    setForm({
      resource_type: row.resource_type,
      title: row.title,
      body: row.body ?? "",
      url: row.url ?? "",
      file_name: row.file_name ?? "",
    });
  }

  async function uploadDocument(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch(`/api/mobilize/groups/${groupId}/resources/file`, {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload failed.");
      setForm((f) => ({
        ...f,
        url: String(json.url ?? ""),
        file_name: String(json.file_name ?? file.name),
      }));
      toast("Document uploaded.", "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Upload failed.", "error");
    } finally {
      setUploading(false);
    }
  }

  function validateForm(type: MobilizeResourceType, data: ResourceForm): string | null {
    if (!data.title.trim()) return "Title is required.";
    if (type === "text" && !data.body.trim()) return "Text content is required.";
    if ((type === "link" || type === "video") && !data.url.trim()) return "URL is required.";
    if (type === "document" && !data.url.trim()) return "Upload a document first.";
    return null;
  }

  async function submitAdd() {
    const err = validateForm(form.resource_type, form);
    if (err) {
      toast(err, "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/mobilize/groups/${groupId}/resources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resource_type: form.resource_type,
          title: form.title.trim(),
          body: form.resource_type === "text" ? form.body.trim() : null,
          url:
            form.resource_type === "text"
              ? null
              : form.resource_type === "document"
                ? form.url.trim()
                : form.url.trim(),
          file_name: form.resource_type === "document" ? form.file_name.trim() || null : null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Create failed.");
      toast("Resource added.", "success");
      setAddOpen(false);
      setForm(emptyForm());
      await loadResources();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Create failed.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function submitEdit() {
    if (!editRow) return;
    const err = validateForm(editRow.resource_type, form);
    if (err) {
      toast(err, "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/mobilize/groups/${groupId}/resources/${editRow.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          body: editRow.resource_type === "text" ? form.body.trim() : null,
          url:
            editRow.resource_type === "text"
              ? null
              : editRow.resource_type === "document"
                ? form.url.trim()
                : form.url.trim(),
          file_name: editRow.resource_type === "document" ? form.file_name.trim() || null : null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Update failed.");
      toast("Resource updated.", "success");
      setEditRow(null);
      await loadResources();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Update failed.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteRow) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/mobilize/groups/${groupId}/resources/${deleteRow.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Delete failed.");
      toast("Resource removed.", "success");
      setDeleteRow(null);
      await loadResources();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Delete failed.", "error");
    } finally {
      setSaving(false);
    }
  }

  function renderFormFields(type: MobilizeResourceType, isEdit: boolean) {
    return (
      <Stack spacing={2}>
        {!isEdit ? (
          <ToggleButtonGroup
            exclusive
            size="small"
            value={form.resource_type}
            onChange={(_, v: MobilizeResourceType | null) => {
              if (v) setForm(emptyForm(v));
            }}
          >
            {(Object.keys(TYPE_LABELS) as MobilizeResourceType[]).map((t) => (
              <ToggleButton key={t} value={t}>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  {TYPE_ICONS[t]}
                  <span>{TYPE_LABELS[t]}</span>
                </Stack>
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        ) : (
          <Chip icon={TYPE_ICONS[type] as React.ReactElement} label={TYPE_LABELS[type]} size="small" />
        )}
        <TextField
          label="Title"
          required
          fullWidth
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        />
        {type === "text" ? (
          <TextField
            label="Text"
            required
            fullWidth
            multiline
            minRows={4}
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
          />
        ) : null}
        {type === "link" || type === "video" ? (
          <TextField
            label={type === "video" ? "Video URL" : "Link URL"}
            required
            fullWidth
            placeholder="https://"
            value={form.url}
            onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
          />
        ) : null}
        {type === "document" ? (
          <Stack spacing={1}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadDocument(file);
                e.target.value = "";
              }}
            />
            <Button
              variant="outlined"
              startIcon={<UploadFileIcon />}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || saving}
            >
              {uploading ? "Uploading…" : form.url ? "Replace document" : "Upload PDF or Word"}
            </Button>
            {form.file_name ? (
              <Typography variant="body2" color="text.secondary">
                {form.file_name}
              </Typography>
            ) : null}
          </Stack>
        ) : null}
      </Stack>
    );
  }

  function renderResourceBody(row: MobilizeResourceRow) {
    if (row.resource_type === "text" && row.body) {
      return (
        <Typography variant="body2" sx={{ mt: 1, whiteSpace: "pre-wrap" }}>
          {row.body}
        </Typography>
      );
    }
    if (row.resource_type === "document" && row.url) {
      return (
        <Button
          size="small"
          sx={{ mt: 1 }}
          href={publicAssetSrc(row.url)}
          target="_blank"
          rel="noopener noreferrer"
          component="a"
        >
          {row.file_name ?? "Download document"}
        </Button>
      );
    }
    if ((row.resource_type === "link" || row.resource_type === "video") && row.url) {
      return (
        <Button
          size="small"
          sx={{ mt: 1 }}
          href={row.url}
          target="_blank"
          rel="noopener noreferrer"
          component="a"
        >
          {row.resource_type === "video" ? "Open video" : "Open link"}
        </Button>
      );
    }
    return null;
  }

  return (
    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      {canPost ? (
        <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={openAdd}
            sx={{ borderRadius: 99, textTransform: "none", fontWeight: 600, flexShrink: 0 }}
          >
            Add resource
          </Button>
        </Stack>
      ) : (
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Only group leaders can add resources.
        </Typography>
      )}

      {loading ? (
        <Typography color="text.secondary">Loading resources…</Typography>
      ) : resources.length ? (
        resources.map((row) => {
          const canManage =
            isSuperAdmin || isLeader || row.author_id === currentUserId;
          return (
            <Card key={row.id} variant="outlined" sx={{ mb: 1, ...mobilizeCardSx }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                      <Chip
                        size="small"
                        icon={TYPE_ICONS[row.resource_type] as React.ReactElement}
                        label={TYPE_LABELS[row.resource_type]}
                        variant="outlined"
                      />
                      <Typography variant="subtitle1" fontWeight={600}>
                        {row.title}
                      </Typography>
                    </Stack>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                      {new Date(row.created_at).toLocaleString()}
                    </Typography>
                    {renderResourceBody(row)}
                  </Box>
                  {canManage ? (
                    <Stack direction="row" spacing={0.5} flexShrink={0}>
                      <Button size="small" startIcon={<EditIcon />} onClick={() => openEdit(row)}>
                        Edit
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteOutlineIcon />}
                        onClick={() => setDeleteRow(row)}
                      >
                        Delete
                      </Button>
                    </Stack>
                  ) : null}
                </Stack>
              </CardContent>
            </Card>
          );
        })
      ) : (
        <MobilizeSectionEmptyState
          fill
          imageSrc={MOBILIZE_EMPTY_STATE_IMAGES.resources}
          title="No resources"
          description="Documents, links, videos, and notes shared with this group will appear here."
        />
      )}

      <MobilizeDialog open={addOpen} onClose={() => !saving && setAddOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add resource</DialogTitle>
        <DialogContent>{renderFormFields(form.resource_type, false)}</DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={() => void submitAdd()} disabled={saving || uploading}>
            {saving ? "Saving…" : "Add"}
          </Button>
        </DialogActions>
      </MobilizeDialog>

      <MobilizeDialog open={!!editRow} onClose={() => !saving && setEditRow(null)} fullWidth maxWidth="sm">
        <DialogTitle>Edit resource</DialogTitle>
        <DialogContent>
          {editRow ? renderFormFields(editRow.resource_type, true) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditRow(null)} disabled={saving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={() => void submitEdit()} disabled={saving || uploading}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogActions>
      </MobilizeDialog>

      <MobilizeTypeDeleteDialog
        open={!!deleteRow}
        title="Delete resource"
        description={
          <>
            Remove <strong>{deleteRow?.title}</strong>? This cannot be undone.
          </>
        }
        loading={saving}
        onClose={() => setDeleteRow(null)}
        onConfirm={() => void confirmDelete()}
      />
    </Box>
  );
}
