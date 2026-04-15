"use client";

import { createClient } from "@/utils/supabase/client";
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
import { useState } from "react";

type ChapterOpt = {
  id: string;
  name: string;
  state: string;
  address_line: string | null;
  city: string | null;
  zip_code: string | null;
};
type CatOpt = { id: string; name: string; slug: string };

export function GatheringForm({
  chapters,
  categories,
  userId,
  canNotifyAllUsers,
}: {
  chapters: ChapterOpt[];
  categories: CatOpt[];
  userId: string;
  /** Admins can notify all dashboard users; local leaders are always chapter-only on the server. */
  canNotifyAllUsers: boolean;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [chapterId, setChapterId] = useState<string>("");
  const [useChapterAddress, setUseChapterAddress] = useState(false);
  const [locationManual, setLocationManual] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [descriptionHtml, setDescriptionHtml] = useState("");
  const [featuredImageUrl, setFeaturedImageUrl] = useState("");
  const [notifyAllUsers, setNotifyAllUsers] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    const audience_scope = canNotifyAllUsers && notifyAllUsers ? "all" : "chapter";
    const { data, error } = await supabase
      .from("gatherings")
      .insert({
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
        created_by: userId,
      })
      .select("id")
      .single();
    if (!error && data) {
      void fetch("/api/email/gathering-created", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gatheringId: data.id }),
      });
      router.push(`/dashboard/gatherings/${data.id}`);
      router.refresh();
    }
  }

  return (
    <Paper component="form" onSubmit={(e) => void submit(e)} sx={{ p: 2, bgcolor: "rgba(0,0,0,0.45)" }}>
      <Typography variant="h6" sx={{ color: "primary.main", mb: 2 }}>
        New gathering
      </Typography>
      <TextField
        label="Event title"
        required
        fullWidth
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        sx={{ mb: 2 }}
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
      <TextField
        label="Event date & time"
        type="datetime-local"
        fullWidth
        required
        value={startsAt}
        onChange={(e) => setStartsAt(e.target.value)}
        InputLabelProps={{ shrink: true }}
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
      <TextField
        label="Description"
        fullWidth
        multiline
        minRows={10}
        value={descriptionHtml}
        onChange={(e) => setDescriptionHtml(e.target.value)}
        sx={{ mb: 1 }}
        helperText="Rich text (TinyMCE) can be wired later with a hosted script or API key."
      />
      <TextField
        label="Featured image URL"
        fullWidth
        value={featuredImageUrl}
        onChange={(e) => setFeaturedImageUrl(e.target.value)}
        sx={{ mt: 2, mb: 2 }}
        helperText="Paste a public image URL (Supabase Storage integration can be added later)."
      />
      <Box sx={{ display: "flex", gap: 1 }}>
        <Button type="submit" variant="contained">
          Save event
        </Button>
        <Button component={Link} href="/dashboard/gatherings">
          Cancel
        </Button>
      </Box>
    </Paper>
  );
}
