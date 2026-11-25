"use client";

import { useEffect, useState } from "react";

export type MobilizeHeaderSurfaceMode = "light" | "cover-hero";

/** Fallback when the cover sentinel is not mounted yet. */
export const MOBILIZE_COVER_HERO_LIGHT_SURFACE_SCROLL_PX = 132;

const HERO_END_SELECTOR = "[data-mobilize-hero-end]";
const HEADER_ROOT_MARGIN_TOP_PX = 58;

/**
 * Mobilize profile / group mobile toolbar: light icons on dark cover (Facebook-style),
 * dark icons on white content after scroll. Uses a cover sentinel when present.
 */
export function useMobilizeHeaderOnLightSurface(
  enabled: boolean,
  mode: MobilizeHeaderSurfaceMode,
  heroLightSurfaceScrollPx = MOBILIZE_COVER_HERO_LIGHT_SURFACE_SCROLL_PX
): boolean {
  const [onLightSurface, setOnLightSurface] = useState(mode === "light");

  useEffect(() => {
    if (!enabled) {
      setOnLightSurface(false);
      return;
    }
    if (mode === "light") {
      setOnLightSurface(true);
      return;
    }

    setOnLightSurface(false);

    let observer: IntersectionObserver | null = null;
    let scrollListener: (() => void) | null = null;

    const detachScroll = () => {
      if (scrollListener) {
        window.removeEventListener("scroll", scrollListener);
        scrollListener = null;
      }
    };

    const attachScrollFallback = () => {
      if (scrollListener) return;
      const sync = () => {
        setOnLightSurface(window.scrollY >= heroLightSurfaceScrollPx);
      };
      sync();
      scrollListener = sync;
      window.addEventListener("scroll", sync, { passive: true });
    };

    const attachIntersection = (el: Element) => {
      observer?.disconnect();
      detachScroll();
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry) setOnLightSurface(!entry.isIntersecting);
        },
        {
          root: null,
          rootMargin: `-${HEADER_ROOT_MARGIN_TOP_PX}px 0px 0px 0px`,
          threshold: 0,
        }
      );
      observer.observe(el);
    };

    const tryAttach = () => {
      const el = document.querySelector(HERO_END_SELECTOR);
      if (el) {
        attachIntersection(el);
        return true;
      }
      return false;
    };

    if (!tryAttach()) {
      attachScrollFallback();
    }

    const mo = new MutationObserver(() => {
      if (!observer && tryAttach()) {
        detachScroll();
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer?.disconnect();
      mo.disconnect();
      detachScroll();
    };
  }, [enabled, mode, heroLightSurfaceScrollPx]);

  return onLightSurface;
}