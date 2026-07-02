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
  pickAllEntriesForModuleVisit,
  pickEntriesForModuleVisit,
} from "@/lib/dashboard/dashboard-tour-routes";
import {
  getSeenTourStepIds,
  hasAutoTourCompleted,
  markAutoTourCompleted,
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
  autoStartMainTour?: boolean;
};

async function loadDriver(): Promise<typeof import("driver.js")> {
  return import("driver.js");
}

function noopOverlayClick(): void {
  /* Ignore overlay clicks — tour closes only via Skip / X. */
}

/**
 * "auto" = one-time automatic tour on first dashboard home visit. Marks each
 *   step as seen and sets a global "auto tour done" flag when finished or skipped.
 * "help" = manual tour via the (?) header button. Does NOT mutate seen state.
 */
type RunMode = "auto" | "help";

type RunTourOptions = {
  entries: TourStepEntry[];
  mode: RunMode;
};

function createDriverInstance(
  driverModule: typeof import("driver.js"),
  entries: TourStepEntry[],
  userId: string,
  mode: RunMode,
  onCleanup: () => void
): Driver {
  const { driver } = driverModule;
  const steps = entries.map((e) => e.step);
  let activeStepId: string | null = null;

  const shouldPersistSeen = mode === "auto";

  const markActiveSeen = () => {
    if (shouldPersistSeen && activeStepId) markTourStepSeen(userId, activeStepId);
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
      if (shouldPersistSeen && activeStepId && activeStepId !== nextId) {
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
  const autoTourStartedRef = useRef(false);
  const [driverReady, setDriverReady] = useState(false);

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

  /** Keep latest nav items in a ref so the auto-tour effect can read them without re-running on every render. */
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
    void loadDriver().then(() => setDriverReady(true));
  }, []);

  useEffect(() => {
    allEntriesRef.current = buildMainDashboardTourEntries(buildInput, tourActions);
  }, [buildInput, tourActions]);

  const runTourEntries = useCallback(
    async ({ entries, mode }: RunTourOptions) => {
      if (entries.length === 0) return;
      /**
       * Help-driven tours always take precedence: if anything is running we
       * tear it down first so the (?) button can never be blocked by a
       * lingering auto-tour instance.
       */
      if (runningRef.current) {
        if (mode === "help") {
          try {
            driverRef.current?.destroy();
          } catch {
            /* ignore */
          }
          driverRef.current = null;
          runningRef.current = false;
        } else {
          return;
        }
      }
      runningRef.current = true;

      try {
        tourActions.openSidebar();
        if (buildInput.settingsNav.length > 0) {
          tourActions.ensureSettingsExpanded();
        }
        await waitMs(450);

        const driverModule = await loadDriver();
        driverRef.current?.destroy();

        const instance = createDriverInstance(driverModule, entries, userId, mode, () => {
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
    [buildInput.settingsNav.length, cleanupTourUi, tourActions, userId]
  );

  /** Help button: shows all tour steps for the current section on demand. */
  const startTour = useCallback(() => {
    const moduleKey = pathnameToTourModuleKey(pathname, navItemsForRoutesRef.current);
    if (!moduleKey) return;
    const all = allEntriesRef.current;
    if (all.length === 0) return;

    const entries = pickAllEntriesForModuleVisit(moduleKey, all);
    if (entries.length === 0) return;

    void runTourEntries({ entries, mode: "help" });
  }, [pathname, runTourEntries]);

  const contextValue = useMemo(() => ({ startTour }), [startTour]);

  /**
   * Optional one-time auto-tour (disabled by default). When enabled, only runs on
   * first dashboard home visit before the user finishes or skips it. Otherwise
   * use the (?) help button.
   */
  useEffect(() => {
    if (!driverReady) return;
    if (!autoStartMainTour) return;
    if (hasAutoTourCompleted(userId)) return;
    if (pathname.startsWith("/dashboard/mobilize")) return;
    if (autoTourStartedRef.current) return;

    const moduleKey = pathnameToTourModuleKey(pathname, navItemsForRoutesRef.current);
    if (!moduleKey) return;

    let cancelled = false;

    const tryAutoTour = async () => {
      if (cancelled || autoTourStartedRef.current || hasAutoTourCompleted(userId)) return;

      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        if (cancelled) return;
        if (data.user?.user_metadata?.require_password_change === true) return;
      } catch {
        return;
      }

      await waitMs(1500);
      if (cancelled) return;

      if (allEntriesRef.current.length === 0) {
        await waitMs(400);
      }
      if (cancelled) return;

      const seen = getSeenTourStepIds(userId);
      const entries = pickEntriesForModuleVisit(
        moduleKey,
        allEntriesRef.current,
        seen
      );
      if (entries.length === 0) {
        markAutoTourCompleted(userId);
        autoTourStartedRef.current = true;
        return;
      }

      autoTourStartedRef.current = true;
      await runTourEntries({ entries, mode: "auto" });
    };

    void tryAutoTour();

    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void tryAutoTour();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [autoStartMainTour, driverReady, pathname, runTourEntries, userId]);

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
