"use client";

import {
  buildMainDashboardTourEntries,
  filterEntriesWithDom,
  filterUnseenEntries,
  type DashboardTourBuildInput,
  type TourStepEntry,
} from "@/lib/dashboard/dashboard-tour-steps";
import type { DashboardTourActions } from "@/lib/dashboard/dashboard-tour-actions";
import { waitMs } from "@/lib/dashboard/dashboard-tour-actions";
import {
  pathnameToTourModuleKey,
  pickEntriesForModuleVisit,
} from "@/lib/dashboard/dashboard-tour-routes";
import {
  getSeenTourStepIds,
  markTourStepSeen,
} from "@/lib/dashboard/dashboard-tour-storage";
import { createClient } from "@/utils/supabase/client";
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
  /* Ignore overlay clicks — tour closes only via Skip / X. */
}

type RunTourOptions = {
  entries: TourStepEntry[];
  markSeenOnAdvance?: boolean;
};

function createDriverInstance(
  driverModule: typeof import("driver.js"),
  entries: TourStepEntry[],
  userId: string,
  onCleanup: () => void
): Driver {
  const { driver } = driverModule;
  const steps = entries.map((e) => e.step);
  let activeStepId: string | null = null;

  const markActiveSeen = () => {
    if (activeStepId) markTourStepSeen(userId, activeStepId);
  };

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
    onHighlighted: (_element, _step, { driver: drv }) => {
      const idx = drv.getActiveIndex();
      if (idx == null || idx < 0) return;
      const nextId = entries[idx]?.id;
      if (activeStepId && activeStepId !== nextId) {
        markTourStepSeen(userId, activeStepId);
      }
      activeStepId = nextId ?? null;
    },
    onCloseClick: (_element, _step, { driver: drv }) => {
      markActiveSeen();
      drv.destroy();
    },
    onDestroyed: () => {
      markActiveSeen();
      activeStepId = null;
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
  autoStartMainTour = false,
}: DashboardTourProviderProps) {
  const pathname = usePathname();
  const driverRef = useRef<Driver | null>(null);
  const runningRef = useRef(false);
  const allEntriesRef = useRef<TourStepEntry[]>([]);
  const lastModuleTourPathRef = useRef<string | null>(null);
  const [driverReady, setDriverReady] = useState(false);

  const navItemsForRoutes = useMemo(
    () => [...buildInput.visibleNav, ...buildInput.settingsNav],
    [buildInput.visibleNav, buildInput.settingsNav]
  );

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

  useEffect(() => {
    allEntriesRef.current = buildMainDashboardTourEntries(buildInput, tourActions);
  }, [buildInput, tourActions]);

  const runTourEntries = useCallback(
    async ({ entries }: RunTourOptions) => {
      if (runningRef.current || entries.length === 0) return;
      runningRef.current = true;
      tourActions.openSidebar();
      if (buildInput.settingsNav.length > 0) {
        tourActions.ensureSettingsExpanded();
        await waitMs(400);
      }

      try {
        const driverModule = await loadDriver();
        driverRef.current?.destroy();
        const instance = createDriverInstance(
          driverModule,
          entries,
          userId,
          cleanupTourUi
        );
        driverRef.current = instance;
        instance.drive();
      } finally {
        runningRef.current = false;
      }
    },
    [buildInput.settingsNav.length, cleanupTourUi, tourActions, userId]
  );

  const runUnseenTour = useCallback(
    async (subset?: TourStepEntry[]) => {
      const all = subset ?? allEntriesRef.current;
      const seen = getSeenTourStepIds(userId);
      const entries = filterEntriesWithDom(filterUnseenEntries(all, seen));
      await runTourEntries({ entries });
    },
    [runTourEntries, userId]
  );

  const startTour = useCallback(() => {
    void runUnseenTour();
  }, [runUnseenTour]);

  const contextValue = useMemo(() => ({ startTour }), [startTour]);

  useEffect(() => {
    if (!driverReady) return;
    if (pathname.startsWith("/dashboard/mobilize")) return;
    if (lastModuleTourPathRef.current === pathname) return;

    const moduleKey = pathnameToTourModuleKey(pathname, navItemsForRoutes);
    if (!moduleKey) return;

    const isHome = pathname === "/dashboard" || pathname === "/dashboard/";

    let cancelled = false;
    lastModuleTourPathRef.current = pathname;

    void (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        if (cancelled) return;
        if (data.user?.user_metadata?.require_password_change === true) return;
      } catch {
        return;
      }

      await waitMs(isHome ? 2200 : 900);
      if (cancelled) return;

      const seen = getSeenTourStepIds(userId);
      const entries = pickEntriesForModuleVisit(moduleKey, allEntriesRef.current, seen);
      if (entries.length === 0) return;

      await runTourEntries({ entries });
    })();

    return () => {
      cancelled = true;
    };
  }, [autoStartMainTour, driverReady, navItemsForRoutes, pathname, runTourEntries, userId]);

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
    <Tooltip title="Continue guided tour">
      <IconButton
        color="inherit"
        size="small"
        aria-label="Continue guided tour"
        data-tour="header-tour-help"
        onClick={() => startTour()}
      >
        <HelpOutlineIcon />
      </IconButton>
    </Tooltip>
  );
}
