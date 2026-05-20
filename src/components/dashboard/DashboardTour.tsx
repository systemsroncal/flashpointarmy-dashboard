"use client";

import {
  buildMainDashboardTourSteps,
  buildMobilizeTourSteps,
  type DashboardTourBuildInput,
} from "@/lib/dashboard/dashboard-tour-steps";
import type { DashboardTourActions } from "@/lib/dashboard/dashboard-tour-actions";
import { waitMs } from "@/lib/dashboard/dashboard-tour-actions";
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
  ensureSettingsExpanded?: () => void;
  openProfileDrawer: () => void;
  closeProfileDrawer: () => void;
  setProfileEditMode: (edit: boolean) => void;
  autoStartMainTour?: boolean;
};

async function loadDriver(): Promise<typeof import("driver.js")> {
  return import("driver.js");
}

function noopOverlayClick(): void {
  /* Do not close the tour when clicking outside the popover. */
}

function createDriverInstance(
  driverModule: typeof import("driver.js"),
  steps: ReturnType<typeof buildMainDashboardTourSteps>,
  onDone: () => void,
  onCleanup: () => void
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
    overlayClickBehavior: noopOverlayClick,
    popoverClass: "fp-dashboard-tour-popover",
    steps,
    onPopoverRender: (popover) => {
      if (popover.closeButton) {
        popover.closeButton.textContent = "Skip";
        popover.closeButton.setAttribute("aria-label", "Skip tour");
        popover.closeButton.setAttribute("title", "Skip tour");
      }
    },
    onDestroyed: () => {
      onCleanup();
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
  openProfileDrawer,
  closeProfileDrawer,
  setProfileEditMode,
  autoStartMainTour = false,
}: DashboardTourProviderProps) {
  const driverRef = useRef<Driver | null>(null);
  const runningRef = useRef(false);
  const [driverReady, setDriverReady] = useState(false);

  const tourActions = useMemo<DashboardTourActions>(
    () => ({
      openSidebar,
      ensureSettingsExpanded: ensureSettingsExpanded ?? (() => {}),
      openProfileDrawer,
      closeProfileDrawer,
      setProfileEditMode,
    }),
    [
      openSidebar,
      ensureSettingsExpanded,
      openProfileDrawer,
      closeProfileDrawer,
      setProfileEditMode,
    ]
  );

  const cleanupTourUi = useCallback(() => {
    setProfileEditMode(false);
    closeProfileDrawer();
  }, [closeProfileDrawer, setProfileEditMode]);

  useEffect(() => {
    void loadDriver().then(() => setDriverReady(true));
  }, []);

  const runTour = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    tourActions.openSidebar();
    if (!buildInput.isMobilize && buildInput.settingsNav.length > 0) {
      tourActions.ensureSettingsExpanded();
      await waitMs(400);
    }

    try {
      const driverModule = await loadDriver();
      const steps = buildInput.isMobilize
        ? buildMobilizeTourSteps(buildInput, tourActions)
        : buildMainDashboardTourSteps(buildInput, tourActions);

      if (steps.length === 0) return;

      driverRef.current?.destroy();
      const markDone = () => {
        if (buildInput.isMobilize) {
          markMobilizeTourCompleted(userId);
        } else {
          markMainDashboardTourCompleted(userId);
        }
      };

      const instance = createDriverInstance(
        driverModule,
        steps,
        markDone,
        cleanupTourUi
      );
      driverRef.current = instance;
      instance.drive();
    } finally {
      runningRef.current = false;
    }
  }, [buildInput, cleanupTourUi, tourActions, userId]);

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

      await waitMs(2200);
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
      await waitMs(1600);
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
