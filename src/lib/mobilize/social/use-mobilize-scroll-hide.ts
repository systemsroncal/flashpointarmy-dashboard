"use client";

import { useEffect, useState } from "react";

const SCROLL_SHOW_TOP_PX = 56;
const SCROLL_DELTA_PX = 10;

/** Hides chrome when the user scrolls down; shows again when scrolling up (Mobilize mobile). */
export function useMobilizeScrollHide(enabled: boolean): boolean {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setHidden(false);
      return;
    }

    let lastY = typeof window !== "undefined" ? window.scrollY : 0;
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const y = window.scrollY;
        const dy = y - lastY;
        if (y <= SCROLL_SHOW_TOP_PX) {
          setHidden(false);
        } else if (dy > SCROLL_DELTA_PX) {
          setHidden(true);
        } else if (dy < -SCROLL_DELTA_PX) {
          setHidden(false);
        }
        lastY = y;
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [enabled]);

  return hidden;
}