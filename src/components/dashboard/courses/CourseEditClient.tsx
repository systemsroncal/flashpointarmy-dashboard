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
      promptHtml: "<p>Ejemplo: verdadero o falso.</p>",
      points: 10,
      correctTrue: true,
      trueLabelHtml: "<span>Verdadero</span>",
      falseLabelHtml: "<span>Falso</span>",
    },
  ],
});

const RICH_EDITOR_HELPER_ES =
  "TinyMCE autohospedado (GPL). El formato se guarda como HTML. Para imágenes, usa enlaces HTTPS.";

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
        setErr("El slug es obligatorio.");
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

      setMsg("Guardado.");
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "No se pudo guardar.");
    } finally {
      setBusy(false);
    }
  }

  async function addSession() {
    const t = window.prompt("Título de la nueva sesión:");
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
      setErr(error?.message ?? "No se pudo añadir la sesión.");
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
      setErr(error?.message ?? "No se pudo añadir el bloque.");
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

  async function removeElement(sessionId: string, elementId: string) {
    if (!window.confirm("¿Eliminar este bloque?")) return;
    const { error } = await supabase.from("course_elements").delete().eq("id", elementId);
    if (error) {
      setErr(error.message);
      return;
    }
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? { ...s, elements: s.elements.filter((e) => e.id !== elementId).map((e, i) => ({ ...e, sort_order: i })) }
          : s
      )
    );
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ color: "primary.main", mb: 2 }}>
        Editar curso
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
        <TextField label="Título" value={title} onChange={(e) => setTitle(e.target.value)} fullWidth />
        <TextField label="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} fullWidth />
        <TextField label="Subtítulo" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} fullWidth />
        <TextField
          select
          label="Autor"
          value={author?.id ?? ""}
          onChange={(e) => {
            const id = e.target.value;
            setAuthor(authorOptions.find((a) => a.id === id) ?? null);
          }}
          SelectProps={{ displayEmpty: true }}
          fullWidth
        >
          <MenuItem value="">
            <em>Etiqueta predeterminada (equipo FlashPoint)</em>
          </MenuItem>
          {authorOptions.map((a) => (
            <MenuItem key={a.id} value={a.id}>
              {a.label}
            </MenuItem>
          ))}
        </TextField>
        <Stack direction="row" spacing={2}>
          <Button variant={published ? "contained" : "outlined"} onClick={() => setPublished((p) => !p)}>
            {published ? "Publicado" : "Borrador"}
          </Button>
          <Button variant={appliesGrades ? "contained" : "outlined"} onClick={() => setAppliesGrades((p) => !p)}>
            {appliesGrades ? "Calificaciones activadas" : "Calificaciones desactivadas"}
          </Button>
        </Stack>
      </Stack>

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
        <Typography variant="subtitle1" fontWeight={800}>
          Sesiones (arrastra para reordenar)
        </Typography>
        <Button startIcon={<AddIcon />} onClick={() => void addSession()}>
          Añadir sesión
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
                    <Typography fontWeight={700}>{s.title || "(sesión sin título)"}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                      <DragIndicatorIcon sx={{ cursor: "grab", color: "text.secondary" }} {...handle} />
                      <Typography variant="caption" color="text.secondary">
                        Arrastra el icono para reordenar las sesiones
                      </Typography>
                    </Box>
                    <Stack spacing={1.5} sx={{ mb: 2 }}>
                      <TextField
                        label="Título de la sesión"
                        value={s.title}
                        onChange={(e) =>
                          setSessions((prev) =>
                            prev.map((x) => (x.id === s.id ? { ...x, title: e.target.value } : x))
                          )
                        }
                        fullWidth
                      />
                      <TextField
                        label="Slug de la sesión"
                        value={s.slug}
                        onChange={(e) =>
                          setSessions((prev) =>
                            prev.map((x) => (x.id === s.id ? { ...x, slug: e.target.value } : x))
                          )
                        }
                        fullWidth
                      />
                      <TextField
                        label="Subtítulo"
                        value={s.subtitle}
                        onChange={(e) =>
                          setSessions((prev) =>
                            prev.map((x) => (x.id === s.id ? { ...x, subtitle: e.target.value } : x))
                          )
                        }
                        fullWidth
                      />
                      <TextField
                        label="URL de imagen de portada"
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
                      Bloques de contenido (arrastra el bloque o usa ↑ ↓)
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
                                    aria-label="Subir bloque"
                                    disabled={elIdx === 0}
                                    onClick={() => moveElement(s.id, el.id, -1)}
                                  >
                                    <KeyboardArrowUpIcon />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    aria-label="Bajar bloque"
                                    disabled={elIdx === s.elements.length - 1}
                                    onClick={() => moveElement(s.id, el.id, 1)}
                                  >
                                    <KeyboardArrowDownIcon />
                                  </IconButton>
                                  <FormControl size="small" sx={{ minWidth: 160 }}>
                                    <InputLabel>Tipo de bloque</InputLabel>
                                    <Select
                                      label="Tipo de bloque"
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
                                      <MenuItem value="plain_text">Texto plano</MenuItem>
                                      <MenuItem value="rich_text">Texto enriquecido</MenuItem>
                                      <MenuItem value="video">Vídeo</MenuItem>
                                      <MenuItem value="pdf">PDF</MenuItem>
                                      <MenuItem value="image">Imagen</MenuItem>
                                      <MenuItem value="quiz">Cuestionario</MenuItem>
                                    </Select>
                                  </FormControl>
                                  <Button color="error" size="small" onClick={() => void removeElement(s.id, el.id)}>
                                    <DeleteOutlineIcon fontSize="small" />
                                  </Button>
                                </Box>
                                <GatheringDescriptionEditor
                                  key={`${el.id}-block-title`}
                                  compact
                                  showHelper={false}
                                  label="Título del bloque (opcional)"
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
                                    helperText={`Lo verán antes del cuestionario. ${RICH_EDITOR_HELPER_ES}`}
                                    label="Texto introductorio (opcional)"
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
                                    label="Descripción (opcional)"
                                    showHelper
                                    helperText={RICH_EDITOR_HELPER_ES}
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
                                    label="URL del vídeo"
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
                                      label="URL del PDF"
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
                                      label="Nombre del archivo (visible)"
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
                                    label="URL de la imagen"
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
                                      label="Contenido del bloque"
                                      helperText={RICH_EDITOR_HELPER_ES}
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
                                    label="Texto"
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
                        + Vídeo
                      </Button>
                      <Button size="small" onClick={() => void addElement(s.id, "rich_text")}>
                        + Texto enriquecido
                      </Button>
                      <Button size="small" onClick={() => void addElement(s.id, "plain_text")}>
                        + Texto plano
                      </Button>
                      <Button size="small" onClick={() => void addElement(s.id, "pdf")}>
                        + PDF
                      </Button>
                      <Button size="small" onClick={() => void addElement(s.id, "image")}>
                        + Imagen
                      </Button>
                      <Button size="small" onClick={() => void addElement(s.id, "quiz")}>
                        + Cuestionario
                      </Button>
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              )}
            </SortableShell>
          ))}
        </SortableContext>
      </DndContext>

      <Button variant="contained" sx={{ mt: 2 }} disabled={busy} onClick={() => void saveAll()}>
        {busy ? "Guardando…" : "Guardar curso"}
      </Button>
    </Box>
  );
}
