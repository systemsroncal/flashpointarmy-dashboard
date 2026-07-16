"use client";

import { GatheringDescriptionEditor } from "@/components/dashboard/gatherings/GatheringDescriptionEditor";
import { MobilizeFeedAdImageDropzone } from "@/components/mobilize/feed-ads/MobilizeFeedAdImageDropzone";
import type {
  MobilizeFeedAdBlock,
  MobilizeFeedAdCarouselBlock,
  MobilizeFeedAdCarouselSlide,
  MobilizeFeedAdImageBlock,
  MobilizeFeedAdRichTextBlock,
} from "@/lib/mobilize/feed-ads-types";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import AddIcon from "@mui/icons-material/Add";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import ImageIcon from "@mui/icons-material/Image";
import SlideshowIcon from "@mui/icons-material/Slideshow";
import TextFieldsIcon from "@mui/icons-material/TextFields";
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";

function newId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `ad-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function withSortOrder(blocks: MobilizeFeedAdBlock[]): MobilizeFeedAdBlock[] {
  return blocks.map((b, i) => ({ ...b, sort_order: i }));
}

function blockLabel(block: MobilizeFeedAdBlock): string {
  if (block.type === "image") return "Single image";
  if (block.type === "carousel") return `Carousel (${block.slides.length} slides)`;
  return "Rich text";
}

function SortableAdShell({
  id,
  children,
}: {
  id: string;
  children: (handleProps: Record<string, unknown>) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <Box ref={setNodeRef} style={style}>
      {children({ ...attributes, ...listeners })}
    </Box>
  );
}

function LinkTargetFields({
  href,
  className,
  elementId,
  onHref,
  onClassName,
  onElementId,
  disabled,
  showHref = true,
}: {
  href: string;
  className: string;
  elementId: string;
  onHref: (v: string) => void;
  onClassName: (v: string) => void;
  onElementId: (v: string) => void;
  disabled?: boolean;
  showHref?: boolean;
}) {
  return (
    <Stack spacing={1.5}>
      {showHref ? (
        <TextField
          size="small"
          fullWidth
          label="Link target (href)"
          placeholder="https://… or /dashboard/…"
          value={href}
          onChange={(e) => onHref(e.target.value)}
          disabled={disabled}
        />
      ) : null}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
        <TextField
          size="small"
          fullWidth
          label="CSS class name"
          value={className}
          onChange={(e) => onClassName(e.target.value)}
          disabled={disabled}
        />
        <TextField
          size="small"
          fullWidth
          label="Element id"
          value={elementId}
          onChange={(e) => onElementId(e.target.value)}
          disabled={disabled}
        />
      </Stack>
    </Stack>
  );
}

export function MobilizeFeedAdsSettingsForm() {
  const [items, setItems] = useState<MobilizeFeedAdBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedOk, setSavedOk] = useState(false);

  const dndId = "mobilize-feed-ads-dnd";
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/mobilize/feed-ads");
      const j = (await res.json()) as { items?: MobilizeFeedAdBlock[]; error?: string };
      if (!res.ok) throw new Error(j.error || "Failed to load ads.");
      setItems(j.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const itemIds = useMemo(() => items.map((b) => b.id), [items]);

  function reorder(from: number, to: number) {
    if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return;
    setItems((prev) => withSortOrder(arrayMove(prev, from, to)));
  }

  function onDragEnd(ev: DragEndEvent) {
    const { active, over } = ev;
    if (!over || active.id === over.id) return;
    const from = items.findIndex((b) => b.id === active.id);
    const to = items.findIndex((b) => b.id === over.id);
    reorder(from, to);
  }

  function addBlock(type: MobilizeFeedAdBlock["type"]) {
    const sort_order = items.length;
    let block: MobilizeFeedAdBlock;
    if (type === "image") {
      block = {
        id: newId(),
        type: "image",
        sort_order,
        image_url: "",
        href: "",
      } satisfies MobilizeFeedAdImageBlock;
    } else if (type === "carousel") {
      block = {
        id: newId(),
        type: "carousel",
        sort_order,
        slides: [{ image_url: "", href: "" }],
      } satisfies MobilizeFeedAdCarouselBlock;
    } else {
      block = {
        id: newId(),
        type: "rich_text",
        sort_order,
        html: "",
      } satisfies MobilizeFeedAdRichTextBlock;
    }
    setItems((prev) => withSortOrder([...prev, block]));
  }

  function updateBlock(id: string, patch: Partial<MobilizeFeedAdBlock>) {
    setItems((prev) =>
      prev.map((b) => (b.id === id ? ({ ...b, ...patch } as MobilizeFeedAdBlock) : b))
    );
  }

  function removeBlock(id: string) {
    setItems((prev) => withSortOrder(prev.filter((b) => b.id !== id)));
  }

  async function save() {
    setSaving(true);
    setError(null);
    setSavedOk(false);
    try {
      const payload = withSortOrder(items);
      const res = await fetch("/api/mobilize/feed-ads", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: payload }),
      });
      const j = (await res.json()) as { items?: MobilizeFeedAdBlock[]; error?: string };
      if (!res.ok) throw new Error(j.error || "Save failed.");
      setItems(j.items ?? payload);
      setSavedOk(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Paper sx={{ p: 3, bgcolor: "#fafafa", border: "1px solid rgba(0,0,0,0.1)" }}>
      <Typography variant="h6" fontWeight={700} gutterBottom>
        Group feed sidebar ads
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Blocks appear in the right column of group feed pages. Drag items to reorder, or use the arrow
        buttons. Empty or invalid blocks are omitted on the live feed.
      </Typography>

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}
      {savedOk ? (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSavedOk(false)}>
          Ads saved.
        </Alert>
      ) : null}

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
        <Button
          size="small"
          variant="outlined"
          startIcon={<ImageIcon />}
          onClick={() => addBlock("image")}
          disabled={loading || saving}
        >
          Add image
        </Button>
        <Button
          size="small"
          variant="outlined"
          startIcon={<SlideshowIcon />}
          onClick={() => addBlock("carousel")}
          disabled={loading || saving}
        >
          Add carousel
        </Button>
        <Button
          size="small"
          variant="outlined"
          startIcon={<TextFieldsIcon />}
          onClick={() => addBlock("rich_text")}
          disabled={loading || saving}
        >
          Add rich text
        </Button>
      </Stack>

      <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          <Stack spacing={1.5}>
            {items.map((block, index) => (
              <SortableAdShell key={block.id} id={block.id}>
                {(handle) => (
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: "#fff" }}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                      <DragIndicatorIcon
                        sx={{ cursor: "grab", color: "text.secondary", flexShrink: 0 }}
                        {...handle}
                      />
                      <Chip size="small" label={blockLabel(block)} />
                      <Box sx={{ flex: 1 }} />
                      <IconButton
                        size="small"
                        aria-label="Move up"
                        disabled={index === 0 || saving}
                        onClick={() => reorder(index, index - 1)}
                      >
                        <ArrowUpwardIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        aria-label="Move down"
                        disabled={index === items.length - 1 || saving}
                        onClick={() => reorder(index, index + 1)}
                      >
                        <ArrowDownwardIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        aria-label="Remove block"
                        disabled={saving}
                        onClick={() => removeBlock(block.id)}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Stack>

                    {block.type === "image" ? (
                      <Stack spacing={2}>
                        <MobilizeFeedAdImageDropzone
                          value={block.image_url}
                          onChange={(url) => updateBlock(block.id, { image_url: url })}
                          disabled={loading || saving}
                        />
                        <LinkTargetFields
                          href={block.href}
                          className={block.className ?? ""}
                          elementId={block.elementId ?? ""}
                          onHref={(href) => updateBlock(block.id, { href })}
                          onClassName={(className) => updateBlock(block.id, { className })}
                          onElementId={(elementId) => updateBlock(block.id, { elementId })}
                          disabled={loading || saving}
                        />
                      </Stack>
                    ) : null}

                    {block.type === "carousel" ? (
                      <Stack spacing={2}>
                        <LinkTargetFields
                          href=""
                          className={block.className ?? ""}
                          elementId={block.elementId ?? ""}
                          onHref={() => {}}
                          onClassName={(className) => updateBlock(block.id, { className })}
                          onElementId={(elementId) => updateBlock(block.id, { elementId })}
                          disabled={loading || saving}
                          showHref={false}
                        />
                        <Typography variant="subtitle2" fontWeight={700}>
                          Slides
                        </Typography>
                        {block.slides.map((slide, slideIdx) => (
                          <Paper key={slideIdx} variant="outlined" sx={{ p: 1.5, bgcolor: "#fafafa" }}>
                            <Stack spacing={1.5}>
                              <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Typography variant="caption" fontWeight={700}>
                                  Slide {slideIdx + 1}
                                </Typography>
                                {block.slides.length > 1 ? (
                                  <IconButton
                                    size="small"
                                    color="error"
                                    aria-label="Remove slide"
                                    disabled={saving}
                                    onClick={() => {
                                      const slides = block.slides.filter((_, i) => i !== slideIdx);
                                      updateBlock(block.id, { slides } as Partial<MobilizeFeedAdCarouselBlock>);
                                    }}
                                  >
                                    <DeleteOutlineIcon fontSize="small" />
                                  </IconButton>
                                ) : null}
                              </Stack>
                              <MobilizeFeedAdImageDropzone
                                value={slide.image_url}
                                onChange={(image_url) => {
                                  const slides = block.slides.map((s, i) =>
                                    i === slideIdx ? { ...s, image_url } : s
                                  );
                                  updateBlock(block.id, { slides } as Partial<MobilizeFeedAdCarouselBlock>);
                                }}
                                disabled={loading || saving}
                              />
                              <LinkTargetFields
                                href={slide.href}
                                className={slide.className ?? ""}
                                elementId={slide.elementId ?? ""}
                                onHref={(href) => {
                                  const slides = block.slides.map((s, i) =>
                                    i === slideIdx ? { ...s, href } : s
                                  );
                                  updateBlock(block.id, { slides } as Partial<MobilizeFeedAdCarouselBlock>);
                                }}
                                onClassName={(className) => {
                                  const slides = block.slides.map((s, i) =>
                                    i === slideIdx ? { ...s, className } : s
                                  );
                                  updateBlock(block.id, { slides } as Partial<MobilizeFeedAdCarouselBlock>);
                                }}
                                onElementId={(elementId) => {
                                  const slides = block.slides.map((s, i) =>
                                    i === slideIdx ? { ...s, elementId } : s
                                  );
                                  updateBlock(block.id, { slides } as Partial<MobilizeFeedAdCarouselBlock>);
                                }}
                                disabled={loading || saving}
                              />
                            </Stack>
                          </Paper>
                        ))}
                        <Button
                          size="small"
                          startIcon={<AddIcon />}
                          onClick={() => {
                            const slides: MobilizeFeedAdCarouselSlide[] = [
                              ...block.slides,
                              { image_url: "", href: "" },
                            ];
                            updateBlock(block.id, { slides } as Partial<MobilizeFeedAdCarouselBlock>);
                          }}
                          disabled={loading || saving || block.slides.length >= 12}
                        >
                          Add slide
                        </Button>
                      </Stack>
                    ) : null}

                    {block.type === "rich_text" ? (
                      <Stack spacing={2}>
                        <GatheringDescriptionEditor
                          value={block.html}
                          onChange={(html) => updateBlock(block.id, { html })}
                          label="Content"
                          showHelper={false}
                          compact
                        />
                        <LinkTargetFields
                          href=""
                          className={block.className ?? ""}
                          elementId={block.elementId ?? ""}
                          onHref={() => {}}
                          onClassName={(className) => updateBlock(block.id, { className })}
                          onElementId={(elementId) => updateBlock(block.id, { elementId })}
                          disabled={loading || saving}
                          showHref={false}
                        />
                      </Stack>
                    ) : null}
                  </Paper>
                )}
              </SortableAdShell>
            ))}
          </Stack>
        </SortableContext>
      </DndContext>

      {!items.length && !loading ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          No ad blocks yet. Add an image banner, event carousel, or rich text promo above.
        </Typography>
      ) : null}

      <Button
        variant="contained"
        sx={{ mt: 3 }}
        onClick={() => void save()}
        disabled={loading || saving}
      >
        {saving ? "Saving…" : "Save ads"}
      </Button>
    </Paper>
  );
}
