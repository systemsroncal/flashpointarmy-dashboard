"use client";

import { useDashboardUser } from "@/contexts/DashboardUserContext";
import {
  coachMeetingScheduleLabel,
  coachMeetingTopic,
} from "@/lib/onboarding/coach-meeting-labels";
import type { MissionRankAudience } from "@/lib/onboarding/member-onboarding-status";
import { buildHalfHourSlots } from "@/lib/coach-meeting/booking";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type MeetingRecord = {
  status: string;
  coaching_at: string | null;
  ends_at: string | null;
  duration_minutes: number;
  meeting_type: string;
  topic: string | null;
  description: string | null;
};

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

function formatDisplayWhen(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

type Props = {
  audience: MissionRankAudience;
};

export function CoachMeetingBookingForm({ audience }: Props) {
  const router = useRouter();
  const user = useDashboardUser();
  const timeSlots = useMemo(() => buildHalfHourSlots(), []);
  const topic = coachMeetingTopic(audience);
  const scheduleLabel = coachMeetingScheduleLabel(audience);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [record, setRecord] = useState<MeetingRecord | null>(null);
  const [trainingComplete, setTrainingComplete] = useState(false);

  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState(timeSlots[0]?.label ?? "9:00 AM");
  const [description, setDescription] = useState("");
  const [occupiedSlots, setOccupiedSlots] = useState<Set<string>>(new Set());
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const calendarCells = useMemo(() => buildCalendarDays(calendarMonth), [calendarMonth]);
  const monthLabel = calendarMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const loadRecord = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/onboarding/coach-meetings/me", { cache: "no-store" });
      const json = (await res.json()) as {
        error?: string;
        record?: MeetingRecord;
        training?: string;
      };
      if (!res.ok) throw new Error(json.error ?? "Failed to load.");
      setRecord(json.record ?? null);
      setTrainingComplete(json.training === "completed");
      if (json.record?.description) setDescription(json.record.description);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRecord();
  }, [loadRecord]);

  useEffect(() => {
    if (!selectedDate) {
      setOccupiedSlots(new Set());
      return;
    }
    let cancelled = false;
    setSlotsLoading(true);
    void (async () => {
      try {
        const res = await fetch(
          `/api/onboarding/coach-meetings/availability?date=${encodeURIComponent(selectedDate)}`,
          { cache: "no-store" }
        );
        const json = (await res.json()) as { occupiedSlots?: string[]; error?: string };
        if (!res.ok) throw new Error(json.error ?? "Failed to load availability.");
        if (!cancelled) setOccupiedSlots(new Set(json.occupiedSlots ?? []));
      } catch {
        if (!cancelled) setOccupiedSlots(new Set());
      } finally {
        if (!cancelled) setSlotsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedDate]);

  const alreadyBooked = record?.coaching_at && record.status !== "pending" && record.status !== "locked";
  const canBook = trainingComplete && !alreadyBooked && record?.status !== "completed";

  async function handleSubmit() {
    if (!selectedDate) {
      setFormError("Please select a date.");
      return;
    }
    if (occupiedSlots.has(selectedTime)) {
      setFormError("That time slot is occupied. Please choose another.");
      return;
    }
    setSaving(true);
    setFormError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/onboarding/coach-meetings/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate,
          timeSlot: selectedTime,
          description,
        }),
      });
      const json = (await res.json()) as { error?: string; record?: MeetingRecord };
      if (!res.ok) throw new Error(json.error ?? "Booking failed.");
      setRecord(json.record ?? null);
      setSuccess("Your meeting has been scheduled.");
      router.refresh();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Booking failed.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (loadError) {
    return <Alert severity="error">{loadError}</Alert>;
  }

  if (!trainingComplete) {
    return (
      <Alert severity="info">
        Complete all Biblical Citizenship sessions before scheduling your {topic.toLowerCase()}.
      </Alert>
    );
  }

  if (record?.status === "completed") {
    return (
      <Alert severity="success">
        Your {topic.toLowerCase()} has been marked completed. You can proceed to Choose Your Mission.
      </Alert>
    );
  }

  return (
    <Paper sx={{ p: { xs: 2, sm: 3 }, bgcolor: "rgba(0,0,0,0.35)", maxWidth: 640, mx: "auto" }}>
      <Stack spacing={2.5}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
            {scheduleLabel}
          </Typography>
          <Typography color="text.secondary" variant="body2">
            Choose a date and time. Sessions are {record?.duration_minutes ?? 30} minutes. Your
            account name and email ({user.email}) will be used automatically.
          </Typography>
        </Box>

        {alreadyBooked ? (
          <Alert severity="info">
            <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
              Scheduled meeting
            </Typography>
            <Typography variant="body2">
              {formatDisplayWhen(record?.coaching_at ?? null)}
              {record?.ends_at ? ` – ends ${formatDisplayWhen(record.ends_at)}` : ""}
            </Typography>
            <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
              Topic: {record?.topic ?? topic} · Status: {record?.status}
            </Typography>
          </Alert>
        ) : null}

        {success ? <Alert severity="success">{success}</Alert> : null}
        {formError ? <Alert severity="error">{formError}</Alert> : null}

        {canBook ? (
          <>
            <TextField
              select
              label="Meeting topic"
              value={topic}
              fullWidth
              slotProps={{ input: { readOnly: true } }}
            >
              <MenuItem value={topic}>{topic}</MenuItem>
            </TextField>

            <Box>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {monthLabel}
                </Typography>
                <Stack direction="row" spacing={0.5}>
                  <Button size="small" onClick={() => setCalendarMonth((p) => new Date(p.getFullYear(), p.getMonth() - 1, 1))}>
                    Prev
                  </Button>
                  <Button size="small" onClick={() => setCalendarMonth((p) => new Date(p.getFullYear(), p.getMonth() + 1, 1))}>
                    Next
                  </Button>
                </Stack>
              </Stack>
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0.5, mb: 1 }}>
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                  <Typography key={d} variant="caption" sx={{ textAlign: "center", fontWeight: 700, color: "text.secondary" }}>
                    {d}
                  </Typography>
                ))}
                {calendarCells.map((cell, i) => {
                  if (!cell.inMonth) return <Box key={`pad-${i}`} />;
                  const past = cell.date ? isPastDate(cell.date) : true;
                  const selected = selectedDate === cell.date;
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
                        bgcolor: selected ? "primary.main" : "transparent",
                        color: selected ? "#111" : "text.primary",
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
              disabled={!selectedDate || slotsLoading}
              helperText={
                slotsLoading
                  ? "Loading availability…"
                  : selectedDate
                    ? "Occupied slots are disabled."
                    : "Select a date first."
              }
            >
              {timeSlots.map((slot) => (
                <MenuItem key={slot.label} value={slot.label} disabled={occupiedSlots.has(slot.label)}>
                  {slot.label}
                  {occupiedSlots.has(slot.label) ? " (occupied)" : ""}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Notes (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              multiline
              minRows={2}
            />

            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <CalendarMonthIcon />}
              onClick={() => void handleSubmit()}
              disabled={saving || !selectedDate}
              sx={{ alignSelf: "flex-start", fontWeight: 700 }}
            >
              Confirm booking
            </Button>
          </>
        ) : null}
      </Stack>
    </Paper>
  );
}
