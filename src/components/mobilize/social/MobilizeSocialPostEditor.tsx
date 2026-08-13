"use client";

import { GatheringDescriptionEditor } from "@/components/dashboard/gatherings/GatheringDescriptionEditor";
import { useMobilizeToast } from "@/components/mobilize/MobilizeToastProvider";
import { MAX_MOBILIZE_ANNOUNCEMENT_IMAGES } from "@/lib/mobilize/announcement-images";
import { DEFAULT_MOBILIZE_IMAGE_UPLOAD_LIMITS } from "@/lib/mobilize/image-upload-limits";
import {
  TRUTH_HUB_ACCENT,
  TRUTH_HUB_BORDER,
  TRUTH_HUB_TEXT,
  TRUTH_HUB_TEXT_MUTED,
} from "@/lib/mobilize/social/social-hub-surface";
import { mobilizePanelTheme } from "@/theme/mobilize-content-theme";
import { flashpointYellow } from "@/theme/tokens";
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
  FormControl,
  IconButton,
  MenuItem,
  Select,
  Stack,
  Tooltip,
  ThemeProvider,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement, type ReactNode } from "react";

const TRUTH_POST_PURPLE = "#5448e8";
const TRUTH_ICON = "#7c8db5";
const MAX_CHARS = 3000;

export type MobilizePostCommentsPolicy = "everyone" | "leaders_only";

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
  /** Use Flash Point yellow for the Post button (group feed). */
  brandAccent?: boolean;
  /** Replaces the visibility pill with a comments-policy select (group feed leaders). */
  commentsPolicy?: MobilizePostCommentsPolicy;
  onCommentsPolicyChange?: (policy: MobilizePostCommentsPolicy) => void;
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
  brandAccent = false,
  commentsPolicy,
  onCommentsPolicyChange,
  children,
}: Props): ReactElement {
  const toast = useMobilizeToast();
  const isDark = surface === "dark";
  const fileRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<EditorHandle | null>(null);
  const [uploading, setUploading] = useState(false);
  const [maxImages, setMaxImages] = useState(MAX_MOBILIZE_ANNOUNCEMENT_IMAGES);
  const visibilityLabel = "Post to public";
  const createPostLabel = "Create a post";

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/mobilize/upload-limits");
        if (!res.ok) return;
        const j = (await res.json()) as {
          groups_image_max_count?: number;
          profile_image_max_count?: number;
        };
        const next = groupId
          ? Number(j.groups_image_max_count)
          : Number(j.profile_image_max_count);
        if (!cancelled && Number.isFinite(next) && next >= 1) {
          setMaxImages(Math.min(20, Math.round(next)));
        }
      } catch {
        if (!cancelled) {
          setMaxImages(
            groupId
              ? DEFAULT_MOBILIZE_IMAGE_UPLOAD_LIMITS.groups_image_max_count
              : DEFAULT_MOBILIZE_IMAGE_UPLOAD_LIMITS.profile_image_max_count
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [groupId]);

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
    const room = maxImages - imageUrls.length;
    const batch = Array.from(files).slice(0, room);
    void (async () => {
      setUploading(true);
      let next = [...imageUrls];
      try {
        for (const file of batch) {
          if (next.length >= maxImages) break;
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
  const postBtnBg = isDark ? TRUTH_POST_PURPLE : brandAccent ? flashpointYellow : TRUTH_HUB_ACCENT;
  const postBtnColor = brandAccent && !isDark ? "#0d0d0d" : "#fff";
  const showCommentsPolicySelect = Boolean(commentsPolicy && onCommentsPolicyChange);
  const pillSelectSx = {
    minWidth: 0,
    maxWidth: "100%",
    fontSize: "0.85rem",
    fontWeight: 600,
    borderRadius: 99,
    color: brandAccent ? "#0d0d0d" : textColor,
    bgcolor: brandAccent ? "#fff" : isDark ? "rgba(255,255,255,0.04)" : "#fff",
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: brandAccent ? "rgba(0,0,0,0.12)" : borderColor,
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: brandAccent ? "rgba(0,0,0,0.22)" : borderColor,
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: brandAccent ? flashpointYellow : "primary.main",
    },
    "& .MuiSelect-select": {
      py: 0.65,
      px: 1.5,
      pr: "2rem !important",
      display: "flex",
      alignItems: "center",
    },
    "& .MuiSelect-icon": {
      color: brandAccent ? "#0d0d0d" : muted,
    },
  } as const;

  const body = (
    <Box
      sx={{
        borderBottom: isDark ? `1px solid ${borderColor}` : "none",
        px: { xs: 1.25, sm: 1.5 },
        py: 1.5,
        color: textColor,
      }}
    >
      <Stack direction="row" spacing={1.25} alignItems="flex-start">
        <Avatar
          src={avatarUrl ? publicAssetSrc(avatarUrl) : undefined}
          alt=""
          sx={{ width: 44, height: 44, bgcolor: "#263238", flexShrink: 0, mt: 0.15 }}
        >
          {avatarFallback.charAt(0).toUpperCase()}
        </Avatar>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ mb: 1 }}>
            {showCommentsPolicySelect ? (
              <FormControl size="small" sx={{ minWidth: 0, maxWidth: "100%", display: "block" }}>
                <Select
                  value={commentsPolicy}
                  onChange={(e) =>
                    onCommentsPolicyChange?.(e.target.value as MobilizePostCommentsPolicy)
                  }
                  disabled={disabled || posting}
                  displayEmpty
                  IconComponent={KeyboardArrowDownIcon}
                  sx={pillSelectSx}
                  inputProps={{ "aria-label": "Who can comment on this post" }}
                >
                  <MenuItem value="everyone">Everyone can comment</MenuItem>
                  <MenuItem value="leaders_only">Leaders only can comment</MenuItem>
                </Select>
              </FormControl>
            ) : showVisibility ? (
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
                  color: brandAccent ? "#0d0d0d" : textColor,
                  border: `1px solid ${brandAccent ? "rgba(0,0,0,0.12)" : borderColor}`,
                  bgcolor: brandAccent ? "#fff" : isDark ? "rgba(255,255,255,0.04)" : "#fff",
                  minWidth: 0,
                  "&:hover": {
                    bgcolor: brandAccent ? "#f7f7f7" : isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.03)",
                  },
                }}
              >
                {visibilityLabel}
              </Button>
            ) : (
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  borderRadius: 99,
                  border: `1px solid ${brandAccent ? "rgba(0,0,0,0.12)" : borderColor}`,
                  bgcolor: brandAccent ? "#fff" : isDark ? "rgba(255,255,255,0.04)" : "#fff",
                  px: 1.5,
                  py: 0.35,
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: brandAccent ? "#0d0d0d" : textColor,
                }}
              >
                {visibilityLabel}
              </Box>
            )}
            <Typography
              sx={{
                mt: 0.55,
                fontSize: "0.92rem",
                fontWeight: 600,
                color: isDark ? TRUTH_HUB_TEXT_MUTED : "#65676b",
                lineHeight: 1.25,
              }}
            >
              {createPostLabel}
            </Typography>
          </Box>

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
                        disabled={disabled || posting || uploading || imageUrls.length >= maxImages}
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
                {brandAccent ? `${charCount.toLocaleString()} / ${MAX_CHARS.toLocaleString()}` : charsLeft.toLocaleString()}
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
                    color: postBtnColor,
                    boxShadow: "none",
                    "&:hover": {
                      bgcolor: isDark ? "#4338ca" : brandAccent ? "#e6c200" : "#e01f45",
                      boxShadow: "none",
                    },
                    "&.Mui-disabled": {
                      bgcolor: isDark
                        ? "rgba(84,72,232,0.35)"
                        : brandAccent
                          ? "rgba(255,215,0,0.35)"
                          : "rgba(255,41,82,0.35)",
                      color: brandAccent ? "rgba(13,13,13,0.45)" : "rgba(255,255,255,0.5)",
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
