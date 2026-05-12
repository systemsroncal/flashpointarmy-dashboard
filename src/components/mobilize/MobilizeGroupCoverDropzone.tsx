"use client";

import { useCallback, useRef, useState } from "react";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ImageIcon from "@mui/icons-material/Image";
import {
  Box,
  Button,
  Collapse,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { publicAssetSrc } from "@/lib/media/public-asset-url";
import { useMobilizeToast } from "@/components/mobilize/MobilizeToastProvider";

type Props = {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
};

export default function MobilizeGroupCoverDropzone({ value, onChange, disabled = false }: Props) {
  const toast = useMobilizeToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [urlOpen, setUrlOpen] = useState(false);

  const trimmed = value.trim();
  const previewSrc = trimmed ? publicAssetSrc(trimmed) : "";

  const uploadFile = useCallback(
    async (file: File) => {
      setUploading(true);
      try {
        const fd = new FormData();
        fd.set("file", file);
        const res = await fetch("/api/mobilize/groups/cover-image", { method: "POST", body: fd });
        const json = (await res.json()) as { cover_image_url?: string; error?: string };
        if (!res.ok) throw new Error(json.error || "Upload failed.");
        if (!json.cover_image_url) throw new Error("No image URL returned.");
        onChange(json.cover_image_url);
        toast("Cover image uploaded.", "success");
      } catch (e) {
        toast(e instanceof Error ? e.message : "Upload failed.", "error");
      } finally {
        setUploading(false);
      }
    },
    [onChange, toast]
  );

  function onPickFiles(files: FileList | null) {
    const f = files?.[0];
    if (f) void uploadFile(f);
  }

  function openFilePicker() {
    if (!disabled && !uploading) inputRef.current?.click();
  }

  return (
    <Box>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.75 }}>
        Cover image
      </Typography>

      {/* Upload target: always visible so users can add or replace */}
      <Box
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (disabled || uploading) return;
          onPickFiles(e.dataTransfer.files);
        }}
        onClick={() => openFilePicker()}
        sx={{
          py: previewSrc ? 2 : 3,
          px: 2,
          borderRadius: 1,
          border: "2px dashed",
          borderColor: dragOver ? "primary.main" : "rgba(255,215,0,0.25)",
          bgcolor: dragOver ? "rgba(255,215,0,0.06)" : "rgba(0,0,0,0.2)",
          textAlign: "center",
          cursor: disabled || uploading ? "default" : "pointer",
          mb: 1,
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <CloudUploadIcon sx={{ fontSize: 36, color: "text.secondary", mb: 0.5 }} />
        <Typography variant="body2" fontWeight={600}>
          {previewSrc ? "Drop a new image here or click to replace" : "Drop an image here or click to upload"}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
          JPEG, PNG, WebP, or GIF · max 1 MB
        </Typography>
      </Box>

      {/* Assigned / current cover thumbnail (edit with existing URL, or after upload) */}
      {previewSrc ? (
        <Box
          sx={{
            mt: 1,
            p: 1.5,
            borderRadius: 1,
            border: "1px solid rgba(255,215,0,0.2)",
            bgcolor: "rgba(0,0,0,0.25)",
          }}
        >
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
            Assigned cover preview
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "flex-start" }}>
            <Box
              component="img"
              src={previewSrc}
              alt=""
              sx={{
                width: "100%",
                maxWidth: 220,
                maxHeight: 140,
                objectFit: "cover",
                borderRadius: 1,
                display: "block",
                bgcolor: "rgba(0,0,0,0.35)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            />
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Button
                size="small"
                variant="outlined"
                startIcon={<ImageIcon />}
                disabled={disabled || uploading}
                onClick={(e) => {
                  e.stopPropagation();
                  openFilePicker();
                }}
              >
                Replace
              </Button>
              <Button
                size="small"
                color="error"
                variant="outlined"
                startIcon={<DeleteOutlineIcon />}
                disabled={disabled || uploading}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange("");
                }}
              >
                Remove
              </Button>
            </Stack>
          </Stack>
        </Box>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        hidden
        disabled={disabled || uploading}
        onChange={(e) => {
          onPickFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {uploading ? <LinearProgress sx={{ mb: 1 }} /> : null}

      <Button size="small" onClick={() => setUrlOpen((o) => !o)} disabled={disabled}>
        {urlOpen ? "Hide image URL" : "Paste image URL instead"}
      </Button>
      <Collapse in={urlOpen}>
        <TextField
          fullWidth
          size="small"
          sx={{ mt: 1 }}
          label="Image URL"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://… or /uploads/…"
          disabled={disabled}
        />
      </Collapse>
    </Box>
  );
}
