"use client";

import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import { Box, CircularProgress, IconButton, Paper, TextField, Tooltip, Typography } from "@mui/material";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

async function uploadToGatheringsBucket(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/gatherings/featured-image", {
    method: "POST",
    body: fd,
  });
  const data = (await res.json()) as { error?: string; image_url?: string };
  if (!res.ok || !data.image_url) {
    throw new Error(data.error || "Upload failed.");
  }
  return data.image_url;
}

const accept = { "image/jpeg": [], "image/png": [], "image/webp": [], "image/gif": [] };

export function GatheringImageFields({
  featuredImageUrl,
  setFeaturedImageUrl,
  galleryImageUrls,
  setGalleryImageUrls,
  onError,
  onBusyChange,
  disabled,
}: {
  featuredImageUrl: string;
  setFeaturedImageUrl: (v: string) => void;
  galleryImageUrls: string[];
  setGalleryImageUrls: (v: string[]) => void;
  onError: (msg: string | null) => void;
  onBusyChange?: (busy: boolean) => void;
  disabled: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const hasFeatured = Boolean(featuredImageUrl.trim());

  const setBusyTracked = useCallback(
    (v: boolean) => {
      setBusy(v);
      onBusyChange?.(v);
    },
    [onBusyChange]
  );

  const onFeaturedDrop = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (!file || disabled) return;
      setBusyTracked(true);
      onError(null);
      try {
        const url = await uploadToGatheringsBucket(file);
        setFeaturedImageUrl(url);
      } catch (e) {
        onError(e instanceof Error ? e.message : "Could not upload featured image.");
      } finally {
        setBusyTracked(false);
      }
    },
    [disabled, onError, setBusyTracked, setFeaturedImageUrl]
  );

  const featuredDropzone = useDropzone({
    onDrop: (accepted) => void onFeaturedDrop(accepted),
    accept,
    maxFiles: 1,
    multiple: false,
    disabled: disabled || busy,
    noClick: hasFeatured,
    noKeyboard: hasFeatured,
  });

  const onGalleryDrop = useCallback(
    async (files: File[]) => {
      if (!files.length || disabled) return;
      setBusyTracked(true);
      onError(null);
      const next: string[] = [];
      try {
        for (const file of files) {
          const url = await uploadToGatheringsBucket(file);
          next.push(url);
        }
        if (next.length) setGalleryImageUrls([...galleryImageUrls, ...next]);
      } catch (e) {
        onError(e instanceof Error ? e.message : "Could not upload gallery image(s).");
      } finally {
        setBusyTracked(false);
      }
    },
    [disabled, galleryImageUrls, onError, setBusyTracked, setGalleryImageUrls]
  );

  const galleryDropzone = useDropzone({
    onDrop: (accepted) => void onGalleryDrop(accepted),
    accept,
    disabled: disabled || busy,
    multiple: true,
  });

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(255,215,0,0.2)", bgcolor: "rgba(0,0,0,0.25)" }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: "primary.main" }}>
          Featured image
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
          Main image for listings and the event header. Shown in full (not cropped) on the public page.
        </Typography>

        <TextField
          label="Featured image URL (optional)"
          fullWidth
          size="small"
          value={featuredImageUrl}
          onChange={(e) => setFeaturedImageUrl(e.target.value)}
          sx={{ mb: 2 }}
          helperText="Paste a public URL, or upload a file below."
          disabled={disabled || busy}
        />

        {!hasFeatured ? (
          <Box
            {...featuredDropzone.getRootProps()}
            sx={{
              border: "2px dashed",
              borderColor: featuredDropzone.isDragActive ? "primary.main" : "rgba(255,215,0,0.28)",
              borderRadius: 1,
              p: 3,
              textAlign: "center",
              cursor: disabled || busy ? "not-allowed" : "pointer",
              opacity: disabled || busy ? 0.55 : 1,
              bgcolor: "rgba(0,0,0,0.2)",
            }}
          >
            <input {...featuredDropzone.getInputProps()} />
            {busy ? (
              <CircularProgress size={28} />
            ) : (
              <>
                <CloudUploadIcon sx={{ fontSize: 40, color: "primary.main", mb: 1 }} />
                <Typography variant="body2">Drag and drop an image here, or click to choose a file.</Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                  JPEG, PNG, WebP, or GIF · up to 1 MB
                </Typography>
              </>
            )}
          </Box>
        ) : (
          <Box {...featuredDropzone.getRootProps()} sx={{ position: "relative" }}>
            <input {...featuredDropzone.getInputProps()} />
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 220,
                maxHeight: 420,
                borderRadius: 1,
                bgcolor: "rgba(0,0,0,0.35)",
                border: featuredDropzone.isDragActive ? "2px dashed" : "1px solid",
                borderColor: featuredDropzone.isDragActive ? "primary.main" : "rgba(255,215,0,0.15)",
                overflow: "hidden",
                p: 1,
              }}
            >
              <Box
                component="img"
                src={featuredImageUrl}
                alt="Featured"
                sx={{
                  maxWidth: "100%",
                  maxHeight: 400,
                  width: "auto",
                  height: "auto",
                  objectFit: "contain",
                }}
              />
            </Box>
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5, mt: 1 }}>
              <Tooltip title="Remove featured image">
                <span>
                  <IconButton
                    size="small"
                    color="error"
                    disabled={disabled || busy}
                    onClick={() => setFeaturedImageUrl("")}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Replace featured image">
                <span>
                  <IconButton
                    size="small"
                    color="primary"
                    disabled={disabled || busy}
                    onClick={() => featuredDropzone.open()}
                  >
                    <PhotoCameraIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
              Drag a new image onto the preview to replace, or use the camera button.
            </Typography>
          </Box>
        )}
      </Paper>

      <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(255,215,0,0.2)", bgcolor: "rgba(0,0,0,0.25)" }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: "primary.main" }}>
          Gallery images
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
          Additional photos shown in the carousel with the featured image.
        </Typography>

        <Box
          {...galleryDropzone.getRootProps()}
          sx={{
            border: "2px dashed",
            borderColor: galleryDropzone.isDragActive ? "primary.main" : "rgba(255,215,0,0.28)",
            borderRadius: 1,
            p: 2,
            textAlign: "center",
            cursor: disabled || busy ? "not-allowed" : "pointer",
            opacity: disabled || busy ? 0.55 : 1,
            bgcolor: "rgba(0,0,0,0.2)",
            mb: 2,
          }}
        >
          <input {...galleryDropzone.getInputProps()} />
          {busy ? (
            <CircularProgress size={24} />
          ) : (
            <>
              <CloudUploadIcon sx={{ fontSize: 32, color: "primary.main", mb: 0.5 }} />
              <Typography variant="body2">Drop images here or click to add to gallery.</Typography>
            </>
          )}
        </Box>

        {galleryImageUrls.length > 0 ? (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
              gap: 1,
            }}
          >
            {galleryImageUrls.map((url, idx) => (
              <Box
                key={`${url}-${idx}`}
                sx={{
                  position: "relative",
                  borderRadius: 1,
                  overflow: "hidden",
                  bgcolor: "rgba(0,0,0,0.35)",
                  border: "1px solid rgba(255,215,0,0.12)",
                }}
              >
                <Box
                  component="img"
                  src={url}
                  alt=""
                  sx={{
                    width: "100%",
                    height: 100,
                    objectFit: "contain",
                    display: "block",
                  }}
                />
                <Tooltip title="Remove from gallery">
                  <IconButton
                    size="small"
                    color="error"
                    sx={{ position: "absolute", top: 2, right: 2, bgcolor: "rgba(0,0,0,0.45)" }}
                    disabled={disabled || busy}
                    onClick={() => setGalleryImageUrls(galleryImageUrls.filter((_, i) => i !== idx))}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            ))}
          </Box>
        ) : (
          <Typography variant="caption" color="text.secondary">
            No gallery images yet.
          </Typography>
        )}
      </Paper>
    </Box>
  );
}
