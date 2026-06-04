"use client";

import type { Driver } from "driver.js";
import { useEffect } from "react";

const STORAGE_KEY = "fpa_login_signin_hint_v1";
const TARGET_ID = "login-form-panel";

const HIGHLIGHT = {
  title: "First time signing in?",
  description:
    "Use the email and temporary password you received. You may type the temporary password in any mix of upper and lower case. After you sign in, you will be asked to choose your own password. Click the X button (top right) or tap outside this box to close.",
  side: "left" as const,
  align: "start" as const,
};

let activeDriver: Driver | null = null;

function markHintSeen() {
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* ignore */
  }
}

function hasSeenHint(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

/** driver.js highlight on the login form (popover + dimmed overlay). */
export async function showLoginSignInHighlight(): Promise<void> {
  if (typeof document === "undefined") return;
  const el = document.getElementById(TARGET_ID);
  if (!el) return;

  activeDriver?.destroy();
  const { driver } = await import("driver.js");
  const driverObj = driver({
    popoverClass: "fp-dashboard-tour-popover fp-login-hint-popover",
    allowClose: true,
    overlayOpacity: 0.65,
    onDestroyed: () => {
      markHintSeen();
      activeDriver = null;
    },
  });
  activeDriver = driverObj;
  driverObj.highlight({
    element: `#${TARGET_ID}`,
    popover: {
      ...HIGHLIGHT,
      showButtons: ["close"],
      onCloseClick: () => {
        driverObj.destroy();
      },
    },
  });
}

export function LoginSignInHighlight({ autoShow = true }: { autoShow?: boolean }) {
  useEffect(() => {
    if (!autoShow || hasSeenHint()) return;
    const t = window.setTimeout(() => {
      void showLoginSignInHighlight();
    }, 700);
    return () => window.clearTimeout(t);
  }, [autoShow]);

  return null;
}
