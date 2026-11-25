import {
  MOBILIZE_ACTIVITIES_HREF,
  MOBILIZE_ALERTS_HREF,
  MOBILIZE_BOOKMARKS_HREF,
  MOBILIZE_MESSAGES_HREF,
  MOBILIZE_SOCIAL_SETTINGS_HREF,
} from "@/lib/mobilize/mobilize-nav-config";
import { resolveMobilizeMobileHeaderTitle } from "@/lib/mobilize/mobilize-mobile-header-title";

/** Longest-prefix wins; paths must not include dynamic segments beyond segment. */
const DASHBOARD_MOBILE_TITLES: { prefix: string; title: string }[] = [
  { prefix: "/dashboard/notifications", title: "Mission Updates" },
  { prefix: "/dashboard/training", title: "Training" },
  { prefix: "/dashboard/gatherings", title: "Events" },
  { prefix: MOBILIZE_ACTIVITIES_HREF, title: "Deployments" },
  { prefix: "/dashboard/chapters", title: "Churches" },
  { prefix: "/dashboard/admins", title: "Administrators" },
  { prefix: "/dashboard/courses", title: "Courses" },
  { prefix: "/dashboard/settings/coaches", title: "Coaches" },
  { prefix: "/dashboard/settings/event-categories", title: "Event categories" },
  { prefix: "/dashboard/logs", title: "Logs" },
  { prefix: "/dashboard/emails", title: "Emails" },
  { prefix: "/dashboard/reports", title: "FPA Analytics" },
  { prefix: "/dashboard/admin/roles", title: "Roles & permissions" },
  { prefix: "/dashboard/community", title: "National Map" },
  { prefix: "/dashboard/onboarding", title: "Training" },
  { prefix: MOBILIZE_ALERTS_HREF, title: "Alerts" },
  { prefix: MOBILIZE_MESSAGES_HREF, title: "Messages" },
  { prefix: MOBILIZE_BOOKMARKS_HREF, title: "My saved" },
  { prefix: MOBILIZE_SOCIAL_SETTINGS_HREF, title: "Social settings" },
].sort((a, b) => b.prefix.length - a.prefix.length);

export function resolveDashboardMobileHeaderTitle(pathname: string): string | null {
  const mobilizeHub = resolveMobilizeMobileHeaderTitle(pathname);
  if (mobilizeHub) return mobilizeHub;

  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/national-overview")) {
    return "National Map";
  }

  for (const { prefix, title } of DASHBOARD_MOBILE_TITLES) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return title;
    }
  }

  return null;
}

export function isDashboardMobileTitleHeaderPage(pathname: string): boolean {
  return resolveDashboardMobileHeaderTitle(pathname) !== null;
}