"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

export const CLAMP_ACCORDION_TRANSITION = "max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1)";

/**
 * Accordion-style expand/collapse for feed text (rich HTML uses max-height;
 * line-clamp on a wrapper is unreliable with nested `<p>` blocks).
 */
function plainTextLikelyExceedsLines(plain: string | undefined, lineCount: number): boolean {
  const t = (plain ?? "").trim();
  if (!t) return false;
  const logicalLines = t.split(/\n/).filter((line) => line.trim().length > 0).length;
  if (logicalLines > lineCount) return true;
  return t.replace(/\s+/g, " ").length > lineCount * 38;
}

function measureClampHeights(el: HTMLElement, lineCount: number) {
  const measureRoot = el.querySelector<HTMLElement>(".mobilize-feed-html") ?? el;

  const prev = {
    maxHeight: el.style.maxHeight,
    overflow: el.style.overflow,
    transition: el.style.transition,
  };

  el.style.transition = "none";
  el.style.overflow = "visible";
  el.style.maxHeight = "none";
  const full = el.scrollHeight;

  const cs = typeof window !== "undefined" ? window.getComputedStyle(measureRoot) : null;
  const fontSize = cs ? parseFloat(cs.fontSize) || 15 : 15;
  let lineHeightPx = cs ? parseFloat(cs.lineHeight) : NaN;
  if (!Number.isFinite(lineHeightPx) || lineHeightPx <= 0) {
    lineHeightPx = fontSize * 1.45;
  }

  // Extra room for paragraph gaps in pasted HTML (`mb` on `<p>`).
  const pCount = el.querySelectorAll(".mobilize-feed-html p").length;
  const paragraphGap = pCount > 1 ? Math.min(pCount - 1, lineCount) * (fontSize * 0.42) : 0;
  const clamped = Math.ceil(lineHeightPx * lineCount + paragraphGap + 2);

  el.style.maxHeight = prev.maxHeight;
  el.style.overflow = prev.overflow;
  el.style.transition = prev.transition;

  return { full, clamped };
}

export function useClampAccordion(lineCount: number, plainHint?: string) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [needsCollapse, setNeedsCollapse] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [clampedH, setClampedH] = useState<number | null>(null);
  const [fullH, setFullH] = useState<number | null>(null);
  const [animating, setAnimating] = useState<null | "expanding" | "collapsing">(null);
  const [ready, setReady] = useState(false);
  const animatingRef = useRef(false);

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el || animatingRef.current) return;

    const { full, clamped } = measureClampHeights(el, lineCount);
    const domOverflow = full > clamped + 2;
    const plainOverflow = plainTextLikelyExceedsLines(plainHint, lineCount);

    setClampedH(clamped);
    setFullH(full);
    setNeedsCollapse(domOverflow || (plainOverflow && full > clamped));
  }, [lineCount, plainHint]);

  useLayoutEffect(() => {
    measure();
  }, [measure]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    const imgs = el.querySelectorAll("img");
    const onImg = () => measure();
    imgs.forEach((img) => img.addEventListener("load", onImg));
    void document.fonts?.ready?.then(() => measure());
    return () => {
      ro?.disconnect();
      imgs.forEach((img) => img.removeEventListener("load", onImg));
    };
  }, [measure]);

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, [needsCollapse]);

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

  // If heights are equal, skip waiting for a transition that will never run.
  useEffect(() => {
    if (!animating || clampedH == null || fullH == null) return;
    if (Math.abs(fullH - clampedH) < 3) {
      animatingRef.current = false;
      setAnimating(null);
    }
  }, [animating, clampedH, fullH]);

  const toggle = useCallback(() => {
    if (!needsCollapse || animatingRef.current) return;
    if (clampedH != null && fullH != null && Math.abs(fullH - clampedH) < 3) {
      setExpanded((v) => !v);
      return;
    }
    animatingRef.current = true;
    setExpanded((v) => !v);
    setAnimating(expanded ? "collapsing" : "expanding");
  }, [needsCollapse, expanded, clampedH, fullH]);

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
    maxHeight:
      needsCollapse && clampedH != null && fullH != null
        ? collapsed
          ? clampedH
          : fullH
        : undefined,
    /** Max-height clipping only (rich HTML). */
    showClamp: false,
    toggle,
    onTransitionEnd,
  };
}