"use client";

import { slugify } from "@/lib/slug";
import {
  Autocomplete,
  Button,
  Checkbox,
  FormControlLabel,
  Paper,
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
      <Autocomplete
        options={authorOptions}
        value={author}
        onChange={(_, v) => setAuthor(v)}
        getOptionLabel={(o) => o.label}
        isOptionEqualToValue={(a, b) => a.id === b.id}
        renderInput={(params) => (
          <TextField {...params} label="Author" placeholder="Search name or email…" sx={{ mb: 2 }} />
        )}
      />
      <FormControlLabel
        control={<Checkbox checked={published} onChange={(e) => setPublished(e.target.checked)} />}
        label="Published (visible to learners with Training access)"
        sx={{ display: "block", mb: 1 }}
      />
      <FormControlLabel
        control={<Checkbox checked={appliesGrades} onChange={(e) => setAppliesGrades(e.target.checked)} />}
        label="Course uses grades (quiz scores contribute)"
        sx={{ display: "block", mb: 2 }}
      />
      <Button type="submit" variant="contained" disabled={saving}>
        {saving ? "Creating…" : "Create and open builder"}
      </Button>
    </Paper>
  );
}
