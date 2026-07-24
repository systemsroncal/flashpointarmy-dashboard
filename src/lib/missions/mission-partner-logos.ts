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

export function missionPartnerLogoUrl(url?: string): string | null {
  if (!url) return null;
  try {
    const host = new URL(url).hostname.replace(/^www\./i, "");
    return MISSION_PARTNER_LOGOS[host] ?? null;
  } catch {
    return null;
  }
}
