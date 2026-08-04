"use client";

import Cropper, { type Area } from "react-easy-crop";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Slider,
  Stack,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  COVER_ASPECT,
  COVER_MAX_WIDTH,
  PROFILE_ASPECT,
  PROFILE_OUTPUT_SIZE,
  compressImageFile,
  cropImageToFile,
  normalizeImageWidth,
  type CropAreaPixels,
} from "@/lib/media/optimize-image-client";

export type ImageCropKind = "profile" | "cover";

type Props = {
  open: boolean;
  file: File | null;
  kind: ImageCropKind;
  /** Server-enforced max upload size (bytes). */
  maxBytes: number;
  onCancel: () => void;
  onConfirm: (file: File) => void;
};

export function ImageCropDialog({ open, file, kind, maxBytes, onCancel, onConfirm }: Props) {
  const [src, setSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropAreaPixels | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prepNote, setPrepNote] = useState<string | null>(null);

  const aspect = kind === "profile" ? PROFILE_ASPECT : COVER_ASPECT;
  const title = kind === "profile" ? "Crop profile photo" : "Crop cover photo";

  useEffect(() => {
    let revoked: string | null = null;
    let cancelled = false;
    async function prep() {
      setError(null);
      setPrepNote(null);
      setZoom(1);
      setCrop({ x: 0, y: 0 });
      setCroppedAreaPixels(null);
      if (!file || !open) {
        setSrc(null);
        return;
      }
      try {
        setBusy(true);
        let working = file;
        if (kind === "cover") {
          const n = await normalizeImageWidth(file, COVER_MAX_WIDTH);
          working = n.file;
          if (n.file !== file) {
            setPrepNote(`Image width normalized to ${COVER_MAX_WIDTH}px.`);
          } else if (n.width < COVER_MAX_WIDTH) {
            setPrepNote(`Cover is ${n.width}px wide — crop to 21:9 (no upscale).`);
          }
        }
        const url = URL.createObjectURL(working);
        revoked = url;
        if (!cancelled) setSrc(url);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not prepare image.");
      } finally {
        if (!cancelled) setBusy(false);
      }
    }
    void prep();
    return () => {
      cancelled = true;
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [file, open, kind]);

  const onCropComplete = useCallback((_area: Area, pixels: Area) => {
    setCroppedAreaPixels({
      x: pixels.x,
      y: pixels.y,
      width: pixels.width,
      height: pixels.height,
    });
  }, []);

  const maxMbLabel = useMemo(() => {
    const mb = maxBytes / (1024 * 1024);
    const rounded = Math.round(mb * 100) / 100;
    return Number.isInteger(rounded) ? String(rounded) : String(rounded);
  }, [maxBytes]);

  async function confirm() {
    if (!src || !croppedAreaPixels) return;
    setBusy(true);
    setError(null);
    try {
      const cropped = await cropImageToFile(src, croppedAreaPixels, {
        outputWidth: kind === "profile" ? PROFILE_OUTPUT_SIZE : undefined,
        outputHeight: kind === "profile" ? PROFILE_OUTPUT_SIZE : undefined,
        mime: "image/jpeg",
        quality: 0.9,
        fileName: kind === "profile" ? "profile.jpg" : "cover.jpg",
      });
      const compressed = await compressImageFile(cropped, maxBytes, {
        maxWidth: kind === "profile" ? PROFILE_OUTPUT_SIZE : COVER_MAX_WIDTH,
        minQuality: 0.55,
      });
      if (compressed.size > maxBytes) {
        throw new Error(`Image must be ${maxMbLabel} MB or smaller after optimization.`);
      }
      onConfirm(compressed);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Crop failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onClose={busy ? undefined : onCancel} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {kind === "profile"
            ? "Square crop · optimized for profile display (~800×800)."
            : "21:9 crop · covers wider than 1920px are scaled down first."}{" "}
          Max upload: {maxMbLabel} MB.
        </Typography>
        {prepNote ? (
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
            {prepNote}
          </Typography>
        ) : null}
        {error ? (
          <Typography variant="body2" color="error" sx={{ mb: 1 }}>
            {error}
          </Typography>
        ) : null}
        <Box
          sx={{
            position: "relative",
            width: "100%",
            height: { xs: 280, sm: 360 },
            bgcolor: "#111",
            borderRadius: 1,
            overflow: "hidden",
          }}
        >
          {src ? (
            <Cropper
              image={src}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              objectFit="contain"
              showGrid
            />
          ) : null}
        </Box>
        <Stack spacing={1} sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Zoom
          </Typography>
          <Slider
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(_, v) => setZoom(Number(v))}
            disabled={!src || busy}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button variant="contained" onClick={() => void confirm()} disabled={!src || !croppedAreaPixels || busy}>
          {busy ? "Working…" : "Apply & upload"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
