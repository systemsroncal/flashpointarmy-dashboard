"use client";

import NProgress from "nprogress";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import "nprogress/nprogress.css";

/**
 * Global navigation bar: starts on link click / back-forward, finishes when the URL
 * settles (all routes: auth, dashboard, etc.). Not tied to `DashboardShell`.
 * `trickle: false` avoids stalling near ~97% when `done()` was missing.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const skipDoneOnMount = useRef(true);

  useEffect(() => {
    NProgress.configure({
      showSpinner: false,
      trickle: false,
      minimum: 0.12,
      easing: "ease",
      speed: 400,
    });
  }, []);

  useEffect(() => {
    if (skipDoneOnMount.current) {
      skipDoneOnMount.current = false;
      return;
    }
    queueMicrotask(() => NProgress.done());
  }, [pathname]);

  useEffect(() => {
    const tryStart = (href: string | null) => {
      if (!href || href.startsWith("#")) return;
      let url: URL;
      try {
        url = new URL(href, window.location.origin);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      const next = `${url.pathname}${url.search}`;
      const cur = `${window.location.pathname}${window.location.search}`;
      if (next === cur) return;
      NProgress.start();
    };

    const onClick = (e: MouseEvent) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      const a = target.closest("a[href]");
      if (!(a instanceof HTMLAnchorElement)) return;
      if (a.target === "_blank" || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      tryStart(a.getAttribute("href"));
    };

    const onPopState = () => {
      NProgress.start();
    };

    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPopState);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  return null;
}
