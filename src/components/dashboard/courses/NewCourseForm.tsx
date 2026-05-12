"use client";

import { slugify } from "@/lib/slug";
import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { AuthorOption } from "@/lib/courses/author-options";
import { createClient } from "@/utils/supabase/client";

export function NewCourseForm({ authorOptions }: { authorOptions: AuthorOption[] }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [title, setTitle] = useState("");
  const [slugManual, setSlugManual] = useState(false);
  const [slug, setSlug] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [published, setPublished] = useState(false);
  const [appliesGrades, setAppliesGrades] = useState(true);
  const [author, setAuthor] = useState<AuthorOption | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (slugManual) return;
    setSlug(slugify(title));
  }, [title, slugManual]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const nextSlug = slugify(slug || title);
    if (!title.trim() || !nextSlug) {
      setErr("Title and slug are required.");
      return;
    }
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setErr("Not signed in.");
      setSaving(false);
      return;
    }
    const { data, error } = await supabase
      .from("courses")
      .insert({
        title: title.trim(),
        slug: nextSlug,
        subtitle: subtitle.trim() || null,
        published,
        applies_grades: appliesGrades,
        author_user_id: author?.id ?? null,
        author_display_name: author ? author.label : "FlashPoint Team",
        created_by: user.id,
      })
      .select("id")
      .single();
    if (error || !data) {
      setErr(error?.message ?? "Could not create course.");
      setSaving(false);
      return;
    }
    router.push(`/dashboard/courses/${data.id}/edit`);
    router.refresh();
  }

  return (
    <Paper component="form" onSubmit={(e) => void submit(e)} sx={{ p: 2, bgcolor: "rgba(0,0,0,0.45)", maxWidth: 640 }}>
      <Typography variant="h6" sx={{ color: "primary.main", mb: 2 }}>
        New course
      </Typography>
      {err ? (
        <Typography color="error" sx={{ mb: 1 }}>
          {err}
        </Typography>
      ) : null}
      <TextField label="Title" required fullWidth value={title} onChange={(e) => setTitle(e.target.value)} sx={{ mb: 2 }} />
      <TextField
        label="URL slug"
        required
        fullWidth
        value={slug}
        onChange={(e) => {
          setSlugManual(true);
          setSlug(e.target.value);
        }}
        helperText={slugManual ? undefined : "Autocompleted from title."}
        sx={{ mb: 2 }}
      />
      <TextField label="Subtitle" fullWidth value={subtitle} onChange={(e) => setSubtitle(e.target.value)} sx={{ mb: 2 }} />

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel id="new-course-author-lbl" shrink={Boolean(author?.id)}>
          Author
        </InputLabel>
        <Select
          labelId="new-course-author-lbl"
          label="Author"
          notched={Boolean(author?.id)}
          value={author?.id ?? ""}
          displayEmpty
          onChange={(e) => {
            const id = String(e.target.value);
            setAuthor(id ? authorOptions.find((a) => a.id === id) ?? null : null);
          }}
          renderValue={(selected) => {
            if (!selected) {
              return (
                <Typography variant="body2" component="span" color="text.disabled" sx={{ fontStyle: "italic" }}>
                  Select author (optional)…
                </Typography>
              );
            }
            return authorOptions.find((a) => a.id === selected)?.label ?? "";
          }}
        >
          <MenuItem value="">
            <em>Default display (FlashPoint Team)</em>
          </MenuItem>
          {authorOptions.map((a) => (
            <MenuItem key={a.id} value={a.id}>
              {a.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
        <FormControl size="small" fullWidth sx={{ maxWidth: { sm: 220 } }}>
          <InputLabel id="new-course-status-lbl">Status</InputLabel>
          <Select
            labelId="new-course-status-lbl"
            label="Status"
            value={published ? "published" : "draft"}
            onChange={(e) => setPublished(e.target.value === "published")}
          >
            <MenuItem value="draft">Draft</MenuItem>
            <MenuItem value="published">Published</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" fullWidth sx={{ maxWidth: { sm: 240 } }}>
          <InputLabel id="new-course-grades-lbl">Grades</InputLabel>
          <Select
            labelId="new-course-grades-lbl"
            label="Grades"
            value={appliesGrades ? "on" : "off"}
            onChange={(e) => setAppliesGrades(e.target.value === "on")}
          >
            <MenuItem value="off">Grades disabled</MenuItem>
            <MenuItem value="on">Grades enabled</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      <Button type="submit" variant="contained" disabled={saving}>
        {saving ? "Creating…" : "Create and open builder"}
      </Button>
    </Paper>
  );
}
