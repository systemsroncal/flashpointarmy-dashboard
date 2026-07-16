"use client";

import { useCallback, useRef, useState } from "react";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
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
  label?: string;
};

export function MobilizeFeedAdImageDropzone({
  value,
  onChange,
  disabled = false,
  label = "Image",
}: Props) {
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
        const res = await fetch("/api/mobilize/feed-ads/image", { method: "POST", body: fd });
        const json = (await res.json()) as { image_url?: string; error?: string };
        if (!res.ok) throw new Error(json.error || "Upload failed.");
        if (!json.image_url) throw new Error("No image URL returned.");
        onChange(json.image_url);
        toast("Image uploaded.", "success");
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
      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
        {label}
      </Typography>
      <Box
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled && !uploading) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (!disabled && !uploading) onPickFiles(e.dataTransfer.files);
        }}
        onClick={openFilePicker}
        sx={{
          border: "2px dashed",
          borderColor: dragOver ? "primary.main" : "rgba(0,0,0,0.2)",
          borderRadius: 2,
          p: 2,
          textAlign: "center",
          cursor: disabled || uploading ? "default" : "pointer",
          bgcolor: dragOver ? "rgba(255, 215, 0, 0.08)" : "#fafafa",
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          hidden
          onChange={(e) => onPickFiles(e.target.files)}
        />
        {previewSrc ? (
          <Box
            component="img"
            src={previewSrc}
            alt=""
            sx={{ maxWidth: "100%", maxHeight: 160, borderRadius: 1, mb: 1, display: "block", mx: "auto" }}
          />
        ) : (
          <CloudUploadIcon sx={{ fontSize: 36, color: "text.secondary", mb: 0.5 }} />
        )}
        <Typography variant="body2" color="text.secondary">
          {uploading ? "Uploading…" : "Drag & drop an image, or click to browse"}
        </Typography>
        {uploading ? <LinearProgress sx={{ mt: 1 }} /> : null}
      </Box>
      <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap" useFlexGap>
        <Button size="small" onClick={() => setUrlOpen((v) => !v)} disabled={disabled || uploading}>
          {urlOpen ? "Hide URL" : "Paste URL"}
        </Button>
        {trimmed ? (
          <Button
            size="small"
            color="error"
            startIcon={<DeleteOutlineIcon />}
            onClick={() => onChange("")}
            disabled={disabled || uploading}
          >
            Remove
          </Button>
        ) : null}
      </Stack>
      <Collapse in={urlOpen}>
        <TextField
          size="small"
          fullWidth
          label="Image URL"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || uploading}
          sx={{ mt: 1 }}
        />
      </Collapse>
    </Box>
  );
}
