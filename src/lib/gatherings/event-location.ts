/** Chapter area for display (no street line — street lives on user profiles). */
export function formatEventLocationLine(opts: {
  is_virtual: boolean;
  location_manual?: string | null;
  use_chapter_address: boolean;
  chapter: {
    name: string;
    city?: string | null;
    state?: string | null;
    zip_code?: string | null;
  } | null;
}): string {
  if (opts.is_virtual) return "Virtual event";
  const manual = opts.location_manual?.trim();
  if (manual) return manual;
  const ch = opts.chapter;
  if (!ch) return "Location TBD";
  if (opts.use_chapter_address) {
    const area = [ch.city, ch.state, ch.zip_code].filter(Boolean).join(", ");
    return area || ch.name;
  }
  return ch.name || "Location TBD";
}
