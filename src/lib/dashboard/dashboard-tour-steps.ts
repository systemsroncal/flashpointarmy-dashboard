import { MODULE_SLUGS } from "@/config/modules";
import type { DashboardTourActions } from "@/lib/dashboard/dashboard-tour-actions";
import {
  prepareSidebarTarget,
  scrollTourTargetIntoView,
  waitMs,
} from "@/lib/dashboard/dashboard-tour-actions";
import { isLocalLeaderNonElevated, isRestrictedMemberNav } from "@/lib/auth/nav-access";
import {
  isElevatedRole,
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
const MOBILIZE_SELECTOR = (id: string) => `[data-tour="${id}"]`;

/** `data-tour` value for a Mobilize sidebar link. */
export function mobilizeNavTourAttr(href: string): string {
  const part = href.replace("/dashboard/mobilize", "").replace(/^\//, "") || "home";
  return `mobilize-${part.replace(/\//g, "-")}`;
}

function roleProfile(roleNames: string[]): "super_admin" | "admin" | "local_leader" | "member" | "other" {
  if (isSuperAdminUser(roleNames)) return "super_admin";
  if (roleNames.includes("admin")) return "admin";
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
        description: `Hi ${name}. This tour walks through your dashboard: national overview, chapters, Mobilize, administrator tools, and Settings. Use Back and Next to move. Press Skip or the X to exit.`,
      };
    case "admin":
      return {
        title: "Welcome, administrator",
        description: `Hi ${name}. You can manage chapters, leaders, community members, events, training content, and system settings. This tour highlights only the menu items available to your role.`,
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
    title: "Chapters",
    description:
      "View and manage chapters (locations, contacts, and chapter-level settings). Administrators use this to keep chapter records up to date.",
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
    title: "Events",
    description:
      "Create and manage gatherings and events: schedules, locations, registration, and published event pages.",
  },
  [MODULE_SLUGS.movilization]: {
    title: "Mobilize",
    description:
      "Mobilization hub (super administrators): maps, groups, activities, and mobilize-specific notifications. The sidebar turns red while you are inside Mobilize.",
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

const MOBILIZE_COPY: Record<string, { title: string; description: string }> = {
  map: {
    title: "Map & Groups",
    description: "Geographic view of groups and mobilization activity. Explore regions and group locations on the map.",
  },
  "my-groups": {
    title: "My Groups",
    description: "Groups you follow or manage within Mobilize. Open a group to see members and details.",
  },
  activities: {
    title: "Upcoming Activities",
    description: "Scheduled mobilization activities and events. Plan and review what is coming up.",
  },
  notifications: {
    title: "Mobilize notifications",
    description: "Alerts and messages specific to Mobilize workflows (separate from dashboard-wide announcements).",
  },
  settings: {
    title: "Mobilize settings",
    description: "Super-admin configuration for the Mobilize module: defaults, integrations, and module behavior.",
  },
};

type StepSide = "left" | "right" | "bottom" | "top" | "over";

function highlightHook(
  actions: DashboardTourActions,
  extra?: DriverHook
): DriverHook {
  return (element, step, opts) => {
    if (element) {
      prepareSidebarTarget(element, actions);
      scrollTourTargetIntoView(element);
    }
    extra?.(element, step, opts);
  };
}

function stepForSelector(
  selector: string,
  title: string,
  description: string,
  side: StepSide = "right",
  hooks?: { onHighlightStarted?: DriverHook; onNextClick?: DriverHook }
): DriveStep {
  return {
    element: selector,
    popover: {
      title,
      description,
      side,
      align: "start",
      onNextClick: hooks?.onNextClick,
    },
    onHighlightStarted: hooks?.onHighlightStarted,
  };
}

function stepForDynamicElement(
  resolve: () => Element | null,
  title: string,
  description: string,
  side: StepSide = "left",
  hooks?: { onHighlightStarted?: DriverHook; onNextClick?: DriverHook }
): DriveStep {
  return {
    element: () => resolve() ?? document.body,
    popover: {
      title,
      description,
      side,
      align: "start",
      onNextClick: hooks?.onNextClick,
    },
    onHighlightStarted: hooks?.onHighlightStarted,
  };
}

function filterStepsWithElements(steps: DriveStep[]): DriveStep[] {
  if (typeof document === "undefined") return steps;
  return steps.filter((step) => {
    const el = step.element;
    if (!el) return true;
    if (typeof el === "function") return true;
    if (typeof el === "string" && el.includes("profile-")) return true;
    if (typeof el === "string") return Boolean(document.querySelector(el));
    return true;
  });
}

export function buildMobilizeTourSteps(
  input: DashboardTourBuildInput,
  actions: DashboardTourActions
): DriveStep[] {
  const steps: DriveStep[] = [
    stepForSelector(
      '[data-tour="main-content"]',
      "Mobilize workspace",
      "You are inside the Mobilize section. The menu on the left lists map, groups, activities, and mobilize notifications. Use Back and Next to continue. Press Skip or the X to exit.",
      "over"
    ),
  ];

  for (const item of input.mobilizeNav) {
    const id = mobilizeNavTourAttr(item.href);
    const slug = id.replace("mobilize-", "");
    const copy = MOBILIZE_COPY[slug] ?? {
      title: item.label,
      description: `Open ${item.label} from the Mobilize menu.`,
    };
    steps.push(
      stepForSelector(MOBILIZE_SELECTOR(id), copy.title, copy.description, "right", {
        onHighlightStarted: highlightHook(actions),
      })
    );
  }

  steps.push(
    stepForSelector(
      '[data-tour="sidebar-sign-out"]',
      "Return to main dashboard",
      "Use this control at the bottom of the menu to leave Mobilize and go back to the main dashboard sidebar.",
      "right",
      { onHighlightStarted: highlightHook(actions) }
    )
  );

  steps.push(
    stepForSelector(
      '[data-tour="main-content"]',
      "Page content",
      "The main area shows the screen for whichever Mobilize item you selected. Select items from the left menu to switch views.",
      "top"
    )
  );

  return filterStepsWithElements(steps);
}

export function buildMainDashboardTourSteps(
  input: DashboardTourBuildInput,
  actions: DashboardTourActions
): DriveStep[] {
  const profile = roleProfile(input.roleNames);
  const welcome = welcomeCopy(profile, input.displayName);
  const elevated = isElevatedRole(input.roleNames);
  const sidebarHook = { onHighlightStarted: highlightHook(actions) };

  const steps: DriveStep[] = [
    {
      popover: {
        title: welcome.title,
        description: welcome.description,
        side: "over",
        align: "center",
      },
    },
    stepForSelector(
      '[data-tour="sidebar-toggle"]',
      "Sidebar menu",
      "Show or hide the left navigation panel. On phones, open the menu before following steps that highlight sidebar items.",
      "right",
      sidebarHook
    ),
  ];

  for (const item of input.visibleNav) {
    const copy = MODULE_COPY[item.module];
    if (!copy) continue;
    steps.push(stepForSelector(NAV_SELECTOR(item.module), copy.title, copy.description, "right", sidebarHook));
  }

  if (input.settingsNav.length > 0) {
    steps.push(
      stepForSelector(
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
      steps.push(stepForSelector(NAV_SELECTOR(item.module), copy.title, copy.description, "right", sidebarHook));
    }
  }

  steps.push(
    stepForSelector(
      '[data-tour="sidebar-profile"]',
      "Your profile",
      "This area opens your account panel on the right. We will open it for you in the next steps.",
      "right",
      {
        onHighlightStarted: highlightHook(actions, async (element, _step, { driver }) => {
          actions.openSidebar();
          actions.setProfileEditMode(false);
          actions.openProfileDrawer();
          await waitMs(450);
          if (element) scrollTourTargetIntoView(element);
          driver.refresh();
        }),
      }
    ),
    stepForSelector(
      '[data-tour="profile-drawer"]',
      "Profile panel",
      "Your profile drawer shows your photo, email, and role. Review your details here before making changes.",
      "left",
      {
        onHighlightStarted: highlightHook(actions, async (_el, _step, { driver }) => {
          actions.openProfileDrawer();
          actions.setProfileEditMode(false);
          await waitMs(200);
          driver.refresh();
        }),
      }
    ),
    stepForSelector(
      '[data-tour="profile-view"]',
      "Profile summary",
      "This is the read-only summary: your name, phone, and address as stored in the system.",
      "left",
      {
        onHighlightStarted: highlightHook(actions, async (_el, _step, { driver }) => {
          actions.openProfileDrawer();
          actions.setProfileEditMode(false);
          await waitMs(200);
          driver.refresh();
        }),
      }
    ),
    stepForSelector(
      '[data-tour="profile-edit-button"]',
      "Edit profile",
      "Press Next to open the editor and walk through the fields you can update.",
      "left",
      {
        onHighlightStarted: highlightHook(actions, async (_el, _step, { driver }) => {
          actions.openProfileDrawer();
          actions.setProfileEditMode(false);
          await waitMs(200);
          driver.refresh();
        }),
      }
    ),
    stepForDynamicElement(
      () => document.querySelector('[data-tour="profile-edit-form"]'),
      "Edit your details",
      "Update your first name, last name, display name, phone, and mailing address. Display name is what others see in the sidebar.",
      "left",
      {
        onHighlightStarted: highlightHook(actions, async (_el, _step, { driver }) => {
          actions.openProfileDrawer();
          actions.setProfileEditMode(true);
          await waitMs(350);
          const form = document.querySelector('[data-tour="profile-edit-form"]');
          if (form) scrollTourTargetIntoView(form);
          driver.refresh();
        }),
      }
    ),
    stepForDynamicElement(
      () => document.querySelector('[data-tour="profile-edit-email"]'),
      "Sign-in email",
      "If your organization allows it, you can request a verification code to change the email you use to sign in.",
      "left",
      {
        onHighlightStarted: highlightHook(actions, async (_el, _step, { driver }) => {
          actions.openProfileDrawer();
          actions.setProfileEditMode(true);
          await waitMs(300);
          const block = document.querySelector('[data-tour="profile-edit-email"]');
          if (block) scrollTourTargetIntoView(block);
          driver.refresh();
        }),
      }
    ),
    stepForDynamicElement(
      () => document.querySelector('[data-tour="profile-edit-photo"]'),
      "Profile photo",
      "Upload or remove your profile photo here (JPEG, PNG, WebP, or GIF — max 1 MB).",
      "left",
      {
        onHighlightStarted: highlightHook(actions, async (_el, _step, { driver }) => {
          actions.openProfileDrawer();
          actions.setProfileEditMode(true);
          await waitMs(300);
          const block = document.querySelector('[data-tour="profile-edit-photo"]');
          if (block) scrollTourTargetIntoView(block);
          driver.refresh();
        }),
      }
    ),
    stepForDynamicElement(
      () => document.querySelector('[data-tour="profile-save-actions"]'),
      "Save or cancel",
      "Use Save to apply your changes, or Cancel to discard edits and return to the profile summary.",
      "left",
      {
        onHighlightStarted: highlightHook(actions, async (_el, _step, { driver }) => {
          actions.openProfileDrawer();
          actions.setProfileEditMode(true);
          await waitMs(250);
          driver.refresh();
        }),
        onNextClick: async (_el, _step, { driver }) => {
          actions.setProfileEditMode(false);
          actions.closeProfileDrawer();
          await waitMs(300);
          driver.refresh();
          driver.moveNext();
        },
      }
    ),
    stepForSelector(
      '[data-tour="sidebar-sign-out"]',
      "Sign out",
      "Sign out securely when you are done. You will return to the login page.",
      "right",
      sidebarHook
    ),
    stepForSelector(
      '[data-tour="header-notifications"]',
      elevated && input.showSystemNotificationBell ? "System notifications" : "Announcements",
      elevated && input.showSystemNotificationBell
        ? "Quick access to system notification events (new sign-ups, completions, and similar alerts). Click the bell to read and dismiss items."
        : "Shortcut to organization announcements. The badge shows how many unread messages you have.",
      "bottom"
    ),
    stepForSelector(
      '[data-tour="header-tour-help"]',
      "Replay this tour",
      "Tap the question mark anytime to run this guided tour again.",
      "bottom"
    ),
    stepForSelector(
      '[data-tour="main-content"]',
      "Main workspace",
      "Page content appears here. Choose a menu item on the left to open a section; use the header for alerts and help.",
      "top"
    )
  );

  return filterStepsWithElements(steps);
}
