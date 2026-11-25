"use client";

import { useEffect, useState } from "react";

const HERO_AT_TOP_SCROLL_PX = 56;

/** True while the page scroll is still within the cover band (hero toolbar stays light-on-dark). */
export function useMobilizeHeroAtTop(enabled: boolean): boolean {
  const [atTop, setAtTop] = useState(enabled);

  useEffect(() => {
    if (!enabled) {
      setAtTop(false);
      return;
    }
    const sync = () => setAtTop(window.scrollY < HERO_AT_TOP_SCROLL_PX);
    sync();
    window.addEventListener("scroll", sync, { passive: true });
    return () => window.removeEventListener("scroll", sync);
  }, [enabled]);

  return atTop;
}