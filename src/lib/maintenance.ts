/** When true, all app routes show the maintenance page (set in .env.production on the VPS). */
export function isMaintenanceMode(): boolean {
  const v =
    process.env.MAINTENANCE_MODE ??
    process.env.NEXT_PUBLIC_MAINTENANCE_MODE ??
    "";
  const normalized = v.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

/** Paths that must keep working during maintenance (assets, maintenance page). */
export function isMaintenanceExemptPath(pathname: string): boolean {
  if (pathname === "/maintenance") return true;
  if (pathname.startsWith("/_next/")) return true;
  if (pathname.startsWith("/uploads/")) return true;
  if (pathname === "/favicon.ico" || pathname.startsWith("/favicon")) return true;
  if (/\.(svg|png|jpg|jpeg|gif|webp|ico)$/i.test(pathname)) return true;
  return false;
}

export const MAINTENANCE_ETA_ET = "3:00 PM Eastern Time";

export const MAINTENANCE_MESSAGE =
  "FlashPoint is under maintenance. We expect to be back by 3:00 PM Eastern Time. Thank you for your patience.";

/** Top banner (login + dashboard). Set MAINTENANCE_BANNER=0 in .env.production to hide after maintenance ends. */
export function isMaintenanceBannerEnabled(): boolean {
  const override = (process.env.MAINTENANCE_BANNER ?? "1").trim().toLowerCase();
  if (override === "0" || override === "false" || override === "no") return false;
  // Active by default when unset (including fresh deploys).
  return true;
}

export const MAINTENANCE_BANNER_BODY =
  "We are currently performing maintenance and updates to improve the platform experience based on your feedback. During this time, you may experience temporary interruptions or minor issues while doing the training. Our team is actively working to resolve everything as quickly as possible. Thank you for your patience and understanding.";

/** CSS variable set by MaintenanceBanner for fixed AppBar offset */
export const MAINTENANCE_BANNER_OFFSET_VAR = "--fp-maintenance-banner-offset";

export const MAINTENANCE_BANNER_DISMISS_KEY = "fp-maintenance-banner-dismissed";

/** After dismiss (X), show the banner again after this many minutes. */
export const MAINTENANCE_BANNER_DISMISS_MINUTES = 25;

export const MAINTENANCE_BANNER_DISMISS_MS =
  MAINTENANCE_BANNER_DISMISS_MINUTES * 60 * 1000;
