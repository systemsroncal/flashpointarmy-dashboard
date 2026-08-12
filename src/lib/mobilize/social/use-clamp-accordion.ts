"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export const CLAMP_ACCORDION_TRANSITION = "max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1)";

/**
 * Accordion-style expand/collapse for text clamped with -webkit-line-clamp.
 *
 * The container height animates via `max-height` between the clamped height
 * and the full content height. The line-clamp is only applied in the collapsed
 * resting state so the animation can reveal / clip the text smoothly; during
 * the collapse animation the text is clipped by `overflow: hidden` instead.
 *
 * Usage:
 *   const a = useClampAccordion(5);
 *   <Box ref={a.ref} onTransitionEnd={a.onTransitionEnd}
 *        sx={{ overflow: "hidden", maxHeight: a.maxHeight ?? "none",
 *              transition: a.ready && a.needsCollapse ? CLAMP_ACCORDION_TRANSITION : "none",
 *              ...(a.showClamp ? clampSx : {}) }}>
 *     {text}
 *   </Box>
 *   {a.needsCollapse && <Button onClick={a.toggle}>{a.expanded ? "Less" : "More"}</Button>}
 */
export function useClampAccordion(lineCount: number) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [needsCollapse, setNeedsCollapse] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [clampedH, setClampedH] = useState<number | null>(null);
  const [fullH, setFullH] = useState<number | null>(null);
  const [animating, setAnimating] = useState<null | "expanding" | "collapsing">(null);
  const [ready, setReady] = useState(false);

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;

    const prev = {
      display: el.style.display,
      lineClamp: el.style.webkitLineClamp,
      boxOrient: el.style.webkitBoxOrient,
      overflow: el.style.overflow,
      maxHeight: el.style.maxHeight,
      transition: el.style.transition,
    };

    el.style.transition = "none";
    el.style.display = "-webkit-box";
    el.style.webkitLineClamp = String(lineCount);
    el.style.webkitBoxOrient = "vertical";
    el.style.overflow = "hidden";
    el.style.maxHeight = "none";
    const clamped = el.scrollHeight;
    el.style.webkitLineClamp = "unset";
    const full = el.scrollHeight;

    el.style.display = prev.display;
    el.style.webkitLineClamp = prev.lineClamp;
    el.style.webkitBoxOrient = prev.boxOrient;
    el.style.overflow = prev.overflow;
    el.style.maxHeight = prev.maxHeight;
    el.style.transition = prev.transition;

    setClampedH(clamped);
    setFullH(full);
    setNeedsCollapse(full > clamped + 4);
  }, [lineCount]);

  useEffect(() => {
    measure();
    const el = ref.current;
    if (!el) return;
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    return () => ro?.disconnect();
  }, [measure]);

  // Enable CSS transitions only after the initial measurement has settled,
  // so the first paint does not animate from 0.
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, [needsCollapse]);

  const toggle = useCallback(() => {
    if (!needsCollapse || animating) return;
    setExpanded((v) => !v);
    setAnimating(expanded ? "collapsing" : "expanding");
  }, [needsCollapse, animating, expanded]);

  const onTransitionEnd = useCallback((e: React.TransitionEvent<HTMLDivElement>) => {
    if (e.target !== ref.current || e.propertyName !== "max-height") return;
    setAnimating(null);
  }, []);

  const collapsed = needsCollapse && !expanded;

  return {
    ref,
    ready,
    needsCollapse,
    expanded,
    collapsed,
    /** `maxHeight` value to apply (undefined when no collapse is needed). */
    maxHeight: needsCollapse ? (collapsed ? clampedH : fullH) : undefined,
    /** Apply the line-clamp (and fade) only in the collapsed resting state. */
    showClamp: collapsed && animating !== "collapsing",
    toggle,
    onTransitionEnd,
  };
}
