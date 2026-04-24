"use client";

import { createClient } from "@/utils/supabase/client";
import { GatheringDescriptionEditor } from "@/components/dashboard/gatherings/GatheringDescriptionEditor";
import { GatheringImageFields } from "@/components/dashboard/gatherings/GatheringImageFields";
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/slug";
import { useEffect, useMemo, useState } from "react";

type ChapterOpt = {
  id: string;
  name: string;
  state: string;
  address_line: string | null;
  city: string | null;
  zip_code: string | null;
};
type CatOpt = { id: string; name: string; slug: string };
type GatheringStatus = "draft" | "published" | "trash";

const DEFAULT_CTA_LABEL = "REGISTER NOW";

export function GatheringForm({
  chapters,
  categories,
  userId,
  canNotifyAllUsers,
  mode = "create",
  gatheringId,
  initialValues,
}: {
  chapters: ChapterOpt[];
  categories: CatOpt[];
  userId: string;
  /** Admins can notify all dashboard users; local leaders are always chapter-only on the server. */
  canNotifyAllUsers: boolean;
  mode?: "create" | "edit";
  gatheringId?: string;
  initialValues?: {
    title: string;
    subtitle: string;
    chapterId: string;
    useChapterAddress: boolean;
    locationManual: string;
    startsAtLocal: string;
    categoryId: string;
    descriptionHtml: string;
    featuredImageUrl: string;
    status: GatheringStatus;
    slug: string;
    audienceScope: "all" | "chapter";
    isVirtual: boolean;
    virtualUrl: string;
    galleryImageUrls: string[];
    videoUrl?: string;
    ctaUrl?: string;
    ctaButtonLabel?: string;
    ctaButtonVisible?: boolean;
  };
}) {
  const router = useRouter();
  const editing = mode === "edit";
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [subtitle, setSubtitle] = useState(initialValues?.subtitle ?? "");
  const [chapterId, setChapterId] = useState<string>(initialValues?.chapterId ?? "");
  const [useChapterAddress, setUseChapterAddress] = useState(initialValues?.useChapterAddress ?? false);
  const [locationManual, setLocationManual] = useState(initialValues?.locationManual ?? "");
  const [startsAt, setStartsAt] = useState(initialValues?.startsAtLocal ?? "");
  const [categoryId, setCategoryId] = useState<string>(initialValues?.categoryId ?? "");
  const [descriptionHtml, setDescriptionHtml] = useState(initialValues?.descriptionHtml ?? "");
  const [featuredImageUrl, setFeaturedImageUrl] = useState(initialValues?.featuredImageUrl ?? "");
  const [notifyAllUsers, setNotifyAllUsers] = useState((initialValues?.audienceScope ?? "chapter") === "all");
  const [status, setStatus] = useState<GatheringStatus>(initialValues?.status ?? "draft");
  const [slug, setSlug] = useState(initialValues?.slug ?? "");
  /** When false, slug is kept in sync with the title (slugify). Set true when the user edits the slug field. */
  const [slugManual, setSlugManual] = useState(
    Boolean(editing && (initialValues?.slug ?? "").trim().length > 0)
  );

  useEffect(() => {
    if (slugManual) return;
    setSlug(slugify(title));
  }, [title, slugManual]);
  const [isVirtual, setIsVirtual] = useState(initialValues?.isVirtual ?? false);
  const [virtualUrl, setVirtualUrl] = useState(initialValues?.virtualUrl ?? "");
  const [galleryImageUrls, setGalleryImageUrls] = useState<string[]>(
    initialValues?.galleryImageUrls ?? []
  );
  const [videoUrl, setVideoUrl] = useState(initialValues?.videoUrl ?? "");
  const [ctaUrl, setCtaUrl] = useState(initialValues?.ctaUrl ?? "");
  const [ctaButtonLabel, setCtaButtonLabel] = useState(
    initialValues?.ctaButtonLabel?.trim() ? initialValues.ctaButtonLabel : DEFAULT_CTA_LABEL
  );
  const [ctaButtonVisible, setCtaButtonVisible] = useState(
    initialValues?.ctaButtonVisible ?? false
  );
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [mediaBusy, setMediaBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (!title.trim()) {
      setSubmitError("Event title is required.");
      return;
    }
    if (!startsAt) {
      setSubmitError("Event date & time is required.");
      return;
    }
    const nextSlug = slugify(slug || title);
    if (!nextSlug) {
      setSubmitError("Slug is required.");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const audience_scope = canNotifyAllUsers && notifyAllUsers ? "all" : "chapter";
    const payload = {
      title: title.trim(),
      subtitle: subtitle.trim() || null,
      chapter_id: chapterId || null,
      audience_scope,
      use_chapter_address: useChapterAddress,
      location_manual: locationManual.trim() || null,
      starts_at: new Date(startsAt).toISOString(),
      category_id: categoryId || null,
      description_html: descriptionHtml,
      featured_image_url: featuredImageUrl.trim() || null,
      gallery_image_urls: galleryImageUrls,
      is_virtual: isVirtual,
      virtual_url: isVirtual ? virtualUrl.trim() || null : null,
      video_url: videoUrl.trim() || null,
      cta_url: ctaUrl.trim() || null,
      cta_button_label: ctaButtonLabel.trim() || DEFAULT_CTA_LABEL,
      cta_button_visible: ctaButtonVisible,
      status,
      slug: nextSlug,
      ...(editing ? {} : { created_by: userId }),
    };
    const query = editing
      ? supabase.from("gatherings").update(payload).eq("id", gatheringId).select("id").single()
      : supabase.from("gatherings").insert(payload).select("id").single();
    const { data, error } = await query;
    if (error || !data) {
      setSubmitError(error?.message || "Could not save event.");
      setSaving(false);
      return;
    }
    if (!editing) {
      void fetch("/api/email/gathering-created", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gatheringId: data.id }),
      });
    }
    router.push(`/dashboard/gatherings/${data.id}`);
    router.refresh();
  }

  const previewSlug = useMemo(() => slugify(slug || title), [slug, title]);
  const publicPreviewUrl = previewSlug ? `/events/${previewSlug}` : "";

  return (
    <Paper component="form" onSubmit={(e) => void submit(e)} sx={{ p: 2, bgcolor: "rgba(0,0,0,0.45)" }}>
      <Typography variant="h6" sx={{ color: "primary.main", mb: 2 }}>
        {editing ? "Edit gathering" : "New gathering"}
      </Typography>
      {submitError ? (
        <Typography color="error" sx={{ mb: 1 }}>
          {submitError}
        </Typography>
      ) : null}
      <TextField
        label="Event title"
        required
        fullWidth
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        sx={{ mb: 2 }}
      />
      <TextField
        label="Public URL slug"
        required
        fullWidth
        value={slug}
        onChange={(e) => {
          setSlugManual(true);
          setSlug(e.target.value);
        }}
        sx={{ mb: 2 }}
        helperText={
          publicPreviewUrl
            ? `Public URL: ${publicPreviewUrl}${slugManual ? "" : " · Autocompleted from title; edit to customize."}`
            : "Set a URL slug for this event."
        }
      />
      <TextField
        label="Subtitle"
        fullWidth
        value={subtitle}
        onChange={(e) => setSubtitle(e.target.value)}
        sx={{ mb: 2 }}
      />
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel id="ch-pick">Chapter (optional)</InputLabel>
        <Select
          labelId="ch-pick"
          label="Chapter (optional)"
          value={chapterId}
          onChange={(e) => setChapterId(e.target.value as string)}
        >
          <MenuItem value="">None — manual address only</MenuItem>
          {chapters.map((c) => (
            <MenuItem key={c.id} value={c.id}>
              {c.name} ({c.state})
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControlLabel
        control={<Checkbox checked={isVirtual} onChange={(e) => setIsVirtual(e.target.checked)} />}
        label="Virtual event"
      />
      {isVirtual ? (
        <TextField
          label="Virtual meeting URL"
          fullWidth
          value={virtualUrl}
          onChange={(e) => setVirtualUrl(e.target.value)}
          sx={{ mb: 2 }}
          helperText="Zoom / Meet / livestream URL."
        />
      ) : null}
      <FormControlLabel
        control={
          <Checkbox
            checked={useChapterAddress}
            onChange={(e) => setUseChapterAddress(e.target.checked)}
            disabled={!chapterId}
          />
        }
        label="Use chapter address for location"
      />
      {canNotifyAllUsers && chapterId ? (
        <FormControlLabel
          control={
            <Checkbox
              checked={notifyAllUsers}
              onChange={(e) => setNotifyAllUsers(e.target.checked)}
            />
          }
          label="Notify all dashboard users (email). If unchecked, only members linked to this chapter are notified."
        />
      ) : null}
      <TextField
        label="Manual location / address"
        fullWidth
        value={locationManual}
        onChange={(e) => setLocationManual(e.target.value)}
        sx={{ mb: 2, mt: 1 }}
        helperText="Used when no chapter is selected, or in addition to chapter context."
      />
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel id="status-pick">Status</InputLabel>
        <Select
          labelId="status-pick"
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as GatheringStatus)}
        >
          <MenuItem value="draft">Draft</MenuItem>
          <MenuItem value="published">Published</MenuItem>
          <MenuItem value="trash">Trash</MenuItem>
        </Select>
      </FormControl>
      <TextField
        label="Event date & time"
        type="datetime-local"
        fullWidth
        required
        value={startsAt}
        onChange={(e) => setStartsAt(e.target.value)}
        InputLabelProps={{ shrink: true }}
        inputProps={{ step: 60 }}
        sx={{ mb: 2 }}
      />
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel id="cat-pick">Category</InputLabel>
        <Select
          labelId="cat-pick"
          label="Category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value as string)}
        >
          <MenuItem value="">Uncategorized</MenuItem>
          {categories.map((c) => (
            <MenuItem key={c.id} value={c.id}>
              {c.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <GatheringDescriptionEditor
        value={descriptionHtml}
        onChange={setDescriptionHtml}
        disabled={saving || mediaBusy}
      />
      <TextField
        label="Promo / video URL"
        fullWidth
        value={videoUrl}
        onChange={(e) => setVideoUrl(e.target.value)}
        sx={{ mb: 2 }}
        helperText="YouTube, Vimeo, Dailymotion, direct MP4/WebM, or embed URL. Opens in a dialog with Plyr when viewing the event."
      />
      <TextField
        label="CTA link (external)"
        fullWidth
        value={ctaUrl}
        onChange={(e) => setCtaUrl(e.target.value)}
        sx={{ mb: 1 }}
        helperText="Registration or external action URL (opens in a new tab)."
      />
      <TextField
        label="CTA button text"
        fullWidth
        value={ctaButtonLabel}
        onChange={(e) => setCtaButtonLabel(e.target.value)}
        sx={{ mb: 1 }}
        placeholder={DEFAULT_CTA_LABEL}
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={ctaButtonVisible}
            onChange={(e) => setCtaButtonVisible(e.target.checked)}
          />
        }
        label="Show CTA button after description (dashboard view and public event page)"
        sx={{ display: "block", mb: 2 }}
      />
      <GatheringImageFields
        featuredImageUrl={featuredImageUrl}
        setFeaturedImageUrl={setFeaturedImageUrl}
        galleryImageUrls={galleryImageUrls}
        setGalleryImageUrls={setGalleryImageUrls}
        onError={setSubmitError}
        onBusyChange={setMediaBusy}
        disabled={saving}
      />
      <Box sx={{ display: "flex", gap: 1 }}>
        <Button type="submit" variant="contained" disabled={saving || mediaBusy}>
          {saving ? "Saving..." : "Save event"}
        </Button>
        <Button component={Link} href="/dashboard/gatherings">
          Cancel
        </Button>
      </Box>
    </Paper>
  );
}
