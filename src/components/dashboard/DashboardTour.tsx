"use client";

import {
  buildMainDashboardTourEntries,
  type DashboardTourBuildInput,
  type TourStepEntry,
} from "@/lib/dashboard/dashboard-tour-steps";
import type { DashboardTourActions } from "@/lib/dashboard/dashboard-tour-actions";
import { waitMs } from "@/lib/dashboard/dashboard-tour-actions";
import {
  pathnameToTourModuleKey,
  pickAllEntriesForModuleVisit,
} from "@/lib/dashboard/dashboard-tour-routes";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { IconButton, Tooltip } from "@mui/material";
import type { Driver } from "driver.js";
import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";

type DashboardTourContextValue = {
  /** Show the guided tour for the user's current section (help button). */
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
};

async function loadDriver(): Promise<typeof import("driver.js")> {
  return import("driver.js");
}

function noopOverlayClick(): void {
  /* Ignore overlay clicks — tour closes only via Skip / X. */
}

type RunTourOptions = {
  entries: TourStepEntry[];
};

function createDriverInstance(
  driverModule: typeof import("driver.js"),
  entries: TourStepEntry[],
  onCleanup: () => void
): Driver {
  const { driver } = driverModule;
  const steps = entries.map((e) => e.step);

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
      for (const btn of [popover.nextButton, popover.previousButton, popover.closeButton]) {
        if (btn) {
          btn.style.pointerEvents = "auto";
        }
      }
    },
    onCloseClick: (_element, _step, { driver: drv }) => {
      drv.destroy();
    },
    onDestroyed: () => {
      onCleanup();
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
}: DashboardTourProviderProps) {
  const pathname = usePathname();
  const driverRef = useRef<Driver | null>(null);
  const runningRef = useRef(false);
  const allEntriesRef = useRef<TourStepEntry[]>([]);

  /** Keep latest callbacks in refs so internal effects/callbacks don't recreate on every render. */
  const openSidebarRef = useRef(openSidebar);
  const ensureSettingsExpandedRef = useRef(ensureSettingsExpanded);
  const openProfileDrawerRef = useRef(openProfileDrawer);
  const closeProfileDrawerRef = useRef(closeProfileDrawer);
  const setProfileEditModeRef = useRef(setProfileEditMode);
  useEffect(() => {
    openSidebarRef.current = openSidebar;
    ensureSettingsExpandedRef.current = ensureSettingsExpanded;
    openProfileDrawerRef.current = openProfileDrawer;
    closeProfileDrawerRef.current = closeProfileDrawer;
    setProfileEditModeRef.current = setProfileEditMode;
  });

  /** Keep latest nav items in a ref for help-tour route resolution. */
  const navItemsForRoutesRef = useRef<typeof buildInput.visibleNav>([]);
  useEffect(() => {
    navItemsForRoutesRef.current = [
      ...buildInput.visibleNav,
      ...buildInput.settingsNav,
    ];
  }, [buildInput.visibleNav, buildInput.settingsNav]);

  /** Stable tourActions that read from refs to avoid identity churn between renders. */
  const tourActions = useMemo<DashboardTourActions>(
    () => ({
      openSidebar: () => openSidebarRef.current(),
      ensureSettingsExpanded: () => ensureSettingsExpandedRef.current?.(),
      openProfileDrawer: () => openProfileDrawerRef.current(),
      closeProfileDrawer: () => closeProfileDrawerRef.current(),
      setProfileEditMode: (edit) => setProfileEditModeRef.current(edit),
    }),
    []
  );

  const cleanupTourUi = useCallback(() => {
    /** Tour no longer opens the profile drawer, so nothing to clean up here. */
  }, []);

  useEffect(() => {
    allEntriesRef.current = buildMainDashboardTourEntries(buildInput, tourActions);
  }, [buildInput, tourActions]);

  const runTourEntries = useCallback(
    async ({ entries }: RunTourOptions) => {
      if (entries.length === 0) return;
      if (runningRef.current) return;
      runningRef.current = true;

      try {
        tourActions.openSidebar();
        if (buildInput.settingsNav.length > 0) {
          tourActions.ensureSettingsExpanded();
        }
        await waitMs(450);

        const driverModule = await loadDriver();
        driverRef.current?.destroy();

        const instance = createDriverInstance(driverModule, entries, () => {
          driverRef.current = null;
          runningRef.current = false;
          cleanupTourUi();
        });
        driverRef.current = instance;
        instance.drive();
      } catch (e) {
        runningRef.current = false;
        driverRef.current = null;
        if (process.env.NODE_ENV !== "production") {
          /* eslint-disable-next-line no-console */
          console.warn("dashboard tour: failed to start", e);
        }
      }
    },
    [buildInput.settingsNav.length, cleanupTourUi, tourActions]
  );

  /** Help button: shows all tour steps for the current section on demand. */
  const startTour = useCallback(() => {
    const moduleKey = pathnameToTourModuleKey(pathname, navItemsForRoutesRef.current);
    if (!moduleKey) return;
    const all = allEntriesRef.current;
    if (all.length === 0) return;

    const entries = pickAllEntriesForModuleVisit(moduleKey, all);
    if (entries.length === 0) return;

    void runTourEntries({ entries });
  }, [pathname, runTourEntries]);

  const contextValue = useMemo(() => ({ startTour }), [startTour]);

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
    <Tooltip title="Show guided tour for this section">
      <IconButton
        color="inherit"
        size="small"
        aria-label="Show guided tour for this section"
        data-tour="header-tour-help"
        onClick={() => startTour()}
      >
        <HelpOutlineIcon />
      </IconButton>
    </Tooltip>
  );
}
