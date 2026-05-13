export type AnnouncementCta = {
  label: string;
  url: string;
  /** Default true when omitted */
  open_in_new_tab?: boolean;
  bg_color: string;
  text_color: string;
};

export type DashboardAnnouncementRow = {
  id: string;
  title: string;
  description: string;
  expires_at: string | null;
  read_more_collapsed: boolean;
  ctas: AnnouncementCta[];
  created_at: string;
  updated_at: string;
  created_by: string | null;
};

export type AnnouncementListItem = DashboardAnnouncementRow & {
  read_at: string | null;
};

export function normalizeCtas(raw: unknown): AnnouncementCta[] {
  if (!Array.isArray(raw)) return [];
  const out: AnnouncementCta[] = [];
  for (const x of raw.slice(0, 3)) {
    if (!x || typeof x !== "object") continue;
    const o = x as Record<string, unknown>;
    const label = String(o.label ?? "").trim();
    const url = String(o.url ?? "").trim();
    if (!label || !url) continue;
    out.push({
      label,
      url,
      open_in_new_tab: o.open_in_new_tab !== false,
      bg_color: String(o.bg_color ?? "#1976d2").trim() || "#1976d2",
      text_color: String(o.text_color ?? "#ffffff").trim() || "#ffffff",
    });
  }
  return out;
}
