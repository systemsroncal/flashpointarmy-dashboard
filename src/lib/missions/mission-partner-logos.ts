const MISSION_PARTNER_LOGOS: Record<string, string> = {
  "house.gov":
    "https://fparmychapters.com/wp-content/uploads/2026/07/US_House_of_Representatives.webp",
  "actforamerica.org":
    "https://fparmychapters.com/wp-content/uploads/2026/07/actforamerica.png",
  "patriotacademy.com":
    "https://fparmychapters.com/wp-content/uploads/2026/07/patriotacademy.png",
  "eac.gov": "https://fparmychapters.com/wp-content/uploads/2026/07/eac.png",
  "nsca.global": "https://fparmychapters.com/wp-content/uploads/2026/07/NSCA.webp",
  "rfia.org": "https://fparmychapters.com/wp-content/uploads/2026/07/rfia.png",
};

const TALL_PARTNER_LOGO_HOSTS = new Set(["house.gov", "actforamerica.org", "eac.gov"]);

export function missionPartnerLogoUrl(url?: string): string | null {
  if (!url) return null;
  try {
    const host = new URL(url).hostname.replace(/^www\./i, "");
    return MISSION_PARTNER_LOGOS[host] ?? null;
  } catch {
    return null;
  }
}

export function missionPartnerLogoUsesTallSize(
  url?: string,
  logoSize?: "default" | "tall"
): boolean {
  if (logoSize === "tall") return true;
  if (!url) return false;
  try {
    const host = new URL(url).hostname.replace(/^www\./i, "");
    return TALL_PARTNER_LOGO_HOSTS.has(host);
  } catch {
    return false;
  }
}
