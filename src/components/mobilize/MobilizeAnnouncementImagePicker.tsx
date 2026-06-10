"use client";

import { useCallback, useRef, useState } from "react";
import AddPhotoAlternateOutlinedIcon from "@mui/icons-material/AddPhotoAlternateOutlined";
import CloseIcon from "@mui/icons-material/Close";
import {
  Box,
  CircularProgress,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { MAX_MOBILIZE_ANNOUNCEMENT_IMAGES } from "@/lib/mobilize/announcement-images";
import { publicAssetSrc } from "@/lib/media/public-asset-url";
import { useMobilizeToast } from "@/components/mobilize/MobilizeToastProvider";

type Props = {
  groupId: string;
  value: string[];
  onChange: (urls: string[]) => void;
  disabled?: boolean;
};

export default function MobilizeAnnouncementImagePicker({
  groupId,
  value,
  onChange,
  disabled = false,
}: Props) {
  const toast = useMobilizeToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const canAddMore = value.length < MAX_MOBILIZE_ANNOUNCEMENT_IMAGES;

  const uploadFile = useCallback(
    async (file: File): Promise<string | null> => {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch(`/api/mobilize/groups/${groupId}/messages/image`, {
        method: "POST",
        body: fd,
      });
      const json = (await res.json()) as { image_url?: string; error?: string };
      if (!res.ok) throw new Error(json.error || "Upload failed.");
      if (!json.image_url) throw new Error("No image URL returned.");
      return json.image_url;
    },
    [groupId]
  );

  function onPickFiles(files: FileList | null) {
    if (!files?.length || disabled || uploading) return;
    const room = MAX_MOBILIZE_ANNOUNCEMENT_IMAGES - value.length;
    const batch = Array.from(files).slice(0, room);
    void (async () => {
      setUploading(true);
      let next = [...value];
      try {
        for (const file of batch) {
          if (next.length >= MAX_MOBILIZE_ANNOUNCEMENT_IMAGES) break;
          const url = await uploadFile(file);
          if (url) {
            next = [...next, url];
            onChange(next);
          }
        }
      } catch (e) {
        toast(e instanceof Error ? e.message : "Upload failed.", "error");
      } finally {
        setUploading(false);
      }
    })();
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <Box sx={{ mt: 1 }}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        hidden
        onChange={(e) => {
          onPickFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
        {value.map((url, i) => (
          <Box
            key={`${url}-${i}`}
            sx={{
              position: "relative",
              width: 88,
              height: 88,
              borderRadius: 1,
              overflow: "hidden",
              border: "1px solid rgba(0,0,0,0.12)",
              bgcolor: "#f3f4f6",
              flexShrink: 0,
            }}
          >
            <Box
              component="img"
              src={publicAssetSrc(url)}
              alt=""
              sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
            <IconButton
              size="small"
              aria-label="Remove image"
              onClick={() => removeAt(i)}
              disabled={disabled || uploading}
              sx={{
                position: "absolute",
                top: 2,
                right: 2,
                bgcolor: "rgba(0,0,0,0.55)",
                color: "#fff",
                "&:hover": { bgcolor: "rgba(0,0,0,0.75)" },
                width: 24,
                height: 24,
              }}
            >
              <CloseIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Box>
        ))}
        {canAddMore ? (
          <Tooltip title="Add photos (JPEG, PNG, WebP, GIF · max 1 MB each)">
            <Box
              component="button"
              type="button"
              onClick={() => !disabled && !uploading && inputRef.current?.click()}
              disabled={disabled || uploading}
              sx={{
                width: 88,
                height: 88,
                borderRadius: 1,
                border: "2px dashed rgba(202, 154, 0, 0.45)",
                bgcolor: "#fafafa",
                display: "inline-flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 0.25,
                cursor: disabled || uploading ? "default" : "pointer",
                color: "text.secondary",
                opacity: disabled ? 0.5 : 1,
              }}
            >
              {uploading ? (
                <CircularProgress size={22} />
              ) : (
                <>
                  <AddPhotoAlternateOutlinedIcon fontSize="small" />
                  <Typography variant="caption" sx={{ lineHeight: 1.1, px: 0.5 }}>
                    Photo
                  </Typography>
                </>
              )}
            </Box>
          </Tooltip>
        ) : null}
      </Stack>
      {value.length ? (
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.75 }}>
          {value.length}/{MAX_MOBILIZE_ANNOUNCEMENT_IMAGES} photos attached
        </Typography>
      ) : null}
    </Box>
  );
}
