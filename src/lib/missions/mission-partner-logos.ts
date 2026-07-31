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

export type MissionPartnerLogoSize = {
  width: string;
  height?: number;
};

const CUSTOM_PARTNER_LOGO_SIZES: Record<string, MissionPartnerLogoSize> = {
  "rfia.org": { width: "27%", height: 37 },
  "nsca.global": { width: "26%" },
  "patriotacademy.com": { width: "29%" },
};

function partnerLogoHost(url?: string): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./i, "");
  } catch {
    return null;
  }
}

export function missionPartnerLogoCustomSize(url?: string): MissionPartnerLogoSize | null {
  const host = partnerLogoHost(url);
  if (!host) return null;
  return CUSTOM_PARTNER_LOGO_SIZES[host] ?? null;
}

export function missionPartnerLogoUrl(url?: string): string | null {
  if (!url) return null;
  const host = partnerLogoHost(url);
  if (!host) return null;
  return MISSION_PARTNER_LOGOS[host] ?? null;
}

export function missionPartnerLogoUsesTallSize(
  url?: string,
  logoSize?: "default" | "tall"
): boolean {
  if (logoSize === "tall") return true;
  const host = partnerLogoHost(url);
  if (!host) return false;
  return TALL_PARTNER_LOGO_HOSTS.has(host);
}
