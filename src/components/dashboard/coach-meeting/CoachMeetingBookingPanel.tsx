"use client";

import {
  loadCoachMeetings,
  saveCoachMeeting,
  type CoachMeetingBooking,
} from "@/lib/coach-meeting/mock-coach-bookings";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarDays, faCheck } from "@fortawesome/free-solid-svg-icons";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import EventIcon from "@mui/icons-material/Event";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";

const TIME_SLOTS = [
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
];

const TOPICS = [
  "First coach check-in",
  "Mission planning",
  "Chapter launch support",
  "Training follow-up",
];

function formatDisplayDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function buildCalendarDays(anchor: Date): { date: string; label: number; inMonth: boolean }[] {
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const first = new Date(year, month, 1);
  const startPad = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: { date: string; label: number; inMonth: boolean }[] = [];

  for (let i = 0; i < startPad; i++) {
    cells.push({ date: "", label: 0, inMonth: false });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    cells.push({ date: iso, label: day, inMonth: true });
  }
  return cells;
}

function isPastDate(iso: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(`${iso}T12:00:00`);
  return d < today;
}

type Props = {
  /** Rendered beside the schedule button (e.g. Mark session as completed). */
  markCompleteSlot: ReactNode;
};

export function CoachMeetingBookingPanel({ markCompleteSlot }: Props) {
  const router = useRouter();
  const [bookings, setBookings] = useState<CoachMeetingBooking[]>([]);
  const [bookOpen, setBookOpen] = useState(false);
  const [detail, setDetail] = useState<CoachMeetingBooking | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState(TOPICS[0]!);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState(TIME_SLOTS[1]!);
  const [bookedMessage, setBookedMessage] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setBookings(loadCoachMeetings());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const calendarCells = useMemo(() => buildCalendarDays(calendarMonth), [calendarMonth]);
  const monthLabel = calendarMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const bookingsByDate = useMemo(() => {
    const map = new Map<string, CoachMeetingBooking[]>();
    for (const b of bookings) {
      const list = map.get(b.date) ?? [];
      list.push(b);
      map.set(b.date, list);
    }
    return map;
  }, [bookings]);

  function openBookingDialog() {
    setBookedMessage(null);
    setSelectedDate("");
    setBookOpen(true);
  }

  function handleBook() {
    if (!name.trim() || !email.trim() || !selectedDate) {
      setBookedMessage("Please fill in your name, email, and a date.");
      return;
    }
    const saved = saveCoachMeeting({
      name: name.trim(),
      email: email.trim(),
      topic,
      date: selectedDate,
      time: selectedTime,
    });
    refresh();
    setBookOpen(false);
    setDetail(saved);
  }

  function shiftMonth(delta: number) {
    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  }

  return (
    <>
      <Stack spacing={2} sx={{ width: "100%", maxWidth: 560, mx: "auto" }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          alignItems="stretch"
          justifyContent="center"
        >
          {markCompleteSlot}
          <Button
            variant="contained"
            color="primary"
            startIcon={<CalendarMonthIcon />}
            onClick={openBookingDialog}
            sx={{ minHeight: 48, fontWeight: 700, touchAction: "manipulation", whiteSpace: "nowrap" }}
          >
            Schedule coach meeting
          </Button>
        </Stack>

        {bookings.length > 0 ? (
          <Box
            sx={{
              border: "1px solid rgba(255,215,0,0.35)",
              borderRadius: 2,
              p: 2,
              bgcolor: "rgba(0,0,0,0.25)",
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
              <FontAwesomeIcon icon={faCalendarDays} style={{ color: "#e6b422", fontSize: 18 }} />
              <Typography sx={{ fontWeight: 700, color: "#fff", fontSize: "0.95rem" }}>
                Your scheduled meetings
              </Typography>
            </Stack>
            <Stack spacing={1}>
              {bookings.map((b) => (
                <Button
                  key={b.id}
                  variant="outlined"
                  onClick={() => setDetail(b)}
                  startIcon={<EventIcon />}
                  sx={{
                    justifyContent: "flex-start",
                    textAlign: "left",
                    borderColor: "rgba(255,255,255,0.25)",
                    color: "rgba(255,255,255,0.92)",
                    py: 1.25,
                    "&:hover": { borderColor: "primary.main", bgcolor: "rgba(255,215,0,0.08)" },
                  }}
                >
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {formatDisplayDate(b.date)} · {b.time}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.65)" }}>
                      {b.topic}
                    </Typography>
                  </Box>
                </Button>
              ))}
            </Stack>
          </Box>
        ) : null}
      </Stack>

      <Dialog open={bookOpen} onClose={() => setBookOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Request a coach meeting</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.65 }}>
            Choose a date and time for your first coach check-in. This is a preview flow — your
            selection is saved locally in this browser only.
          </Typography>

          {bookedMessage ? (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {bookedMessage}
            </Alert>
          ) : null}

          <Stack spacing={2}>
            <TextField
              label="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              required
            />
            <TextField
              select
              label="Meeting topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              fullWidth
            >
              {TOPICS.map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </TextField>

            <Box>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {monthLabel}
                </Typography>
                <Stack direction="row" spacing={0.5}>
                  <Button size="small" onClick={() => shiftMonth(-1)}>
                    Prev
                  </Button>
                  <Button size="small" onClick={() => shiftMonth(1)}>
                    Next
                  </Button>
                </Stack>
              </Stack>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                  gap: 0.5,
                  mb: 1,
                }}
              >
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                  <Typography
                    key={d}
                    variant="caption"
                    sx={{ textAlign: "center", fontWeight: 700, color: "text.secondary" }}
                  >
                    {d}
                  </Typography>
                ))}
                {calendarCells.map((cell, i) => {
                  if (!cell.inMonth) return <Box key={`pad-${i}`} />;
                  const past = cell.date ? isPastDate(cell.date) : true;
                  const selected = selectedDate === cell.date;
                  const hasBooking = Boolean(bookingsByDate.get(cell.date)?.length);
                  return (
                    <Button
                      key={cell.date}
                      size="small"
                      disabled={past}
                      onClick={() => setSelectedDate(cell.date)}
                      sx={{
                        minWidth: 0,
                        p: 0.5,
                        fontWeight: selected ? 800 : 500,
                        bgcolor: selected ? "primary.main" : hasBooking ? "rgba(25,118,210,0.12)" : "transparent",
                        color: selected ? "#111" : "text.primary",
                        border: hasBooking && !selected ? "1px solid rgba(25,118,210,0.4)" : "none",
                      }}
                    >
                      {cell.label}
                    </Button>
                  );
                })}
              </Box>
            </Box>

            <TextField
              select
              label="Time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              fullWidth
            >
              {TIME_SLOTS.map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setBookOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleBook}>
            Confirm booking
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(detail)} onClose={() => setDetail(null)} maxWidth="xs" fullWidth>
        {detail ? (
          <>
            <DialogTitle sx={{ fontWeight: 800 }}>Meeting details</DialogTitle>
            <DialogContent>
              <Stack spacing={1.25}>
                <Typography variant="body2">
                  <strong>Date:</strong> {formatDisplayDate(detail.date)}
                </Typography>
                <Typography variant="body2">
                  <strong>Time:</strong> {detail.time}
                </Typography>
                <Typography variant="body2">
                  <strong>Topic:</strong> {detail.topic}
                </Typography>
                <Typography variant="body2">
                  <strong>Name:</strong> {detail.name}
                </Typography>
                <Typography variant="body2">
                  <strong>Email:</strong> {detail.email}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ pt: 1 }}>
                  Status: Scheduled (prototype)
                </Typography>
              </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2, flexDirection: "column", alignItems: "stretch", gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<FontAwesomeIcon icon={faCheck} />}
                onClick={() => {
                  setDetail(null);
                  router.push("/dashboard/missions");
                }}
                sx={{
                  border: "1px solid",
                  borderColor: "primary.main",
                  bgcolor: "transparent",
                  color: "primary.main",
                  fontWeight: 700,
                  py: 1.1,
                  "&:hover": { bgcolor: "rgba(255,215,0,0.08)", borderColor: "primary.main" },
                }}
              >
                Completed
              </Button>
              <Button onClick={() => setDetail(null)} sx={{ alignSelf: "flex-end" }}>
                Close
              </Button>
            </DialogActions>
          </>
        ) : null}
      </Dialog>
    </>
  );
}
