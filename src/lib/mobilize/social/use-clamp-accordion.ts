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
function plainTextLikelyExceedsLines(plain: string | undefined, lineCount: number): boolean {
  const t = (plain ?? "").trim();
  if (!t) return false;
  const logicalLines = t.split(/\n/).filter((line) => line.trim().length > 0).length;
  if (logicalLines > lineCount) return true;
  // ~38 chars/line in the feed column at body2 size.
  return t.replace(/\s+/g, " ").length > lineCount * 38;
}

export function useClampAccordion(lineCount: number, plainHint?: string) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [needsCollapse, setNeedsCollapse] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [clampedH, setClampedH] = useState<number | null>(null);
  const [fullH, setFullH] = useState<number | null>(null);
  const [animating, setAnimating] = useState<null | "expanding" | "collapsing">(null);
  const [ready, setReady] = useState(false);
  // Mirrors `animating` so the ResizeObserver callback (which runs during the
  // max-height transition as the box shrinks/grows) never re-measures and
  // cancels the running transition by touching inline styles.
  const animatingRef = useRef(false);

  const measure = useCallback(() => {
    const el = ref.current;
    // Never re-measure while a transition is running: toggling inline styles
    // mid-animation cancels the transition and `transitionend` never fires.
    if (!el || animatingRef.current) return;

    const prev = {
      display: el.style.display,
      lineClamp: el.style.webkitLineClamp,
      boxOrient: el.style.webkitBoxOrient,
      overflow: el.style.overflow,
      maxHeight: el.style.maxHeight,
      transition: el.style.transition,
    };

    el.style.transition = "none";
    el.style.overflow = "visible";
    el.style.maxHeight = "none";
    el.style.display = prev.display || "";
    el.style.webkitLineClamp = "";
    el.style.webkitBoxOrient = "";
    const full = el.scrollHeight;

    el.style.display = "-webkit-box";
    el.style.webkitLineClamp = String(lineCount);
    el.style.webkitBoxOrient = "vertical";
    el.style.overflow = "hidden";
    const clampedMeasured = el.scrollHeight;

    el.style.display = prev.display;
    el.style.webkitLineClamp = prev.lineClamp;
    el.style.webkitBoxOrient = prev.boxOrient;
    el.style.overflow = prev.overflow;
    el.style.maxHeight = prev.maxHeight;
    el.style.transition = prev.transition;

    const cs = typeof window !== "undefined" ? window.getComputedStyle(el) : null;
    const fontSize = cs ? parseFloat(cs.fontSize) || 14 : 14;
    let lineHeightPx = cs ? parseFloat(cs.lineHeight) : NaN;
    if (!Number.isFinite(lineHeightPx) || lineHeightPx <= 0) {
      lineHeightPx = fontSize * 1.45;
    }
    const clampedFallback = Math.ceil(lineHeightPx * lineCount);
    const clamped = Math.max(clampedMeasured, clampedFallback);

    setClampedH(clamped);
    setFullH(full);
    setNeedsCollapse(
      full > clamped + 2 || plainTextLikelyExceedsLines(plainHint, lineCount)
    );
  }, [lineCount, plainHint]);

  useEffect(() => {
    measure();
    const el = ref.current;
    if (!el) return;
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    const imgs = el.querySelectorAll("img");
    const onImg = () => measure();
    imgs.forEach((img) => img.addEventListener("load", onImg));
    const fonts = document.fonts;
    void fonts?.ready?.then(() => measure());
    return () => {
      ro?.disconnect();
      imgs.forEach((img) => img.removeEventListener("load", onImg));
    };
  }, [measure]);

  // Enable CSS transitions only after the initial measurement has settled,
  // so the first paint does not animate from 0.
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, [needsCollapse]);

  // Safety net: if the browser cancels the transition for any reason, release
  // the animating lock so the toggle button keeps working.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onCancel = (e: TransitionEvent) => {
      if (e.target !== el || e.propertyName !== "max-height") return;
      animatingRef.current = false;
      setAnimating(null);
    };
    el.addEventListener("transitioncancel", onCancel);
    return () => el.removeEventListener("transitioncancel", onCancel);
  }, []);

  const toggle = useCallback(() => {
    if (!needsCollapse || animatingRef.current) return;
    animatingRef.current = true;
    setExpanded((v) => !v);
    setAnimating(expanded ? "collapsing" : "expanding");
  }, [needsCollapse, expanded]);

  const onTransitionEnd = useCallback((e: React.TransitionEvent<HTMLDivElement>) => {
    if (e.target !== ref.current || e.propertyName !== "max-height") return;
    animatingRef.current = false;
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
    showClamp: collapsed && animating !== "collapsing",
    toggle,
    onTransitionEnd,
  };
}
