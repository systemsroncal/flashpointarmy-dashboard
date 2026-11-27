"use client";

import { GatheringDescriptionEditor } from "@/components/dashboard/gatherings/GatheringDescriptionEditor";
import { MobilizeDialog } from "@/components/mobilize/MobilizeDialog";
import { useMobilizeToast } from "@/components/mobilize/MobilizeToastProvider";
import { VideoEmbedDialog } from "@/components/mobilize/social/VideoEmbedDialog";
import { MobilizeLinkPreviewComposerCard } from "@/components/mobilize/social/MobilizeLinkPreviewComposerCard";
import {
  appendLinkPreviewHtml,
  contentHasLinkPreview,
  extractFirstHttpUrlFromComposerHtml,
  type LinkPreviewMeta,
} from "@/lib/mobilize/social/link-preview";
import {
  MOBILIZE_FEED_POST_MAX_CHARS,
  trimTrailingFeedHtml,
} from "@/lib/mobilize/social/sanitize-feed-html";
import {
  PROFILE_POST_TARGET,
  COMPOSER_PROFILE_POST_LABEL,
  composerPostTargetLabel,
  composerPostTargetSelectValue,
  parseComposerPostTargetSelectValue,
  sortComposerGroupOptions,
  type ComposerGroupOption,
  type ComposerPostTarget,
} from "@/lib/mobilize/social/composer-post-target";
import { mobilizeLightScrollbarSx } from "@/lib/ui/scrollbar-sx";
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
import { optimizeContentImage } from "@/lib/media/optimize-image-client";
import { publicAssetSrc } from "@/lib/media/public-asset-url";
import AttachFileOutlinedIcon from "@mui/icons-material/AttachFileOutlined";
import CloseIcon from "@mui/icons-material/Close";
import EmojiEmotionsOutlinedIcon from "@mui/icons-material/EmojiEmotionsOutlined";
import VideocamOutlinedIcon from "@mui/icons-material/VideocamOutlined";
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
const MAX_CHARS = MOBILIZE_FEED_POST_MAX_CHARS;
const DESIGN_EDITOR_BORDER = "rgba(0, 108, 231, 0.28)";

export type MobilizePostCommentsPolicy = "everyone" | "leaders_only";

type EditorHandle = {
  execCommand: (cmd: string) => void;
  insertContent: (html: string) => void;
  focus?: (skipFocus?: boolean) => void;
  selection?: {
    getBookmark?: (type?: number, normalized?: boolean) => unknown;
    moveToBookmark?: (bookmark: unknown) => void;
  };
};

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
  onPost?: (preparedHtml: string, meta?: { postTarget: ComposerPostTarget }) => void | Promise<void>;
  posting?: boolean;
  canPost?: boolean;
  showVisibility?: boolean;
  /** Feed / profile: pick profile vs joined groups (featured first). */
  postTargetPicker?: boolean;
  postTarget?: ComposerPostTarget;
  onPostTargetChange?: (target: ComposerPostTarget) => void;
  /** Group / profile feed: yellow Post button + card layout. */
  brandAccent?: boolean;
  /**
   * Feed, profile, and group create-post: compact avatar + single-line field.
   * The full composer opens in a dialog. Edit flows stay inline.
   */
  launcher?: boolean;
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
  postTargetPicker = false,
  postTarget = PROFILE_POST_TARGET,
  onPostTargetChange,
  brandAccent = false,
  launcher = false,
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
  const [composerOpen, setComposerOpen] = useState(false);
  const launchIntentRef = useRef<"compose" | "emoji" | "video" | "image" | null>(null);
  const wasPostingRef = useRef(false);
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [videoDialogUrl, setVideoDialogUrl] = useState("");
  const videoBookmarkRef = useRef<unknown>(null);
  const [linkPreview, setLinkPreview] = useState<LinkPreviewMeta | null>(null);
  const [linkPreviewLoading, setLinkPreviewLoading] = useState(false);
  const [linkPreviewError, setLinkPreviewError] = useState<string | null>(null);
  const linkPreviewFetchRef = useRef(0);
  const linkPreviewTrackedUrlRef = useRef<string | null>(null);
  const [joinedGroups, setJoinedGroups] = useState<ComposerGroupOption[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const resolvedTarget = postTarget ?? PROFILE_POST_TARGET;
  const visibilityLabel = composerPostTargetLabel(resolvedTarget);
  const activeGroupId = groupId ?? (resolvedTarget.type === "group" ? resolvedTarget.groupId : undefined);

  useEffect(() => {
    if (!postTargetPicker) return;
    let cancelled = false;
    setGroupsLoading(true);
    void (async () => {
      try {
        const res = await fetch("/api/mobilize/my-groups");
        const json = (await res.json()) as {
          groups?: { id: string; name: string; is_featured?: boolean; my_membership_status?: string | null }[];
        };
        if (!res.ok) throw new Error();
        const approved = (json.groups ?? []).filter(
          (g) => (g.my_membership_status ?? "approved") === "approved"
        );
        const sorted = sortComposerGroupOptions(
          approved.map((g) => ({
            id: String(g.id),
            name: String(g.name ?? "Group"),
            is_featured: Boolean(g.is_featured),
          }))
        );
        if (!cancelled) setJoinedGroups(sorted);
      } catch {
        if (!cancelled) setJoinedGroups([]);
      } finally {
        if (!cancelled) setGroupsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [postTargetPicker]);

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
        const next = activeGroupId
          ? Number(j.groups_image_max_count)
          : Number(j.profile_image_max_count);
        if (!cancelled && Number.isFinite(next) && next >= 1) {
          setMaxImages(Math.min(20, Math.round(next)));
        }
      } catch {
        if (!cancelled) {
          setMaxImages(
            activeGroupId
              ? DEFAULT_MOBILIZE_IMAGE_UPLOAD_LIMITS.groups_image_max_count
              : DEFAULT_MOBILIZE_IMAGE_UPLOAD_LIMITS.profile_image_max_count
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeGroupId]);

  const charCount = useMemo(() => plainTextLength(value), [value]);
  const charsLeft = MAX_CHARS - charCount;
  const postEnabled = canPost ?? (Boolean(charCount) || imageUrls.length > 0);

  const uploadUrl = activeGroupId
    ? `/api/mobilize/groups/${activeGroupId}/messages/image`
    : "/api/mobilize/social/profile-posts/image";

  const uploadFile = useCallback(
    async (file: File): Promise<string | null> => {
      const prepared = await optimizeContentImage(file);
      const fd = new FormData();
      fd.set("file", prepared);
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

  /** The dialog steals focus, so remember where the caret (or selected poster) was. */
  function rememberEditorSelection() {
    try {
      videoBookmarkRef.current = editorRef.current?.selection?.getBookmark?.(2, true) ?? null;
    } catch {
      videoBookmarkRef.current = null;
    }
  }

  function restoreEditorSelection() {
    const ed = editorRef.current;
    if (!ed) return;
    try {
      ed.focus?.(false);
      if (videoBookmarkRef.current) ed.selection?.moveToBookmark?.(videoBookmarkRef.current);
    } catch {
      /* selection restore is best-effort */
    }
  }

  function openVideoDialog() {
    if (disabled || posting) return;
    rememberEditorSelection();
    setVideoDialogUrl("");
    setVideoDialogOpen(true);
  }

  /** Clicking a poster selects it in TinyMCE, so inserting/deleting replaces that block. */
  const handleVideoBlockClick = useCallback(
    (url: string) => {
      if (disabled || posting) return;
      rememberEditorSelection();
      setVideoDialogUrl(url);
      setVideoDialogOpen(true);
    },
    [disabled, posting]
  );

  function applyVideoUrl(url: string) {
    const safe = url.trim().replace(/\]/g, "%5D");
    const ed = editorRef.current;
    const replacing = Boolean(videoDialogUrl);
    if (ed?.insertContent) {
      restoreEditorSelection();
      ed.insertContent(
        replacing
          ? `<p>[fpa_video]${safe}[/fpa_video]</p>`
          : `<p>[fpa_video]${safe}[/fpa_video]</p><p><br></p>`
      );
    } else {
      onChange(`${value}<p>[fpa_video]${safe}[/fpa_video]</p>`);
    }
    setVideoDialogOpen(false);
  }

  const fetchLinkPreview = useCallback(async (url: string) => {
    const token = ++linkPreviewFetchRef.current;
    linkPreviewTrackedUrlRef.current = url;
    setLinkPreviewLoading(true);
    setLinkPreviewError(null);
    try {
      const res = await fetch("/api/mobilize/link-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const json = (await res.json()) as { preview?: LinkPreviewMeta; error?: string };
      if (token !== linkPreviewFetchRef.current) return;
      if (!res.ok) throw new Error(json.error || "Could not load link preview.");
      setLinkPreview(json.preview ?? null);
    } catch (e) {
      if (token !== linkPreviewFetchRef.current) return;
      setLinkPreview(null);
      setLinkPreviewError(e instanceof Error ? e.message : "Could not load link preview.");
    } finally {
      if (token === linkPreviewFetchRef.current) setLinkPreviewLoading(false);
    }
  }, []);

  const queueLinkPreviewForUrl = useCallback(
    (url: string) => {
      if (disabled || posting) return;
      if (url === linkPreviewTrackedUrlRef.current) {
        if (linkPreviewLoading || linkPreview || linkPreviewError) return;
      }
      void fetchLinkPreview(url);
    },
    [disabled, posting, fetchLinkPreview, linkPreview, linkPreviewLoading, linkPreviewError]
  );

  const handlePasteUrl = useCallback(
    (url: string) => {
      if (disabled || posting || contentHasLinkPreview(value)) return;
      queueLinkPreviewForUrl(url);
    },
    [disabled, posting, value, queueLinkPreviewForUrl]
  );

  useEffect(() => {
    if (disabled || posting) return;
    if (contentHasLinkPreview(value)) {
      if (linkPreviewTrackedUrlRef.current !== null) clearLinkPreview();
      linkPreviewTrackedUrlRef.current = null;
      return;
    }
    const url = extractFirstHttpUrlFromComposerHtml(value);
    if (!url) {
      if (linkPreviewTrackedUrlRef.current !== null) clearLinkPreview();
      linkPreviewTrackedUrlRef.current = null;
      return;
    }
    if (url !== linkPreviewTrackedUrlRef.current && (linkPreview || linkPreviewError || linkPreviewLoading)) {
      linkPreviewFetchRef.current += 1;
      setLinkPreview(null);
      setLinkPreviewError(null);
      setLinkPreviewLoading(false);
    }
    if (
      url === linkPreviewTrackedUrlRef.current &&
      (linkPreviewLoading || linkPreview || linkPreviewError)
    ) {
      return;
    }
    const debounce = window.setTimeout(() => {
      queueLinkPreviewForUrl(url);
    }, 450);
    return () => window.clearTimeout(debounce);
  }, [
    value,
    disabled,
    posting,
    queueLinkPreviewForUrl,
    linkPreview,
    linkPreviewError,
    linkPreviewLoading,
  ]);

  function clearLinkPreview() {
    linkPreviewFetchRef.current += 1;
    linkPreviewTrackedUrlRef.current = null;
    setLinkPreview(null);
    setLinkPreviewError(null);
    setLinkPreviewLoading(false);
  }

  const showComposerLinkPreview = !contentHasLinkPreview(value);

  function handlePostClick() {
    if (!onPost) return;
    let prepared = trimTrailingFeedHtml(value);
    if (linkPreview && !contentHasLinkPreview(prepared)) {
      prepared = appendLinkPreviewHtml(prepared, linkPreview);
    }
    if (prepared !== value) onChange(prepared);
    clearLinkPreview();
    void onPost(prepared, postTargetPicker ? { postTarget: resolvedTarget } : undefined);
  }

  function openComposer(intent: "compose" | "emoji" | "video" | "image" = "compose") {
    if (disabled || posting) return;
    launchIntentRef.current = intent;
    setComposerOpen(true);
  }

  useEffect(() => {
    if (!launcher || !composerOpen) return;
    const intent = launchIntentRef.current;
    if (intent === "video") {
      setVideoDialogUrl("");
      setVideoDialogOpen(true);
      launchIntentRef.current = null;
      return;
    }
    if (intent === "image") {
      const timer = window.setTimeout(() => {
        fileRef.current?.click();
        launchIntentRef.current = null;
      }, 60);
      return () => window.clearTimeout(timer);
    }
  }, [composerOpen, launcher]);

  useEffect(() => {
    if (!launcher) return;
    if (posting) {
      wasPostingRef.current = true;
      return;
    }
    if (!wasPostingRef.current) return;
    wasPostingRef.current = false;
    const stillDraft = plainTextLength(value) > 0 || imageUrls.length > 0;
    if (!stillDraft) setComposerOpen(false);
  }, [launcher, posting, value, imageUrls.length]);

  function removeSelectedVideo() {
    restoreEditorSelection();
    editorRef.current?.execCommand("Delete");
    setVideoDialogOpen(false);
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
  const postBtnHoverBg = isDark ? "#4338ca" : useDesignAccent ? "#e6c200" : "#e01f45";
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
  ) : showVisibility && postTargetPicker ? (
    <FormControl size="small" sx={{ minWidth: 0, maxWidth: "100%", display: "block" }}>
      <Select
        value={composerPostTargetSelectValue(resolvedTarget)}
        onChange={(e) => {
          const next = parseComposerPostTargetSelectValue(String(e.target.value), joinedGroups);
          if (next && onPostTargetChange) onPostTargetChange(next);
        }}
        disabled={disabled || posting || groupsLoading}
        displayEmpty
        renderValue={(selected) => {
          if (selected === "profile" || !selected) return COMPOSER_PROFILE_POST_LABEL;
          const groupId = String(selected).startsWith("group:")
            ? String(selected).slice("group:".length)
            : "";
          const group = joinedGroups.find((g) => g.id === groupId);
          return group?.name ?? COMPOSER_PROFILE_POST_LABEL;
        }}
        IconComponent={KeyboardArrowDownIcon}
        sx={pillSelectSx}
        inputProps={{ "aria-label": "Where to post" }}
        MenuProps={{
          disableScrollLock: true,
          PaperProps: {
            className: "fp-mobilize-light-scroll",
            sx: { maxHeight: 320, ...mobilizeLightScrollbarSx },
          },
        }}
      >
        <MenuItem value="profile">On my profile</MenuItem>
        {joinedGroups.map((g) => (
          <MenuItem key={g.id} value={`group:${g.id}`}>
            {g.name}
          </MenuItem>
        ))}
        {!groupsLoading && !joinedGroups.length ? (
          <MenuItem value="profile" disabled sx={{ opacity: 1, fontSize: "0.8rem", color: "text.secondary" }}>
            No joined groups yet
          </MenuItem>
        ) : null}
      </Select>
    </FormControl>
  ) : showVisibility ? (
    <Button
      size="small"
      endIcon={<KeyboardArrowDownIcon sx={{ fontSize: "1rem !important" }} />}
      disabled
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

  const linkPreviewCard = (
    <MobilizeLinkPreviewComposerCard
      preview={linkPreview}
      loading={linkPreviewLoading}
      error={linkPreviewError}
      surface={surface}
      onDismiss={linkPreview || linkPreviewError ? clearLinkPreview : undefined}
    />
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
        videoBlockPreview
        onVideoBlockClick={handleVideoBlockClick}
        onPasteUrl={handlePasteUrl}
        onEditorInit={(ed) => {
          editorRef.current = ed;
          if (launchIntentRef.current === "emoji") {
            launchIntentRef.current = null;
            window.setTimeout(() => ed.execCommand("mceEmoticons"), 40);
          }
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
          <Tooltip title="Add video">
            <span>
              <IconButton
                size="small"
                disabled={disabled || posting}
                onClick={openVideoDialog}
                sx={footerIconSx}
                aria-label="Add video"
              >
                <VideocamOutlinedIcon fontSize="small" />
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
              onClick={handlePostClick}
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
                  bgcolor: postBtnHoverBg,
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
        {showComposerLinkPreview ? linkPreviewCard : null}
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
          {showComposerLinkPreview ? linkPreviewCard : null}
          {imageThumbs}
          {children}
          {footer}
        </Box>
      </Stack>
    </Box>
  );

  const videoDialog = (
    <VideoEmbedDialog
      open={videoDialogOpen}
      initialUrl={videoDialogUrl}
      onClose={() => setVideoDialogOpen(false)}
      onSubmit={applyVideoUrl}
      onRemove={removeSelectedVideo}
    />
  );

  const composerSurface = (
    <>
      {useDesignAccent ? designBody : legacyBody}
      {videoDialog}
    </>
  );

  const draftPlain = value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const launcherPrompt = draftPlain || headingLabel;

  const launcherBar = (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        px: { xs: 1.25, sm: 1.5 },
        py: 1.25,
      }}
    >
      <Avatar
        src={avatarUrl ? publicAssetSrc(avatarUrl) : undefined}
        alt=""
        sx={{ width: 40, height: 40, bgcolor: "#263238", flexShrink: 0 }}
      >
        {avatarFallback.charAt(0).toUpperCase()}
      </Avatar>
      <Box
        component="button"
        type="button"
        disabled={disabled || posting}
        onClick={() => openComposer("compose")}
        sx={{
          flex: 1,
          minWidth: 0,
          height: 40,
          px: 1.75,
          border: "none",
          borderRadius: 999,
          bgcolor: isDark ? "rgba(255,255,255,0.06)" : "#f0f2f5",
          color: draftPlain ? textColor : "#65676b",
          font: "inherit",
          fontSize: "0.95rem",
          lineHeight: 1.2,
          textAlign: "left",
          cursor: "pointer",
          overflow: "hidden",
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
          "&:hover": { bgcolor: isDark ? "rgba(255,255,255,0.1)" : "#e4e6eb" },
          "&:disabled": { opacity: 0.6, cursor: "default" },
        }}
      >
        {launcherPrompt}
      </Box>
      {onImageUrlsChange ? (
        <Tooltip title="Attach image">
          <span>
            <IconButton
              size="small"
              disabled={disabled || posting || uploading || imageUrls.length >= maxImages}
              onClick={() => openComposer("image")}
              aria-label="Attach image"
              sx={footerIconSx}
            >
              {uploading ? <CircularProgress size={18} /> : <AttachFileOutlinedIcon fontSize="small" />}
            </IconButton>
          </span>
        </Tooltip>
      ) : null}
      <Tooltip title="Emoji">
        <span>
          <IconButton
            size="small"
            disabled={disabled || posting}
            onClick={() => openComposer("emoji")}
            aria-label="Emoji"
            sx={footerIconSx}
          >
            <EmojiEmotionsOutlinedIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Add video">
        <span>
          <IconButton
            size="small"
            disabled={disabled || posting}
            onClick={() => openComposer("video")}
            aria-label="Add video"
            sx={footerIconSx}
          >
            <VideocamOutlinedIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
    </Box>
  );

  const body = launcher ? (
    <>
      {launcherBar}
      <MobilizeDialog
        open={composerOpen}
        onClose={() => {
          if (posting || uploading) return;
          setComposerOpen(false);
        }}
        fullWidth
        maxWidth="sm"
      >
        <Box sx={{ position: "relative" }}>
          <IconButton
            aria-label="Close"
            onClick={() => {
              if (posting || uploading) return;
              setComposerOpen(false);
            }}
            sx={{ position: "absolute", top: 8, right: 8, zIndex: 1, color: "rgba(0,0,0,0.6)" }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
          {composerSurface}
        </Box>
      </MobilizeDialog>
    </>
  ) : (
    composerSurface
  );

  if (!isDark) {
    return <ThemeProvider theme={mobilizePanelTheme}>{body}</ThemeProvider>;
  }

  return body;
}
