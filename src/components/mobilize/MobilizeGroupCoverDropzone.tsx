"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ImageIcon from "@mui/icons-material/Image";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import {
  Box,
  Button,
  Collapse,
  Dialog,
  DialogContent,
  IconButton,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { publicAssetSrc } from "@/lib/media/public-asset-url";
import { useMobilizeToast } from "@/components/mobilize/MobilizeToastProvider";
import { ImageCropDialog } from "@/components/media/ImageCropDialog";
import {
  DEFAULT_MOBILIZE_IMAGE_UPLOAD_LIMITS,
  mbToBytes,
} from "@/lib/mobilize/image-upload-limits";

type Props = {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  variant?: "cover" | "profile";
  /**
   * Which Mobilize settings bucket to use for max MB.
   * Group cover/profile → groups; user avatar/cover → profile.
   */
  limitsSource?: "groups" | "profile";
};

export default function MobilizeGroupCoverDropzone({
  value,
  onChange,
  disabled = false,
  variant = "cover",
  limitsSource = "groups",
}: Props) {
  const isProfile = variant === "profile";
  const uploadEndpoint = isProfile
    ? "/api/mobilize/groups/profile-image"
    : "/api/mobilize/groups/cover-image";
  const toast = useMobilizeToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [urlOpen, setUrlOpen] = useState(false);
  const [maxMb, setMaxMb] = useState(
    limitsSource === "profile"
      ? DEFAULT_MOBILIZE_IMAGE_UPLOAD_LIMITS.profile_image_max_mb
      : DEFAULT_MOBILIZE_IMAGE_UPLOAD_LIMITS.groups_image_max_mb
  );
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/mobilize/upload-limits");
        if (!res.ok) return;
        const j = (await res.json()) as {
          groups_image_max_mb?: number;
          profile_image_max_mb?: number;
        };
        const mb =
          limitsSource === "profile"
            ? Number(j.profile_image_max_mb)
            : Number(j.groups_image_max_mb);
        if (!cancelled && Number.isFinite(mb) && mb > 0) setMaxMb(mb);
      } catch {
        /* keep default */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [limitsSource]);

  const trimmed = value.trim();
  const previewSrc = trimmed ? publicAssetSrc(trimmed) : "";
  const maxBytes = mbToBytes(maxMb);

  const uploadFile = useCallback(
    async (file: File) => {
      setUploading(true);
      try {
        const fd = new FormData();
        fd.set("file", file);
        const res = await fetch(uploadEndpoint, { method: "POST", body: fd });
        const json = (await res.json()) as {
          cover_image_url?: string;
          profile_image_url?: string;
          error?: string;
        };
        if (!res.ok) throw new Error(json.error || "Upload failed.");
        const url = isProfile ? json.profile_image_url : json.cover_image_url;
        if (!url) throw new Error("No image URL returned.");
        onChange(url);
        toast(isProfile ? "Profile image uploaded." : "Cover image uploaded.", "success");
      } catch (e) {
        toast(e instanceof Error ? e.message : "Upload failed.", "error");
      } finally {
        setUploading(false);
      }
    },
    [isProfile, onChange, toast, uploadEndpoint]
  );

  function onPickFiles(files: FileList | null) {
    const f = files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast("Only image files are allowed.", "error");
      return;
    }
    setCropFile(f);
  }

  function openFilePicker() {
    if (!disabled && !uploading) inputRef.current?.click();
  }

  return (
    <Box>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.75 }}>
        {isProfile ? "Profile image" : "Cover image"}
      </Typography>

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
          borderColor: dragOver ? "primary.main" : "rgba(202, 154, 0, 0.45)",
          bgcolor: dragOver ? "rgba(255, 215, 0, 0.12)" : "#fafafa",
          textAlign: "center",
          cursor: disabled || uploading ? "default" : "pointer",
          mb: 1,
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <CloudUploadIcon sx={{ fontSize: 36, color: "text.secondary", mb: 0.5 }} />
        <Typography variant="body2" fontWeight={600}>
          {previewSrc
            ? isProfile
              ? "Drop a new profile photo or click to replace"
              : "Drop a new image here or click to replace"
            : isProfile
              ? "Drop a profile photo or click to upload"
              : "Drop an image here or click to upload"}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
          JPEG, PNG, WebP, or GIF · max {maxMb} MB · crop & compress before upload
        </Typography>
      </Box>

      {previewSrc ? (
        <Box
          sx={{
            mt: 1,
            p: 1.5,
            borderRadius: 1,
            border: "1px solid rgba(0,0,0,0.1)",
            bgcolor: "#ffffff",
          }}
        >
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
            {isProfile ? "Assigned profile preview" : "Assigned cover preview"}
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "flex-start" }}>
            <Box sx={{ position: "relative" }}>
              <Box
                component="img"
                src={previewSrc}
                alt=""
                onClick={() => setPreviewOpen(true)}
                sx={{
                  width: isProfile ? 96 : "100%",
                  height: isProfile ? 96 : "auto",
                  maxWidth: isProfile ? 96 : 220,
                  maxHeight: isProfile ? 96 : 140,
                  aspectRatio: isProfile ? "1 / 1" : "21 / 9",
                  objectFit: "cover",
                  borderRadius: isProfile ? "50%" : 1,
                  display: "block",
                  bgcolor: "rgba(0,0,0,0.35)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  cursor: "zoom-in",
                }}
              />
              <IconButton
                size="small"
                aria-label="Preview"
                onClick={() => setPreviewOpen(true)}
                sx={{
                  position: "absolute",
                  right: 4,
                  bottom: 4,
                  bgcolor: "rgba(0,0,0,0.55)",
                  color: "#fff",
                  "&:hover": { bgcolor: "rgba(0,0,0,0.75)" },
                }}
              >
                <ZoomInIcon fontSize="small" />
              </IconButton>
            </Box>
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

      <ImageCropDialog
        open={Boolean(cropFile)}
        file={cropFile}
        kind={isProfile ? "profile" : "cover"}
        maxBytes={maxBytes}
        onCancel={() => setCropFile(null)}
        onConfirm={(optimized) => {
          setCropFile(null);
          void uploadFile(optimized);
        }}
      />

      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth>
        <DialogContent sx={{ p: 1.5, bgcolor: "#111" }}>
          {previewSrc ? (
            <Box
              component="img"
              src={previewSrc}
              alt=""
              sx={{
                width: "100%",
                maxHeight: "80vh",
                objectFit: "contain",
                display: "block",
                borderRadius: 1,
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
