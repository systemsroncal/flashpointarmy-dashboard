"use client";

import { CourseQuizFormEditor, coerceQuizPayload } from "@/components/dashboard/courses/CourseQuizFormEditor";
import { slugify } from "@/lib/slug";
import type { QuizElementPayload } from "@/types/course-content";
import type { AuthorOption } from "@/lib/courses/author-options";
import { GatheringDescriptionEditor } from "@/components/dashboard/gatherings/GatheringDescriptionEditor";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type ElementRow = {
  id: string;
  element_type: string;
  title_html: string;
  description_html: string;
  payload: unknown;
  sort_order: number;
};

type SessionRow = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  cover_image_url: string;
  sort_order: number;
  elements: ElementRow[];
};

const DEFAULT_QUIZ_PAYLOAD = coerceQuizPayload({
  maxPoints: null,
  questions: [
    {
      id: "q1",
      type: "tf",
      promptHtml: "<p>Example: true or false.</p>",
      points: 10,
      correctTrue: true,
      trueLabelHtml: "<span>True</span>",
      falseLabelHtml: "<span>False</span>",
    },
  ],
});

const RICH_EDITOR_HELPER =
  "Self-hosted TinyMCE (GPL). Content is stored as HTML. For images, use HTTPS URLs.";

function SortableShell({
  id,
  children,
}: {
  id: string;
  children: (handleProps: Record<string, unknown>) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <Box ref={setNodeRef} style={style} sx={{ mb: 1 }}>
      {children({ ...attributes, ...listeners })}
    </Box>
  );
}

export function CourseEditClient({
  courseId,
  initialCourse,
  initialSessions,
  authorOptions,
}: {
  courseId: string;
  initialCourse: {
    title: string;
    slug: string;
    subtitle: string | null;
    published: boolean;
    applies_grades: boolean;
    author_user_id: string | null;
    author_display_name: string | null;
  };
  initialSessions: SessionRow[];
  authorOptions: AuthorOption[];
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const [title, setTitle] = useState(initialCourse.title);
  const [slug, setSlug] = useState(initialCourse.slug);
  const [subtitle, setSubtitle] = useState(initialCourse.subtitle ?? "");
  const [published, setPublished] = useState(initialCourse.published);
  const [appliesGrades, setAppliesGrades] = useState(initialCourse.applies_grades);
  const [author, setAuthor] = useState<AuthorOption | null>(
    authorOptions.find((a) => a.id === initialCourse.author_user_id) ?? null
  );
  const [sessions, setSessions] = useState<SessionRow[]>(initialSessions);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [deleteCourseOpen, setDeleteCourseOpen] = useState(false);
  const [deleteBlockTarget, setDeleteBlockTarget] = useState<{ sessionId: string; elementId: string } | null>(null);
  const dragBlockIdxRef = useRef<number | null>(null);
  const dragBlockSessionRef = useRef<string | null>(null);
  /** dnd-kit aria-describedby IDs must match SSR vs client; stable context ids avoid global counter drift. */
  const sessionDndId = useMemo(() => `course-edit-dnd-${courseId}`, [courseId]);
  const sessionSortableId = useMemo(() => `course-edit-sort-${courseId}`, [courseId]);

  const reorderSessions = useCallback((ev: DragEndEvent) => {
    const { active, over } = ev;
    if (!over || active.id === over.id) return;
    setSessions((prev) => {
      const oldIndex = prev.findIndex((s) => s.id === active.id);
      const newIndex = prev.findIndex((s) => s.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return prev;
      const next = arrayMove(prev, oldIndex, newIndex).map((s, i) => ({ ...s, sort_order: i }));
      return next;
    });
  }, []);

  const moveElement = useCallback((sessionId: string, elementId: string, dir: -1 | 1) => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== sessionId) return s;
        const idx = s.elements.findIndex((e) => e.id === elementId);
        const j = idx + dir;
        if (idx < 0 || j < 0 || j >= s.elements.length) return s;
        const els = arrayMove(s.elements, idx, j).map((e, i) => ({ ...e, sort_order: i }));
        return { ...s, elements: els };
      })
    );
  }, []);

  const reorderBlocksByDrag = useCallback((sessionId: string, fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx) return;
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== sessionId) return s;
        const els = arrayMove(s.elements, fromIdx, toIdx).map((e, i) => ({ ...e, sort_order: i }));
        return { ...s, elements: els };
      })
    );
  }, []);

  async function saveAll() {
    setErr(null);
    setMsg(null);
    setBusy(true);
    try {
      const nextSlug = slugify(slug || title);
      if (!nextSlug) {
        setErr("Slug is required.");
        return;
      }
      const { error: cErr } = await supabase
        .from("courses")
        .update({
          title: title.trim(),
          slug: nextSlug,
          subtitle: subtitle.trim() || null,
          published,
          applies_grades: appliesGrades,
          author_user_id: author?.id ?? null,
          author_display_name: author?.label ?? "FlashPoint Team",
          updated_at: new Date().toISOString(),
        })
        .eq("id", courseId);
      if (cErr) throw new Error(cErr.message);

      for (const s of sessions) {
        await supabase
          .from("course_sessions")
          .update({
            slug: slugify(s.slug || s.title),
            title: s.title.trim(),
            subtitle: s.subtitle.trim() || null,
            cover_image_url: s.cover_image_url.trim() || null,
            sort_order: s.sort_order,
          })
          .eq("id", s.id);

        for (const el of s.elements) {
          const base = {
            session_id: s.id,
            sort_order: el.sort_order,
            element_type: el.element_type,
            title_html: el.title_html.trim() || null,
            description_html: el.description_html.trim() || null,
            payload: el.payload as object,
          };
          const { error: uErr } = await supabase.from("course_elements").update(base).eq("id", el.id);
          if (uErr) throw new Error(uErr.message);
        }
      }

      setMsg("Saved.");
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }

  async function addSession() {
    const t = window.prompt("New session title:");
    if (!t?.trim()) return;
    const sl = slugify(t);
    const max = sessions.reduce((m, s) => Math.max(m, s.sort_order), -1);
    const { data, error } = await supabase
      .from("course_sessions")
      .insert({
        course_id: courseId,
        title: t.trim(),
        slug: sl || `session-${Date.now()}`,
        sort_order: max + 1,
      })
      .select("id, slug, title, subtitle, cover_image_url, sort_order")
      .single();
    if (error || !data) {
      setErr(error?.message ?? "Could not add session.");
      return;
    }
    setSessions((prev) => [
      ...prev,
      {
        id: data.id as string,
        slug: data.slug as string,
        title: data.title as string,
        subtitle: (data.subtitle as string) ?? "",
        cover_image_url: (data.cover_image_url as string) ?? "",
        sort_order: data.sort_order as number,
        elements: [],
      },
    ]);
  }

  async function addElement(sessionId: string, type: string) {
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return;
    const max = session.elements.reduce((m, e) => Math.max(m, e.sort_order), -1);
    let payload: unknown = {};
    if (type === "video") payload = { url: "" };
    if (type === "pdf") payload = { url: "", fileName: "" };
    if (type === "image") payload = { url: "" };
    if (type === "rich_text") payload = { html: "<p></p>" };
    if (type === "plain_text") payload = { text: "" };
    if (type === "quiz") payload = JSON.parse(JSON.stringify(DEFAULT_QUIZ_PAYLOAD)) as QuizElementPayload;

    const { data, error } = await supabase
      .from("course_elements")
      .insert({
        session_id: sessionId,
        element_type: type,
        sort_order: max + 1,
        title_html: null,
        description_html: "",
        payload,
      })
      .select("id, element_type, title_html, description_html, payload, sort_order")
      .single();
    if (error || !data) {
      setErr(error?.message ?? "Could not add block.");
      return;
    }
    const row: ElementRow = {
      id: data.id as string,
      element_type: data.element_type as string,
      title_html: (data.title_html as string) ?? "",
      description_html: (data.description_html as string) ?? "",
      payload: data.payload,
      sort_order: data.sort_order as number,
    };
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, elements: [...s.elements, row] } : s))
    );
  }

  function requestRemoveElement(sessionId: string, elementId: string) {
    setDeleteBlockTarget({ sessionId, elementId });
  }

  async function confirmRemoveElement() {
    if (!deleteBlockTarget) return;
    const { sessionId, elementId } = deleteBlockTarget;
    setBusy(true);
    setErr(null);
    try {
      const { error } = await supabase.from("course_elements").delete().eq("id", elementId);
      if (error) throw new Error(error.message);
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? { ...s, elements: s.elements.filter((e) => e.id !== elementId).map((e, i) => ({ ...e, sort_order: i })) }
            : s
        )
      );
      setDeleteBlockTarget(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not delete block.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmDeleteCourse() {
    setBusy(true);
    setErr(null);
    try {
      const { error } = await supabase.from("courses").delete().eq("id", courseId);
      if (error) throw new Error(error.message);
      setDeleteCourseOpen(false);
      router.push("/dashboard/courses");
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not delete course.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ color: "primary.main", mb: 2 }}>
        Edit course
      </Typography>
      {err ? (
        <Typography color="error" sx={{ mb: 1 }}>
          {err}
        </Typography>
      ) : null}
      {msg ? (
        <Typography color="success.main" sx={{ mb: 1 }}>
          {msg}
        </Typography>
      ) : null}

      <Stack spacing={2} sx={{ maxWidth: 900, mb: 2 }}>
        <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} fullWidth />
        <TextField label="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} fullWidth />
        <TextField label="Subtitle" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} fullWidth />
        <FormControl fullWidth>
          <InputLabel id="course-edit-author-lbl" shrink={Boolean(author?.id)}>
            Author
          </InputLabel>
          <Select
            labelId="course-edit-author-lbl"
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
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="course-status-lbl">Status</InputLabel>
            <Select
              labelId="course-status-lbl"
              label="Status"
              value={published ? "published" : "draft"}
              onChange={(e) => setPublished(e.target.value === "published")}
            >
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="published">Published</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel id="course-grades-lbl">Grades</InputLabel>
            <Select
              labelId="course-grades-lbl"
              label="Grades"
              value={appliesGrades ? "on" : "off"}
              onChange={(e) => setAppliesGrades(e.target.value === "on")}
            >
              <MenuItem value="off">Grades disabled</MenuItem>
              <MenuItem value="on">Grades enabled</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Stack>

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
        <Typography variant="subtitle1" fontWeight={800}>
          Sessions (drag to reorder)
        </Typography>
        <Button startIcon={<AddIcon />} onClick={() => void addSession()}>
          Add session
        </Button>
      </Box>

      <DndContext
        id={sessionDndId}
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={reorderSessions}
      >
        <SortableContext
          id={sessionSortableId}
          items={sessions.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          {sessions.map((s) => (
            <SortableShell key={s.id} id={s.id}>
              {(handle) => (
                <Accordion defaultExpanded>
                  <AccordionSummary>
                    <Typography fontWeight={700}>{s.title || "(untitled session)"}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                      <DragIndicatorIcon sx={{ cursor: "grab", color: "text.secondary" }} {...handle} />
                      <Typography variant="caption" color="text.secondary">
                        Drag the handle to reorder sessions
                      </Typography>
                    </Box>
                    <Stack spacing={1.5} sx={{ mb: 2 }}>
                      <TextField
                        label="Session title"
                        value={s.title}
                        onChange={(e) =>
                          setSessions((prev) =>
                            prev.map((x) => (x.id === s.id ? { ...x, title: e.target.value } : x))
                          )
                        }
                        fullWidth
                      />
                      <TextField
                        label="Session slug"
                        value={s.slug}
                        onChange={(e) =>
                          setSessions((prev) =>
                            prev.map((x) => (x.id === s.id ? { ...x, slug: e.target.value } : x))
                          )
                        }
                        fullWidth
                      />
                      <TextField
                        label="Subtitle"
                        value={s.subtitle}
                        onChange={(e) =>
                          setSessions((prev) =>
                            prev.map((x) => (x.id === s.id ? { ...x, subtitle: e.target.value } : x))
                          )
                        }
                        fullWidth
                      />
                      <TextField
                        label="Cover image URL"
                        value={s.cover_image_url}
                        onChange={(e) =>
                          setSessions((prev) =>
                            prev.map((x) => (x.id === s.id ? { ...x, cover_image_url: e.target.value } : x))
                          )
                        }
                        fullWidth
                      />
                    </Stack>

                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Content blocks (drag the block or use ↑ ↓)
                    </Typography>
                    {s.elements.map((el, elIdx) => (
                      <Paper
                        key={el.id}
                        draggable
                        onDragStart={() => {
                          dragBlockIdxRef.current = elIdx;
                          dragBlockSessionRef.current = s.id;
                        }}
                        onDragEnd={() => {
                          dragBlockIdxRef.current = null;
                          dragBlockSessionRef.current = null;
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = "move";
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          const from = dragBlockIdxRef.current;
                          const sid = dragBlockSessionRef.current;
                          dragBlockIdxRef.current = null;
                          dragBlockSessionRef.current = null;
                          if (from == null || sid !== s.id) return;
                          reorderBlocksByDrag(s.id, from, elIdx);
                        }}
                        sx={{
                          p: 1.5,
                          mb: 1,
                          bgcolor: "rgba(0,0,0,0.35)",
                          cursor: "grab",
                          "&:active": { cursor: "grabbing" },
                        }}
                      >
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1, flexWrap: "wrap" }}>
                                  <IconButton
                                    size="small"
                                    aria-label="Move block up"
                                    disabled={elIdx === 0}
                                    onClick={() => moveElement(s.id, el.id, -1)}
                                  >
                                    <KeyboardArrowUpIcon />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    aria-label="Move block down"
                                    disabled={elIdx === s.elements.length - 1}
                                    onClick={() => moveElement(s.id, el.id, 1)}
                                  >
                                    <KeyboardArrowDownIcon />
                                  </IconButton>
                                  <FormControl size="small" sx={{ minWidth: 160 }}>
                                    <InputLabel>Block type</InputLabel>
                                    <Select
                                      label="Block type"
                                      value={el.element_type}
                                      onChange={(e) => {
                                        const v = e.target.value;
                                        const nextPayloadFor = (nextType: string): unknown => {
                                          if (nextType === "quiz")
                                            return JSON.parse(JSON.stringify(DEFAULT_QUIZ_PAYLOAD));
                                          if (nextType === "video") return { url: "" };
                                          if (nextType === "pdf") return { url: "", fileName: "" };
                                          if (nextType === "image") return { url: "" };
                                          if (nextType === "rich_text") return { html: "<p></p>" };
                                          if (nextType === "plain_text") return { text: "" };
                                          return {};
                                        };
                                        setSessions((prev) =>
                                          prev.map((ss) =>
                                            ss.id !== s.id
                                              ? ss
                                              : {
                                                  ...ss,
                                                  elements: ss.elements.map((x) =>
                                                    x.id === el.id
                                                      ? {
                                                          ...x,
                                                          element_type: v,
                                                          payload: nextPayloadFor(v),
                                                        }
                                                      : x
                                                  ),
                                                }
                                          )
                                        );
                                      }}
                                    >
                                      <MenuItem value="plain_text">Plain text</MenuItem>
                                      <MenuItem value="rich_text">Rich text</MenuItem>
                                      <MenuItem value="video">Video</MenuItem>
                                      <MenuItem value="pdf">PDF</MenuItem>
                                      <MenuItem value="image">Image</MenuItem>
                                      <MenuItem value="quiz">Quiz</MenuItem>
                                    </Select>
                                  </FormControl>
                                  <Button color="error" size="small" onClick={() => requestRemoveElement(s.id, el.id)}>
                                    <DeleteOutlineIcon fontSize="small" />
                                  </Button>
                                </Box>
                                <GatheringDescriptionEditor
                                  key={`${el.id}-block-title`}
                                  compact
                                  showHelper={false}
                                  label="Block title (optional)"
                                  value={el.title_html}
                                  onChange={(html) =>
                                    setSessions((prev) =>
                                      prev.map((ss) =>
                                        ss.id !== s.id
                                          ? ss
                                          : {
                                              ...ss,
                                              elements: ss.elements.map((x) =>
                                                x.id === el.id ? { ...x, title_html: html } : x
                                              ),
                                            }
                                      )
                                    )
                                  }
                                />
                                {el.element_type === "quiz" ? (
                                  <GatheringDescriptionEditor
                                    key={`${el.id}-quiz-intro`}
                                    compact
                                    showHelper
                                    helperText={`Shown before the quiz. ${RICH_EDITOR_HELPER}`}
                                    label="Intro text (optional)"
                                    value={el.description_html}
                                    onChange={(html) =>
                                      setSessions((prev) =>
                                        prev.map((ss) =>
                                          ss.id !== s.id
                                            ? ss
                                            : {
                                                ...ss,
                                                elements: ss.elements.map((x) =>
                                                  x.id === el.id ? { ...x, description_html: html } : x
                                                ),
                                              }
                                        )
                                      )
                                    }
                                  />
                                ) : (
                                  <GatheringDescriptionEditor
                                    key={`${el.id}-block-desc`}
                                    label="Description (optional)"
                                    showHelper
                                    helperText={RICH_EDITOR_HELPER}
                                    value={el.description_html}
                                    onChange={(html) =>
                                      setSessions((prev) =>
                                        prev.map((ss) =>
                                          ss.id !== s.id
                                            ? ss
                                            : {
                                                ...ss,
                                                elements: ss.elements.map((x) =>
                                                  x.id === el.id ? { ...x, description_html: html } : x
                                                ),
                                              }
                                        )
                                      )
                                    }
                                  />
                                )}
                                {el.element_type === "video" ? (
                                  <TextField
                                    label="Video URL"
                                    fullWidth
                                    sx={{ mt: 1 }}
                                    value={(el.payload as { url?: string }).url ?? ""}
                                    onChange={(e) =>
                                      setSessions((prev) =>
                                        prev.map((ss) =>
                                          ss.id !== s.id
                                            ? ss
                                            : {
                                                ...ss,
                                                elements: ss.elements.map((x) =>
                                                  x.id === el.id
                                                    ? { ...x, payload: { url: e.target.value } }
                                                    : x
                                                ),
                                              }
                                        )
                                      )
                                    }
                                  />
                                ) : null}
                                {el.element_type === "pdf" ? (
                                  <Stack spacing={1} sx={{ mt: 1 }}>
                                    <TextField
                                      label="PDF URL"
                                      fullWidth
                                      value={(el.payload as { url?: string }).url ?? ""}
                                      onChange={(e) =>
                                        setSessions((prev) =>
                                          prev.map((ss) =>
                                            ss.id !== s.id
                                              ? ss
                                              : {
                                                  ...ss,
                                                  elements: ss.elements.map((x) =>
                                                    x.id === el.id
                                                      ? {
                                                          ...x,
                                                          payload: {
                                                            ...(x.payload as object),
                                                            url: e.target.value,
                                                          },
                                                        }
                                                      : x
                                                  ),
                                                }
                                          )
                                        )
                                      }
                                    />
                                    <TextField
                                      label="File name (display)"
                                      fullWidth
                                      value={(el.payload as { fileName?: string }).fileName ?? ""}
                                      onChange={(e) =>
                                        setSessions((prev) =>
                                          prev.map((ss) =>
                                            ss.id !== s.id
                                              ? ss
                                              : {
                                                  ...ss,
                                                  elements: ss.elements.map((x) =>
                                                    x.id === el.id
                                                      ? {
                                                          ...x,
                                                          payload: {
                                                            ...(x.payload as object),
                                                            fileName: e.target.value,
                                                          },
                                                        }
                                                      : x
                                                  ),
                                                }
                                          )
                                        )
                                      }
                                    />
                                  </Stack>
                                ) : null}
                                {el.element_type === "image" ? (
                                  <TextField
                                    label="Image URL"
                                    fullWidth
                                    sx={{ mt: 1 }}
                                    value={(el.payload as { url?: string }).url ?? ""}
                                    onChange={(e) =>
                                      setSessions((prev) =>
                                        prev.map((ss) =>
                                          ss.id !== s.id
                                            ? ss
                                            : {
                                                ...ss,
                                                elements: ss.elements.map((x) =>
                                                  x.id === el.id
                                                    ? { ...x, payload: { url: e.target.value } }
                                                    : x
                                                ),
                                              }
                                        )
                                      )
                                    }
                                  />
                                ) : null}
                                {el.element_type === "rich_text" ? (
                                  <Box sx={{ mt: 1 }}>
                                    <GatheringDescriptionEditor
                                      label="Block content"
                                      helperText={RICH_EDITOR_HELPER}
                                      value={(el.payload as { html?: string }).html ?? ""}
                                      onChange={(html) =>
                                        setSessions((prev) =>
                                          prev.map((ss) =>
                                            ss.id !== s.id
                                              ? ss
                                              : {
                                                  ...ss,
                                                  elements: ss.elements.map((x) =>
                                                    x.id === el.id ? { ...x, payload: { html } } : x
                                                  ),
                                                }
                                          )
                                        )
                                      }
                                    />
                                  </Box>
                                ) : null}
                                {el.element_type === "plain_text" ? (
                                  <TextField
                                    label="Text"
                                    fullWidth
                                    multiline
                                    minRows={3}
                                    sx={{ mt: 1 }}
                                    value={(el.payload as { text?: string }).text ?? ""}
                                    onChange={(e) =>
                                      setSessions((prev) =>
                                        prev.map((ss) =>
                                          ss.id !== s.id
                                            ? ss
                                            : {
                                                ...ss,
                                                elements: ss.elements.map((x) =>
                                                  x.id === el.id ? { ...x, payload: { text: e.target.value } } : x
                                                ),
                                              }
                                        )
                                      )
                                    }
                                  />
                                ) : null}
                                {el.element_type === "quiz" ? (
                                  <CourseQuizFormEditor
                                    payload={coerceQuizPayload(el.payload)}
                                    onPayloadChange={(qp) =>
                                      setSessions((prev) =>
                                        prev.map((ss) =>
                                          ss.id !== s.id
                                            ? ss
                                            : {
                                                ...ss,
                                                elements: ss.elements.map((x) =>
                                                  x.id === el.id ? { ...x, payload: qp } : x
                                                ),
                                              }
                                        )
                                      )
                                    }
                                  />
                                ) : null}
                      </Paper>
                    ))}

                    <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 1 }}>
                      <Button size="small" onClick={() => void addElement(s.id, "video")}>
                        + Video
                      </Button>
                      <Button size="small" onClick={() => void addElement(s.id, "rich_text")}>
                        + Rich text
                      </Button>
                      <Button size="small" onClick={() => void addElement(s.id, "plain_text")}>
                        + Plain text
                      </Button>
                      <Button size="small" onClick={() => void addElement(s.id, "pdf")}>
                        + PDF
                      </Button>
                      <Button size="small" onClick={() => void addElement(s.id, "image")}>
                        + Image
                      </Button>
                      <Button size="small" onClick={() => void addElement(s.id, "quiz")}>
                        + Quiz
                      </Button>
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              )}
            </SortableShell>
          ))}
        </SortableContext>
      </DndContext>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 2 }} alignItems={{ sm: "center" }}>
        <Button variant="contained" disabled={busy} onClick={() => void saveAll()}>
          {busy ? "Saving…" : "Save course"}
        </Button>
        <Button variant="outlined" color="error" disabled={busy} onClick={() => setDeleteCourseOpen(true)}>
          Delete course
        </Button>
      </Stack>

      <Dialog open={Boolean(deleteBlockTarget)} onClose={() => !busy && setDeleteBlockTarget(null)}>
        <DialogTitle>Delete content block?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This removes the block from the session. Learner progress tied to this block may be affected. This cannot
            be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteBlockTarget(null)} disabled={busy}>
            Cancel
          </Button>
          <Button color="error" variant="contained" disabled={busy} onClick={() => void confirmRemoveElement()}>
            Delete block
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteCourseOpen} onClose={() => !busy && setDeleteCourseOpen(false)}>
        <DialogTitle>Delete this course?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            All sessions and content blocks will be removed (cascade). Learner quiz results and progress linked to this
            course may be deleted. This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteCourseOpen(false)} disabled={busy}>
            Cancel
          </Button>
          <Button color="error" variant="contained" disabled={busy} onClick={() => void confirmDeleteCourse()}>
            Delete course
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
