import { MODULE_SLUGS } from "@/config/modules";
import type { DashboardTourActions } from "@/lib/dashboard/dashboard-tour-actions";
import {
  prepareSidebarTarget,
  scrollTourTargetIntoView,
} from "@/lib/dashboard/dashboard-tour-actions";
import { isLocalLeaderNonElevated, isRestrictedMemberNav } from "@/lib/auth/nav-access";
import {
  isElevatedRole,
  isSubAdminUser,
  isSuperAdminUser,
} from "@/lib/auth/user-roles";
import type { DriveStep, DriverHook } from "driver.js";

export type TourNavItem = {
  label: string;
  href: string;
  module: string;
};

export type DashboardTourBuildInput = {
  roleNames: string[];
  visibleNav: TourNavItem[];
  settingsNav: TourNavItem[];
  mobilizeNav: TourNavItem[];
  isMobilize: boolean;
  showSystemNotificationBell: boolean;
  displayName: string;
};

const NAV_SELECTOR = (module: string) => `[data-tour="nav-${module}"]`;

/** `data-tour` value for a Mobilize sidebar link (Mobilize not included in tour). */
export function mobilizeNavTourAttr(href: string): string {
  const part = href.replace("/dashboard/mobilize", "").replace(/^\//, "") || "home";
  return `mobilize-${part.replace(/\//g, "-")}`;
}

function roleProfile(roleNames: string[]): "super_admin" | "admin" | "sub_admin" | "local_leader" | "member" | "other" {
  if (isSuperAdminUser(roleNames)) return "super_admin";
  if (roleNames.includes("admin")) return "admin";
  if (isSubAdminUser(roleNames)) return "sub_admin";
  if (isLocalLeaderNonElevated(roleNames)) return "local_leader";
  if (isRestrictedMemberNav(roleNames)) return "member";
  return "other";
}

function welcomeCopy(profile: ReturnType<typeof roleProfile>, displayName: string): { title: string; description: string } {
  const name = displayName.trim() || "there";
  switch (profile) {
    case "super_admin":
      return {
        title: "Welcome, platform owner",
        description: `Hi ${name}. This tour walks through your dashboard: national overview, chapters, administrator tools, and Settings. Use Back and Next to move. Press Skip or the X to exit.`,
      };
    case "admin":
      return {
        title: "Welcome, administrator",
        description: `Hi ${name}. You can manage chapters, leaders, community members, events, training content, and system settings. This tour highlights only the menu items available to your role.`,
      };
    case "sub_admin":
      return {
        title: "Welcome, sub administrator",
        description: `Hi ${name}. You can manage chapters, leaders, community members, events, and training. Mobilize and Settings are not available to your role. This tour highlights the menu items you can use.`,
      };
    case "local_leader":
      return {
        title: "Welcome, local leader",
        description: `Hi ${name}. Your menu focuses on your chapter: overview, events, training, announcements, and member tools. Follow each step to see what each section is for.`,
      };
    case "member":
      return {
        title: "Welcome",
        description: `Hi ${name}. Your dashboard shows national overview, events, training courses, and announcements. We will guide you through each item you can open.`,
      };
    default:
      return {
        title: "Dashboard tour",
        description: `Hi ${name}. This short tour explains the sidebar and header. Use Back and Next. Press Skip or the X to exit.`,
      };
  }
}

const MODULE_COPY: Record<string, { title: string; description: string }> = {
  [MODULE_SLUGS.nationalOverview]: {
    title: "National overview",
    description:
      "Your home page: high-level metrics, maps, and activity across the organization. Open this anytime to see the big picture.",
  },
  [MODULE_SLUGS.chapters]: {
    title: "Churches",
    description:
      "View and manage churches (locations, contacts, and church-level settings). Administrators use this to keep church records up to date.",
  },
  [MODULE_SLUGS.leaders]: {
    title: "Leaders",
    description:
      "Directory of local leaders: search, view profiles, and manage leader assignments tied to chapters.",
  },
  [MODULE_SLUGS.community]: {
    title: "Community",
    description:
      "Member directory: invite users, edit profiles, reset passwords, and manage membership for your organization.",
  },
  [MODULE_SLUGS.gatherings]: {
    title: "FPA Events",
    description:
      "Create and manage gatherings and events: schedules, locations, registration, and published event pages.",
  },
  [MODULE_SLUGS.admins]: {
    title: "Administrators",
    description:
      "Manage dashboard administrator accounts: invite admins, assign roles, and control who can access back-office tools.",
  },
  [MODULE_SLUGS.training]: {
    title: "Training",
    description:
      "Your assigned courses and learning paths. Open a course to watch videos, complete sessions, and track your progress.",
  },
  [MODULE_SLUGS.courses]: {
    title: "Courses (editor)",
    description:
      "Build and maintain training courses: sessions, videos, quizzes, and publishing. Typically used by administrators who manage learning content.",
  },
  [MODULE_SLUGS.communications]: {
    title: "Notifications",
    description:
      "Organization announcements and messages. Check here for news; unread items may show a badge on this menu item and in the header.",
  },
  [MODULE_SLUGS.logs]: {
    title: "Logs",
    description:
      "Audit and activity logs for troubleshooting and compliance. Review sign-ins, changes, and system events.",
  },
  [MODULE_SLUGS.emails]: {
    title: "Emails",
    description:
      "Email templates and outbound messaging tools used for invites, password resets, and campaign-style communications.",
  },
  [MODULE_SLUGS.reports]: {
    title: "Reports",
    description:
      "Analytics and charts: demographics, engagement, and operational reports to understand how the platform is being used.",
  },
  [MODULE_SLUGS.adminRoles]: {
    title: "Roles & permissions",
    description:
      "Configure which roles can read or change each module. Super administrators define what admins and other roles are allowed to do.",
  },
};

export type TourStepEntry = { id: string; step: DriveStep };

type StepSide = "left" | "right" | "bottom" | "top" | "over";

function highlightHook(
  actions: DashboardTourActions,
  extra?: DriverHook
): DriverHook {
  return (element, step, opts) => {
    try {
      if (element) {
        prepareSidebarTarget(element, actions);
        scrollTourTargetIntoView(element);
      }
    } catch (e) {
      if (process.env.NODE_ENV !== "production") {
        /* eslint-disable-next-line no-console */
        console.warn("tour highlight hook error", e);
      }
    }
    try {
      extra?.(element, step, opts);
    } catch (e) {
      if (process.env.NODE_ENV !== "production") {
        /* eslint-disable-next-line no-console */
        console.warn("tour extra hook error", e);
      }
    }
    /** Recompute popover position after potential layout shifts (sidebar / settings expand). */
    window.setTimeout(() => {
      try {
        opts.driver.refresh();
      } catch {
        /* driver may have been destroyed */
      }
    }, 120);
  };
}

function stepForSelector(
  id: string,
  selector: string,
  title: string,
  description: string,
  side: StepSide = "right",
  hooks?: { onHighlightStarted?: DriverHook; onNextClick?: DriverHook }
): TourStepEntry {
  /**
   * IMPORTANT: never set `onNextClick` / `onPrevClick` / `onCloseClick` to `undefined`
   * on the popover. driver.js v1.4 spreads the user's `popover` AT THE END of its
   * internal merged config (see `driver.js.mjs` `v()` function). A property whose
   * value is `undefined` still overrides driver.js' default handler, which causes
   * the Next button to silently do nothing (`L("nextClick")` has no registered
   * listener). We therefore only attach the property when a real function is
   * provided.
   */
  const popover: DriveStep["popover"] = {
    title,
    description,
    side,
    align: "start",
  };
  if (hooks?.onNextClick) {
    popover.onNextClick = hooks.onNextClick;
  }
  const step: DriveStep = {
    element: selector,
    popover,
  };
  if (hooks?.onHighlightStarted) {
    step.onHighlightStarted = hooks.onHighlightStarted;
  }
  return { id, step };
}

export function filterEntriesWithDom(entries: TourStepEntry[]): TourStepEntry[] {
  if (typeof document === "undefined") return entries;
  return entries.filter(({ step }) => {
    const el = step.element;
    if (!el) return true;
    if (typeof el === "function") {
      try {
        const resolved = el();
        if (!resolved) return false;
        if (resolved === document.body) return false;
        return resolved instanceof Element;
      } catch {
        return false;
      }
    }
    if (typeof el === "string") return Boolean(document.querySelector(el));
    return true;
  });
}

export function filterUnseenEntries(entries: TourStepEntry[], seen: Set<string>): TourStepEntry[] {
  return entries.filter((e) => !seen.has(e.id));
}

export function buildMainDashboardTourEntries(
  input: DashboardTourBuildInput,
  actions: DashboardTourActions
): TourStepEntry[] {
  const profile = roleProfile(input.roleNames);
  const welcome = welcomeCopy(profile, input.displayName);
  const elevated = isElevatedRole(input.roleNames);
  const sidebarHook = { onHighlightStarted: highlightHook(actions) };

  const entries: TourStepEntry[] = [
    {
      id: "welcome",
      step: {
        popover: {
          title: welcome.title,
          description: welcome.description,
          side: "over",
          align: "center",
        },
      },
    },
    stepForSelector(
      "sidebar-toggle",
      '[data-tour="sidebar-toggle"]',
      "Sidebar menu",
      "Show or hide the left navigation panel. On phones, open the menu before following steps that highlight sidebar items.",
      "right",
      sidebarHook
    ),
  ];

  for (const item of input.visibleNav) {
    if (item.module === MODULE_SLUGS.movilization) continue;
    const copy = MODULE_COPY[item.module];
    if (!copy) continue;
    entries.push(
      stepForSelector(`nav-${item.module}`, NAV_SELECTOR(item.module), copy.title, copy.description, "right", sidebarHook)
    );
  }

  if (input.settingsNav.length > 0) {
    entries.push(
      stepForSelector(
        "nav-settings-group",
        '[data-tour="nav-settings-group"]',
        "Settings",
        "Administrator tools are grouped here: emails, logs, courses editor, reports, administrators, and roles. Click to expand or collapse the list.",
        "right",
        sidebarHook
      )
    );
    for (const item of input.settingsNav) {
      const copy = MODULE_COPY[item.module];
      if (!copy) continue;
      entries.push(
        stepForSelector(`nav-${item.module}`, NAV_SELECTOR(item.module), copy.title, copy.description, "right", sidebarHook)
      );
    }
  }

  entries.push(
    stepForSelector(
      "sidebar-profile",
      '[data-tour="sidebar-profile"]',
      "Your profile",
      "Click your name here to open your profile drawer. From there you can update your photo, name, phone, and sign-in email.",
      "right",
      sidebarHook
    ),
    stepForSelector(
      "header-sign-out",
      '[data-tour="header-account-settings"]',
      "Sign out",
      "Open the gear icon in the top bar, then choose Sign out when you are done. You will return to the login page.",
      "bottom"
    ),
    stepForSelector(
      "header-account-settings",
      '[data-tour="header-account-settings"]',
      "Account settings",
      "Open Settings in the top bar to change your password or edit your profile. This is the quickest way to update your sign-in details.",
      "bottom"
    ),
    stepForSelector(
      "header-notifications",
      '[data-tour="header-notifications"]',
      elevated && input.showSystemNotificationBell ? "System notifications" : "Announcements",
      elevated && input.showSystemNotificationBell
        ? "Quick access to system notification events (new sign-ups, completions, and similar alerts). Click the bell to read and dismiss items."
        : "Shortcut to organization announcements. The badge shows how many unread messages you have.",
      "bottom"
    ),
    stepForSelector(
      "header-tour-help",
      '[data-tour="header-tour-help"]',
      "Tour help",
      "Tap the question mark anytime to restart the guided tour for the section you are on.",
      "bottom"
    )
  );

  return filterEntriesWithDom(entries);
}
