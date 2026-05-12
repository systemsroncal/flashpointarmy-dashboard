"use client";

import { Box, Button, Card, CardContent, Stack, Typography, Skeleton } from "@mui/material";
import { useEffect, useMemo, useState } from "react";

type Ev = { id: string; title: string; starts_at: string; event_type: string };

export function MobilizeCalendarView() {
  const [events, setEvents] = useState<Ev[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/mobilize/activities");
      const json = await res.json();
      if (!cancelled && res.ok) setEvents((json.events ?? []) as Ev[]);
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const { year, month, daysInMonth, startWeekday } = useMemo(() => {
    const y = cursor.getFullYear();
    const m = cursor.getMonth();
    const first = new Date(y, m, 1);
    const last = new Date(y, m + 1, 0);
    return {
      year: y,
      month: m,
      daysInMonth: last.getDate(),
      startWeekday: first.getDay(),
    };
  }, [cursor]);

  const byDay = useMemo(() => {
    const map = new Map<number, Ev[]>();
    for (const e of events) {
      const d = new Date(e.starts_at);
      if (d.getFullYear() !== year || d.getMonth() !== month) continue;
      const day = d.getDate();
      const arr = map.get(day) ?? [];
      arr.push(e);
      map.set(day, arr);
    }
    return map;
  }, [events, month, year]);

  if (loading) return <Skeleton height={320} />;

  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="h5" fontWeight={700}>
          Calendar
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button size="small" onClick={() => setCursor(new Date(year, month - 1, 1))}>
            Previous
          </Button>
          <Button size="small" onClick={() => setCursor(new Date(year, month + 1, 1))}>
            Next
          </Button>
        </Stack>
      </Stack>
      <Typography variant="subtitle1">
        {cursor.toLocaleString(undefined, { month: "long", year: "numeric" })}
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 1,
        }}
      >
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <Typography key={d} variant="caption" color="text.secondary" textAlign="center">
            {d}
          </Typography>
        ))}
        {cells.map((day, idx) =>
          day == null ? (
            <Box key={`e-${idx}`} />
          ) : (
            <Card key={day} variant="outlined" sx={{ minHeight: 88, bgcolor: "rgba(0,0,0,0.2)" }}>
              <CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}>
                <Typography variant="caption" fontWeight={700}>
                  {day}
                </Typography>
                {(byDay.get(day) ?? []).slice(0, 2).map((e) => (
                  <Typography key={e.id} variant="caption" display="block" noWrap>
                    {e.title}
                  </Typography>
                ))}
              </CardContent>
            </Card>
          )
        )}
      </Box>
    </Stack>
  );
}
