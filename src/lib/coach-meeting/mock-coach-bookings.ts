/** Prototype coach-meeting bookings (localStorage only — no server yet). */

export type CoachMeetingBooking = {
  id: string;
  date: string;
  time: string;
  name: string;
  email: string;
  topic: string;
  createdAt: string;
};

const STORAGE_KEY = "fp-mock-coach-meetings";

function safeParse(raw: string | null): CoachMeetingBooking[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (b): b is CoachMeetingBooking =>
        typeof b === "object" &&
        b !== null &&
        typeof (b as CoachMeetingBooking).id === "string" &&
        typeof (b as CoachMeetingBooking).date === "string"
    );
  } catch {
    return [];
  }
}

export function loadCoachMeetings(): CoachMeetingBooking[] {
  if (typeof window === "undefined") return [];
  return safeParse(localStorage.getItem(STORAGE_KEY));
}

export function saveCoachMeeting(
  input: Omit<CoachMeetingBooking, "id" | "createdAt">
): CoachMeetingBooking {
  const booking: CoachMeetingBooking = {
    ...input,
    id: `meet-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };
  const all = [...loadCoachMeetings(), booking];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  return booking;
}
