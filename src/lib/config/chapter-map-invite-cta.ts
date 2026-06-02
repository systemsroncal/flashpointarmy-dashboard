import { isElevatedRole } from "@/lib/auth/user-roles";

/**
 * Invite CTA below the national overview map.
 * Always shown for platform admins; otherwise dev/local hosts only (hidden on prod for members).
 */
export function isChapterMapInviteCtaEnabledForUser(roleNames: string[]): boolean {
  if (isElevatedRole(roleNames)) return true;
  return isChapterMapInviteCtaEnabledByEnvironment();
}

/** Dev/local hosts — not shown on production app URL for non-elevated users. */
export function isChapterMapInviteCtaEnabledByEnvironment(): boolean {
  if (process.env.NODE_ENV === "development") {
    return true;
  }

  const base = (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    ""
  ).toLowerCase();

  if (base.includes("dev.fparmychapters.com")) return true;
  if (base.includes("localhost") || base.includes("127.0.0.1")) return true;

  return false;
}

/** @deprecated Prefer {@link isChapterMapInviteCtaEnabledForUser} */
export function isChapterMapInviteCtaEnabled(): boolean {
  return isChapterMapInviteCtaEnabledByEnvironment();
}
