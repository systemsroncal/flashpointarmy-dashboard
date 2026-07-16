"use client";

import { GatheringDescriptionEditor } from "@/components/dashboard/gatherings/GatheringDescriptionEditor";
import { useMobilizeToast } from "@/components/mobilize/MobilizeToastProvider";
import { MAX_MOBILIZE_ANNOUNCEMENT_IMAGES } from "@/lib/mobilize/announcement-images";
import {
  TRUTH_HUB_ACCENT,
  TRUTH_HUB_BORDER,
  TRUTH_HUB_TEXT,
  TRUTH_HUB_TEXT_MUTED,
} from "@/lib/mobilize/social/social-hub-surface";
import { mobilizePanelTheme } from "@/theme/mobilize-content-theme";
import { publicAssetSrc } from "@/lib/media/public-asset-url";
import AttachFileOutlinedIcon from "@mui/icons-material/AttachFileOutlined";
import CloseIcon from "@mui/icons-material/Close";
import EmojiEmotionsOutlinedIcon from "@mui/icons-material/EmojiEmotionsOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Stack,
  Tooltip,
  ThemeProvider,
  Typography,
} from "@mui/material";
import { useCallback, useMemo, useRef, useState, type ReactElement, type ReactNode } from "react";

const TRUTH_POST_PURPLE = "#5448e8";
const TRUTH_ICON = "#7c8db5";
const MAX_CHARS = 3000;

type EditorHandle = { execCommand: (cmd: string) => void };

type Props = {
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
  surface?: "dark" | "light";
  avatarUrl?: string | null;
  avatarFallback?: string;
  imageUrls?: string[];
  onImageUrlsChange?: (urls: string[]) => void;
  /** Group wall uploads */
  groupId?: string;
  postLabel?: string;
  onPost?: () => void;
  posting?: boolean;
  canPost?: boolean;
  showVisibility?: boolean;
  children?: ReactNode;
};

function plainTextLength(html: string): number {
  return html.replace(/<[^>]+>/g, "").trim().length;
}

export function MobilizeSocialPostEditor({
  value,
  onChange,
  disabled = false,
  surface = "dark",
  avatarUrl,
  avatarFallback = "?",
  imageUrls = [],
  onImageUrlsChange,
  groupId,
  postLabel = "Post",
  onPost,
  posting = false,
  canPost,
  showVisibility = true,
  children,
}: Props): ReactElement {
  const toast = useMobilizeToast();
  const isDark = surface === "dark";
  const fileRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<EditorHandle | null>(null);
  const [uploading, setUploading] = useState(false);

  const charCount = useMemo(() => plainTextLength(value), [value]);
  const charsLeft = MAX_CHARS - charCount;
  const postEnabled = canPost ?? (Boolean(charCount) || imageUrls.length > 0);

  const uploadUrl = groupId
    ? `/api/mobilize/groups/${groupId}/messages/image`
    : "/api/mobilize/social/profile-posts/image";

  const uploadFile = useCallback(
    async (file: File): Promise<string | null> => {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch(uploadUrl, { method: "POST", body: fd });
      const json = (await res.json()) as { image_url?: string; error?: string };
      if (!res.ok) throw new Error(json.error || "Upload failed.");
      return json.image_url ?? null;
    },
    [uploadUrl]
  );

  function onPickFiles(files: FileList | null) {
    if (!files?.length || disabled || uploading || !onImageUrlsChange) return;
    const room = MAX_MOBILIZE_ANNOUNCEMENT_IMAGES - imageUrls.length;
    const batch = Array.from(files).slice(0, room);
    void (async () => {
      setUploading(true);
      let next = [...imageUrls];
      try {
        for (const file of batch) {
          if (next.length >= MAX_MOBILIZE_ANNOUNCEMENT_IMAGES) break;
          const url = await uploadFile(file);
          if (url) {
            next = [...next, url];
            onImageUrlsChange(next);
          }
        }
      } catch (e) {
        toast(e instanceof Error ? e.message : "Upload failed.", "error");
      } finally {
        setUploading(false);
      }
    })();
  }

  function removeImage(index: number) {
    onImageUrlsChange?.(imageUrls.filter((_, i) => i !== index));
  }

  const borderColor = isDark ? TRUTH_HUB_BORDER : "rgba(0,0,0,0.1)";
  const muted = isDark ? TRUTH_HUB_TEXT_MUTED : "rgba(0,0,0,0.55)";
  const textColor = isDark ? TRUTH_HUB_TEXT : "#0d0d0d";
  const postBtnBg = isDark ? TRUTH_POST_PURPLE : TRUTH_HUB_ACCENT;

  const body = (
    <Box
      sx={{
        borderBottom: `1px solid ${borderColor}`,
        px: { xs: 1.5, sm: 2 },
        py: 1.5,
        color: textColor,
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <Avatar
          src={avatarUrl ? publicAssetSrc(avatarUrl) : undefined}
          alt=""
          sx={{ width: 44, height: 44, bgcolor: "#263238", flexShrink: 0, mt: 0.25 }}
        >
          {avatarFallback.charAt(0).toUpperCase()}
        </Avatar>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            {showVisibility ? (
              <Button
                size="small"
                endIcon={<KeyboardArrowDownIcon sx={{ fontSize: "1rem !important" }} />}
                disabled={disabled || posting}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  borderRadius: 99,
                  px: 1.5,
                  py: 0.35,
                  color: textColor,
                  border: `1px solid ${borderColor}`,
                  bgcolor: isDark ? "rgba(255,255,255,0.04)" : "#fff",
                  minWidth: 0,
                  "&:hover": { bgcolor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.03)" },
                }}
              >
                Post to Public
              </Button>
            ) : (
              <Box />
            )}
          </Stack>

          <GatheringDescriptionEditor
            value={value}
            onChange={onChange}
            disabled={disabled || posting}
            label=""
            showHelper={false}
            variant="social"
            socialSurface={surface}
            onEditorInit={(ed) => {
              editorRef.current = ed;
            }}
          />

          {imageUrls.length ? (
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1.25 }}>
              {imageUrls.map((url, i) => (
                <Box
                  key={`${url}-${i}`}
                  sx={{
                    position: "relative",
                    width: 120,
                    height: 120,
                    borderRadius: 2,
                    overflow: "hidden",
                    border: `1px solid ${borderColor}`,
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
                    onClick={() => removeImage(i)}
                    disabled={disabled || posting || uploading}
                    sx={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      bgcolor: "rgba(0,0,0,0.6)",
                      color: "#fff",
                      width: 26,
                      height: 26,
                      "&:hover": { bgcolor: "rgba(0,0,0,0.8)" },
                    }}
                  >
                    <CloseIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Box>
              ))}
            </Stack>
          ) : null}

          {children}

          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 1.25 }}>
            <Stack direction="row" alignItems="center" spacing={0.25}>
              {onImageUrlsChange ? (
                <>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    multiple
                    hidden
                    onChange={(e) => {
                      onPickFiles(e.target.files);
                      e.target.value = "";
                    }}
                  />
                  <Tooltip title="Attach image">
                    <span>
                      <IconButton
                        size="small"
                        disabled={disabled || posting || uploading || imageUrls.length >= MAX_MOBILIZE_ANNOUNCEMENT_IMAGES}
                        onClick={() => fileRef.current?.click()}
                        sx={{ color: TRUTH_ICON }}
                      >
                        {uploading ? <CircularProgress size={18} /> : <AttachFileOutlinedIcon fontSize="small" />}
                      </IconButton>
                    </span>
                  </Tooltip>
                </>
              ) : null}
              <Tooltip title="Emoji">
                <span>
                  <IconButton
                    size="small"
                    disabled={disabled || posting}
                    onClick={() => editorRef.current?.execCommand("mceEmoticons")}
                    sx={{ color: TRUTH_ICON }}
                  >
                    <EmojiEmotionsOutlinedIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>

            <Stack direction="row" alignItems="center" spacing={1.25}>
              <Typography variant="caption" sx={{ color: charsLeft < 0 ? "#ff6b6b" : muted, fontWeight: 500 }}>
                {charsLeft.toLocaleString()}
              </Typography>
              {onPost ? (
                <Button
                  variant="contained"
                  disabled={posting || !postEnabled || charsLeft < 0}
                  onClick={onPost}
                  sx={{
                    borderRadius: 99,
                    textTransform: "none",
                    fontWeight: 800,
                    fontSize: "0.9rem",
                    px: 2.25,
                    py: 0.65,
                    minWidth: 72,
                    bgcolor: postBtnBg,
                    boxShadow: "none",
                    "&:hover": { bgcolor: isDark ? "#4338ca" : "#e01f45", boxShadow: "none" },
                    "&.Mui-disabled": {
                      bgcolor: isDark ? "rgba(84,72,232,0.35)" : "rgba(255,41,82,0.35)",
                      color: "rgba(255,255,255,0.5)",
                    },
                  }}
                >
                  {posting ? "…" : postLabel}
                </Button>
              ) : null}
            </Stack>
          </Stack>
        </Box>
      </Stack>
    </Box>
  );

  if (!isDark) {
    return <ThemeProvider theme={mobilizePanelTheme}>{body}</ThemeProvider>;
  }

  return body;
}
