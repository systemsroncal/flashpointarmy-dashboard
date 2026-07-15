/** Initials for subgroup avatar circles (max 2 chars). */
export function mobilizeGroupInitials(name: string): string {
  const cleaned = String(name ?? "").trim();
  if (!cleaned) return "?";
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]!.charAt(0)}${parts[1]!.charAt(0)}`.toUpperCase();
  }
  return cleaned.slice(0, 2).toUpperCase();
}
