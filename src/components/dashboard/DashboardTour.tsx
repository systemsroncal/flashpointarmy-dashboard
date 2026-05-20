"use client";

import {
  buildMainDashboardTourSteps,
  buildMobilizeTourSteps,
  type DashboardTourBuildInput,
} from "@/lib/dashboard/dashboard-tour-steps";
import {
  isMainDashboardTourCompleted,
  isMobilizeTourCompleted,
  markMainDashboardTourCompleted,
  markMobilizeTourCompleted,
} from "@/lib/dashboard/dashboard-tour-storage";
import { createClient } from "@/utils/supabase/client";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { IconButton, Tooltip } from "@mui/material";
import type { Driver } from "driver.js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type DashboardTourContextValue = {
  startTour: () => void;
};

const DashboardTourContext = createContext<DashboardTourContextValue | null>(null);

export function useDashboardTour(): DashboardTourContextValue {
  const ctx = useContext(DashboardTourContext);
  if (!ctx) {
    throw new Error("useDashboardTour must be used within DashboardTourProvider");
  }
  return ctx;
}

type DashboardTourProviderProps = {
  children: ReactNode;
  userId: string;
  buildInput: DashboardTourBuildInput;
  openSidebar: () => void;
  /** Expand Settings submenu so tour steps exist in the DOM. */
  ensureSettingsExpanded?: () => void;
  /** National overview home — auto-start main tour once. */
  autoStartMainTour?: boolean;
};

async function loadDriver(): Promise<typeof import("driver.js")> {
  return import("driver.js");
}

function createDriverInstance(
  driverModule: typeof import("driver.js"),
  steps: ReturnType<typeof buildMainDashboardTourSteps>,
  onDone: () => void,
  openSidebar: () => void
): Driver {
  const { driver } = driverModule;
  return driver({
    showProgress: true,
    progressText: "{{current}} of {{total}}",
    nextBtnText: "Next",
    prevBtnText: "Back",
    doneBtnText: "Finish",
    showButtons: ["next", "previous", "close"],
    allowClose: true,
    smoothScroll: true,
    popoverClass: "fp-dashboard-tour-popover",
    steps,
    onPopoverRender: (popover) => {
      popover.closeButton?.setAttribute("aria-label", "Skip tour");
      popover.closeButton?.setAttribute("title", "Skip tour");
    },
    onHighlightStarted: (element) => {
      if (!element) return;
      const tour = element.getAttribute("data-tour") ?? "";
      if (
        tour.startsWith("nav-") ||
        tour.startsWith("mobilize-") ||
        tour === "sidebar-profile" ||
        tour === "sidebar-sign-out" ||
        tour === "nav-settings-group" ||
        tour === "sidebar-toggle"
      ) {
        openSidebar();
      }
    },
    onDestroyed: () => {
      onDone();
    },
  });
}

export function DashboardTourProvider({
  children,
  userId,
  buildInput,
  openSidebar,
  ensureSettingsExpanded,
  autoStartMainTour = false,
}: DashboardTourProviderProps) {
  const driverRef = useRef<Driver | null>(null);
  const runningRef = useRef(false);
  const [driverReady, setDriverReady] = useState(false);

  useEffect(() => {
    void loadDriver().then(() => setDriverReady(true));
  }, []);

  const runTour = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    openSidebar();
    if (!buildInput.isMobilize && buildInput.settingsNav.length > 0) {
      ensureSettingsExpanded?.();
      await new Promise((r) => setTimeout(r, 400));
    }

    try {
      const driverModule = await loadDriver();
      const steps = buildInput.isMobilize
        ? buildMobilizeTourSteps(buildInput)
        : buildMainDashboardTourSteps(buildInput);

      if (steps.length === 0) return;

      driverRef.current?.destroy();
      const markDone = () => {
        if (buildInput.isMobilize) {
          markMobilizeTourCompleted(userId);
        } else {
          markMainDashboardTourCompleted(userId);
        }
      };

      const instance = createDriverInstance(driverModule, steps, markDone, openSidebar);
      driverRef.current = instance;
      instance.drive();
    } finally {
      runningRef.current = false;
    }
  }, [buildInput, ensureSettingsExpanded, openSidebar, userId]);

  const startTour = useCallback(() => {
    void runTour();
  }, [runTour]);

  const contextValue = useMemo(() => ({ startTour }), [startTour]);

  useEffect(() => {
    if (!autoStartMainTour || !driverReady || buildInput.isMobilize) return;

    let cancelled = false;

    void (async () => {
      if (isMainDashboardTourCompleted(userId)) return;

      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        if (cancelled) return;
        if (data.user?.user_metadata?.require_password_change === true) return;
      } catch {
        return;
      }

      await new Promise((r) => setTimeout(r, 2200));
      if (cancelled) return;
      if (isMainDashboardTourCompleted(userId)) return;

      await runTour();
    })();

    return () => {
      cancelled = true;
    };
  }, [autoStartMainTour, buildInput.isMobilize, driverReady, runTour, userId]);

  useEffect(() => {
    if (!driverReady || !buildInput.isMobilize) return;

    let cancelled = false;

    void (async () => {
      if (isMobilizeTourCompleted(userId)) return;
      await new Promise((r) => setTimeout(r, 1600));
      if (cancelled) return;
      if (isMobilizeTourCompleted(userId)) return;
      await runTour();
    })();

    return () => {
      cancelled = true;
    };
  }, [buildInput.isMobilize, driverReady, runTour, userId]);

  useEffect(() => {
    return () => {
      driverRef.current?.destroy();
    };
  }, []);

  return (
    <DashboardTourContext.Provider value={contextValue}>{children}</DashboardTourContext.Provider>
  );
}

export function DashboardTourHelpButton() {
  const { startTour } = useDashboardTour();

  return (
    <Tooltip title="Dashboard tour">
      <IconButton
        color="inherit"
        size="small"
        aria-label="Start dashboard tour"
        data-tour="header-tour-help"
        onClick={() => startTour()}
      >
        <HelpOutlineIcon />
      </IconButton>
    </Tooltip>
  );
}
