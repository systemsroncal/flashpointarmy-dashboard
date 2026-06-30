export const COACH_MEETING_DURATION_MINUTES = 30;

/** Local business hours for booking slots (30-minute increments). */
export const BOOKING_DAY_START_MINUTES = 9 * 60;
export const BOOKING_DAY_END_MINUTES = 17 * 60 + 30;

export type CoachMeetingBookingRecord = {
  user_id: string;
  status: string;
  coach_id: string | null;
  coaching_at: string | null;
  ends_at: string | null;
  duration_minutes: number;
  meeting_type: string;
  topic: string | null;
  description: string | null;
  observations: string | null;
  updated_at: string;
};

export function buildHalfHourSlots(): { label: string; minutes: number }[] {
  const slots: { label: string; minutes: number }[] = [];
  for (let m = BOOKING_DAY_START_MINUTES; m <= BOOKING_DAY_END_MINUTES; m += 30) {
    const h24 = Math.floor(m / 60);
    const min = m % 60;
    const period = h24 >= 12 ? "PM" : "AM";
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
    slots.push({
      label: `${h12}:${String(min).padStart(2, "0")} ${period}`,
      minutes: m,
    });
  }
  return slots;
}

export function slotLabelToMinutes(label: string): number | null {
  const match = label.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  let h = Number(match[1]);
  const min = Number(match[2]);
  const period = match[3]!.toUpperCase();
  if (min !== 0 && min !== 30) return null;
  if (period === "PM" && h !== 12) h += 12;
  if (period === "AM" && h === 12) h = 0;
  return h * 60 + min;
}

export function composeCoachingAtIso(dateIso: string, slotLabel: string): string | null {
  const minutes = slotLabelToMinutes(slotLabel);
  if (minutes === null) return null;
  const [y, mo, d] = dateIso.split("-").map(Number);
  if (!y || !mo || !d) return null;
  const h = Math.floor(minutes! / 60);
  const min = minutes! % 60;
  const dt = new Date(y, mo - 1, d, h, min, 0, 0);
  if (Number.isNaN(dt.getTime())) return null;
  return dt.toISOString();
}

export function addMinutesIso(iso: string, minutes: number): string {
  return new Date(new Date(iso).getTime() + minutes * 60_000).toISOString();
}

export function rangesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
): boolean {
  const a0 = new Date(aStart).getTime();
  const a1 = new Date(aEnd).getTime();
  const b0 = new Date(bStart).getTime();
  const b1 = new Date(bEnd).getTime();
  return a0 < b1 && b0 < a1;
}

export function isSlotOccupied(
  slotStartIso: string,
  durationMinutes: number,
  bookings: { coaching_at: string; ends_at: string | null; duration_minutes: number | null; user_id: string }[],
  excludeUserId?: string
): boolean {
  const start = slotStartIso;
  const end = addMinutesIso(start, durationMinutes);
  for (const b of bookings) {
    if (!b.coaching_at) continue;
    if (excludeUserId && b.user_id === excludeUserId) continue;
    const bEnd =
      b.ends_at ??
      addMinutesIso(b.coaching_at, b.duration_minutes ?? COACH_MEETING_DURATION_MINUTES);
    if (rangesOverlap(start, end, b.coaching_at, bEnd)) return true;
  }
  return false;
}

export function occupiedSlotLabelsForDate(
  dateIso: string,
  bookings: { coaching_at: string; ends_at: string | null; duration_minutes: number | null; user_id: string }[],
  excludeUserId?: string
): Set<string> {
  const occupied = new Set<string>();
  for (const slot of buildHalfHourSlots()) {
    const iso = composeCoachingAtIso(dateIso, slot.label);
    if (!iso) continue;
    if (isSlotOccupied(iso, COACH_MEETING_DURATION_MINUTES, bookings, excludeUserId)) {
      occupied.add(slot.label);
    }
  }
  return occupied;
}
