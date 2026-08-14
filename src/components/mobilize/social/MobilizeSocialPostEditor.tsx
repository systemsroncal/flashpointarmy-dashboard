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
  Divider,
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
const TRUTH_ICON = "#9aa3c7";
const MAX_CHARS = 3000;
const DESIGN_EDITOR_BORDER = "rgba(0, 108, 231, 0.28)";

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
  /** Header under the visibility / comments pill. */
  headingLabel?: string;
  onPost?: () => void;
  posting?: boolean;
  canPost?: boolean;
  showVisibility?: boolean;
  /** Group / profile feed: yellow Post button + card layout. */
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
  headingLabel = "Create a post",
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

  // TRUTH_ICON is tuned for the dark hub; on white surfaces it washes out.
  const footerIconSx = {
    color: isDark ? TRUTH_ICON : "rgba(0,0,0,0.6)",
    "&.Mui-disabled": { color: isDark ? "rgba(154,163,199,0.4)" : "rgba(0,0,0,0.26)" },
  } as const;
  const borderColor = isDark ? TRUTH_HUB_BORDER : "rgba(0,0,0,0.12)";
  const muted = isDark ? TRUTH_HUB_TEXT_MUTED : "rgba(0,0,0,0.45)";
  const textColor = isDark ? TRUTH_HUB_TEXT : "#0d0d0d";
  const useDesignAccent = brandAccent && !isDark;
  const postBtnBg = isDark ? TRUTH_POST_PURPLE : useDesignAccent ? flashpointYellow : TRUTH_HUB_ACCENT;
  const postBtnColor = useDesignAccent ? "#000" : "#fff";
  const showCommentsPolicySelect = Boolean(commentsPolicy && onCommentsPolicyChange);
  const selectRadius = useDesignAccent ? "1rem" : 99;
  const pillSelectSx = {
    minWidth: 0,
    maxWidth: "100%",
    fontSize: "0.85rem",
    fontWeight: 600,
    borderRadius: selectRadius,
    color: useDesignAccent ? "#0d0d0d" : textColor,
    bgcolor: useDesignAccent || !isDark ? "#fff" : "rgba(255,255,255,0.04)",
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: useDesignAccent ? "rgba(0,0,0,0.14)" : borderColor,
      borderRadius: selectRadius,
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: useDesignAccent ? "rgba(0,0,0,0.28)" : borderColor,
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: useDesignAccent ? flashpointYellow : "primary.main",
    },
    "& .MuiSelect-select": {
      py: 0.65,
      px: 1.5,
      pr: "2rem !important",
      display: "flex",
      alignItems: "center",
    },
    "& .MuiSelect-icon": {
      color: useDesignAccent ? "#0d0d0d" : muted,
    },
  } as const;

  const policyControl = showCommentsPolicySelect ? (
    <FormControl size="small" sx={{ minWidth: 0, maxWidth: "100%", display: "block" }}>
      <Select
        value={commentsPolicy}
        onChange={(e) => onCommentsPolicyChange?.(e.target.value as MobilizePostCommentsPolicy)}
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
        borderRadius: selectRadius,
        px: 1.5,
        py: 0.35,
        color: useDesignAccent ? "#0d0d0d" : textColor,
        border: `1px solid ${useDesignAccent ? "rgba(0,0,0,0.14)" : borderColor}`,
        bgcolor: useDesignAccent || !isDark ? "#fff" : "rgba(255,255,255,0.04)",
        minWidth: 0,
        "&:hover": {
          bgcolor: useDesignAccent
            ? "#f7f7f7"
            : isDark
              ? "rgba(255,255,255,0.08)"
              : "rgba(0,0,0,0.03)",
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
        borderRadius: selectRadius,
        border: `1px solid ${useDesignAccent ? "rgba(0,0,0,0.14)" : borderColor}`,
        bgcolor: useDesignAccent || !isDark ? "#fff" : "rgba(255,255,255,0.04)",
        px: 1.5,
        py: 0.35,
        fontSize: "0.85rem",
        fontWeight: 600,
        color: useDesignAccent ? "#0d0d0d" : textColor,
      }}
    >
      {visibilityLabel}
    </Box>
  );

  const heading = (
    <Typography
      sx={{
        mt: 0.65,
        fontSize: "0.95rem",
        fontWeight: 700,
        color: isDark ? TRUTH_HUB_TEXT_MUTED : "#65676b",
        lineHeight: 1.25,
      }}
    >
      {headingLabel}
    </Typography>
  );

  const editorBlock = (
    <Box
      sx={
        useDesignAccent
          ? {
              "& > .MuiBox-root": {
                borderColor: `${DESIGN_EDITOR_BORDER} !important`,
                borderRadius: "12px !important",
                borderWidth: "1.5px !important",
              },
            }
          : undefined
      }
    >
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
    </Box>
  );

  const imageThumbs =
    imageUrls.length > 0 ? (
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
    ) : null;

  const footer = (
    <>
      <Divider sx={{ mt: 1.5, mb: 1.25, borderColor: isDark ? borderColor : "rgba(0,0,0,0.08)" }} />
      <Stack direction="row" alignItems="center" justifyContent="space-between">
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
                    sx={footerIconSx}
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
                sx={footerIconSx}
              >
                <EmojiEmotionsOutlinedIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>

        <Stack direction="row" alignItems="center" spacing={1.25}>
          <Typography variant="caption" sx={{ color: charsLeft < 0 ? "#ff6b6b" : muted, fontWeight: 500 }}>
            {useDesignAccent
              ? `${charCount.toLocaleString()} / ${MAX_CHARS.toLocaleString()}`
              : charsLeft.toLocaleString()}
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
                px: 2.5,
                py: 0.7,
                minWidth: 72,
                bgcolor: postBtnBg,
                color: postBtnColor,
                boxShadow: "none",
                "&:hover": {
                  bgcolor: isDark ? "#4338ca" : useDesignAccent ? "#e6c200" : "#e01f45",
                  boxShadow: "none",
                },
                "&.Mui-disabled": {
                  bgcolor: postBtnBg,
                  color: postBtnColor,
                  opacity: 0.6,
                },
              }}
            >
              {posting ? "…" : postLabel}
            </Button>
          ) : null}
        </Stack>
      </Stack>
    </>
  );

  /** Group / profile: Avatar + title row, then full-width editor + footer. */
  const designBody = (
    <Box
      sx={{
        px: { xs: 1.5, sm: 2 },
        py: { xs: 1.5, sm: 2 },
        color: textColor,
      }}
    >
      <Stack spacing={0}>
        <Box
          sx={{
            display: "flex",
            gap: "10px",
            alignItems: "flex-start",
            mb: 1.25,
          }}
        >
          <Avatar
            src={avatarUrl ? publicAssetSrc(avatarUrl) : undefined}
            alt=""
            sx={{ width: 48, height: 48, bgcolor: "#263238", flexShrink: 0, mt: 0.15 }}
          >
            {avatarFallback.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {policyControl}
            {heading}
          </Box>
        </Box>

        {editorBlock}
        {imageThumbs}
        {children}
        {footer}
      </Stack>
    </Box>
  );

  const legacyBody = (
    <Box
      sx={{
        borderBottom: isDark ? `1px solid ${borderColor}` : "none",
        px: { xs: 1.5, sm: 2 },
        py: { xs: 1.5, sm: 2 },
        color: textColor,
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <Avatar
          src={avatarUrl ? publicAssetSrc(avatarUrl) : undefined}
          alt=""
          sx={{ width: 48, height: 48, bgcolor: "#263238", flexShrink: 0, mt: 0.15 }}
        >
          {avatarFallback.charAt(0).toUpperCase()}
        </Avatar>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ mb: 1.25 }}>
            {policyControl}
            {heading}
          </Box>
          {editorBlock}
          {imageThumbs}
          {children}
          {footer}
        </Box>
      </Stack>
    </Box>
  );

  const body = useDesignAccent ? designBody : legacyBody;

  if (!isDark) {
    return <ThemeProvider theme={mobilizePanelTheme}>{body}</ThemeProvider>;
  }

  return body;
}
