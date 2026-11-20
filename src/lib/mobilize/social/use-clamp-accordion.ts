"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

export const CLAMP_ACCORDION_TRANSITION = "max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1)";

export type ClampAccordionMode = "line-clamp" | "max-height";

type ClampOptions = {
  /** Feed posts: line-clamp (full lines). Comments: max-height accordion. */
  mode?: ClampAccordionMode;
};

const lineClampProbe = {
  display: "-webkit-box",
  webkitLineClamp: "",
  webkitBoxOrient: "vertical",
  overflow: "hidden",
} as const;

function plainTextLikelyExceedsLines(plain: string | undefined, lineCount: number): boolean {
  const t = (plain ?? "").trim();
  if (!t) return false;
  const logicalLines = t.split(/\n/).filter((line) => line.trim().length > 0).length;
  if (logicalLines > lineCount) return true;
  return t.replace(/\s+/g, " ").length > lineCount * 38;
}

function captureBoxStyle(el: HTMLElement) {
  return {
    display: el.style.display,
    lineClamp: el.style.webkitLineClamp,
    boxOrient: el.style.webkitBoxOrient,
    overflow: el.style.overflow,
    maxHeight: el.style.maxHeight,
    transition: el.style.transition,
  };
}

function restoreBoxStyle(
  el: HTMLElement,
  prev: ReturnType<typeof captureBoxStyle>
) {
  el.style.display = prev.display;
  el.style.webkitLineClamp = prev.lineClamp;
  el.style.webkitBoxOrient = prev.boxOrient;
  el.style.overflow = prev.overflow;
  el.style.maxHeight = prev.maxHeight;
  el.style.transition = prev.transition;
}

function clampTarget(el: HTMLElement): HTMLElement {
  return (
    el.querySelector<HTMLElement>(".mobilize-feed-html") ??
    el.querySelector<HTMLElement>(".mobilize-feed-plain") ??
    el
  );
}

function measureLineClampHeights(el: HTMLElement, lineCount: number) {
  const target = clampTarget(el);
  const prev = captureBoxStyle(target);
  target.style.transition = "none";
  target.style.maxHeight = "none";
  target.style.overflow = "visible";
  target.style.display = "";
  target.style.webkitLineClamp = "";
  target.style.webkitBoxOrient = "";
  const full = target.scrollHeight;

  target.style.display = lineClampProbe.display;
  target.style.webkitLineClamp = String(lineCount);
  target.style.webkitBoxOrient = lineClampProbe.webkitBoxOrient;
  target.style.overflow = lineClampProbe.overflow;
  const clamped = Math.ceil(target.getBoundingClientRect().height);
  restoreBoxStyle(target, prev);

  return { full, clamped };
}

function measureMaxHeightClamp(el: HTMLElement, lineCount: number) {
  const measureRoot = el.querySelector<HTMLElement>(".mobilize-feed-html") ?? el;
  const prev = captureBoxStyle(el);
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
  const clamped = Math.ceil(lineHeightPx * lineCount);
  restoreBoxStyle(el, prev);

  return { full, clamped };
}

export function useClampAccordion(
  lineCount: number,
  plainHint?: string,
  options?: ClampOptions
) {
  const mode: ClampAccordionMode = options?.mode ?? "max-height";
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

    const { full, clamped } =
      mode === "line-clamp"
        ? measureLineClampHeights(el, lineCount)
        : measureMaxHeightClamp(el, lineCount);

    const domOverflow = full > clamped + 1;
    const plainOverflow = plainTextLikelyExceedsLines(plainHint, lineCount);

    setClampedH(clamped);
    setFullH(full);
    setNeedsCollapse(domOverflow || (plainOverflow && full > clamped));
  }, [lineCount, plainHint, mode]);

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
    if (mode !== "max-height") return;
    const el = ref.current;
    if (!el) return;
    const onCancel = (e: TransitionEvent) => {
      if (e.target !== el || e.propertyName !== "max-height") return;
      animatingRef.current = false;
      setAnimating(null);
    };
    el.addEventListener("transitioncancel", onCancel);
    return () => el.removeEventListener("transitioncancel", onCancel);
  }, [mode]);

  useEffect(() => {
    if (mode !== "max-height" || !animating || clampedH == null || fullH == null) return;
    if (Math.abs(fullH - clampedH) < 3) {
      animatingRef.current = false;
      setAnimating(null);
    }
  }, [animating, clampedH, fullH, mode]);

  const toggle = useCallback(() => {
    if (!needsCollapse || animatingRef.current) return;

    if (mode === "line-clamp") {
      setExpanded((v) => !v);
      return;
    }

    if (clampedH != null && fullH != null && Math.abs(fullH - clampedH) < 3) {
      setExpanded((v) => !v);
      return;
    }
    animatingRef.current = true;
    setExpanded((v) => !v);
    setAnimating(expanded ? "collapsing" : "expanding");
  }, [needsCollapse, expanded, clampedH, fullH, mode]);

  const onTransitionEnd = useCallback((e: React.TransitionEvent<HTMLDivElement>) => {
    if (mode !== "max-height") return;
    if (e.target !== ref.current || e.propertyName !== "max-height") return;
    animatingRef.current = false;
    setAnimating(null);
  }, [mode]);

  const collapsed = needsCollapse && !expanded;

  const showClamp =
    mode === "line-clamp"
      ? collapsed
      : collapsed && animating !== "collapsing";

  const maxHeight =
    mode === "line-clamp"
      ? undefined
      : needsCollapse && clampedH != null && fullH != null
        ? collapsed
          ? clampedH
          : fullH
        : undefined;

  return {
    ref,
    ready,
    needsCollapse,
    expanded,
    collapsed,
    maxHeight,
    showClamp,
    toggle,
    onTransitionEnd,
  };
}