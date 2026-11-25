"use client";

import { useEffect, useState } from "react";

export type MobilizeHeaderSurfaceMode = "light" | "cover-hero";

/** Scroll offset where the slim app bar leaves the dark cover band (xs ~200px cover). */
export const MOBILIZE_COVER_HERO_LIGHT_SURFACE_SCROLL_PX = 132;

/**
 * Mobilize mobile toolbar: dark icons on light page chrome; light icons over dark hero covers.
 * `cover-hero` flips after the user scrolls past the cover band under the transparent AppBar.
 */
export function useMobilizeHeaderOnLightSurface(
  enabled: boolean,
  mode: MobilizeHeaderSurfaceMode,
  heroLightSurfaceScrollPx = MOBILIZE_COVER_HERO_LIGHT_SURFACE_SCROLL_PX
): boolean {
  const [onLightSurface, setOnLightSurface] = useState(mode !== "cover-hero");

  useEffect(() => {
    if (!enabled) {
      setOnLightSurface(false);
      return;
    }
    if (mode === "light") {
      setOnLightSurface(true);
      return;
    }

    const sync = () => {
      setOnLightSurface(window.scrollY >= heroLightSurfaceScrollPx);
    };

    sync();
    window.addEventListener("scroll", sync, { passive: true });
    return () => window.removeEventListener("scroll", sync);
  }, [enabled, mode, heroLightSurfaceScrollPx]);

  return onLightSurface;
}