"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Skeleton,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import Link from "next/link";
import { useMobilizeToast } from "@/components/mobilize/MobilizeToastProvider";

type Ev = { id: string; title: string; date_time: string; group_id: string; is_public: boolean };

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

export default function MobilizeCalendarPage() {
  const toast = useMobilizeToast();
  const [cursor, setCursor] = useState(() => new Date());
  const [events, setEvents] = useState<Ev[]>([]);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState<"all" | "my">("all");

  const range = useMemo(() => {
    const from = startOfMonth(cursor).toISOString();
    const to = endOfMonth(cursor).toISOString();
    return { from, to };
  }, [cursor]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ from: range.from, to: range.to, scope });
        const res = await fetch(`/api/mobilize/calendar?${params}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load.");
        setEvents(json.events ?? []);
      } catch (e) {
        toast(e instanceof Error ? e.message : "Error", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [range.from, range.to, scope, toast]);

  const label = cursor.toLocaleString(undefined, { month: "long", year: "numeric" });

  const weeks = useMemo(() => {
    const first = startOfMonth(cursor);
    const startWeekday = first.getDay();
    const gridStart = new Date(first);
    gridStart.setDate(first.getDate() - startWeekday);
    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      days.push(d);
    }
    const chunks: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) chunks.push(days.slice(i, i + 7));
    return { chunks };
  }, [cursor]);

  function dayEvents(day: Date) {
    const key = day.toDateString();
    return events.filter((e) => new Date(e.date_time).toDateString() === key);
  }

  const gridSx = {
    display: "grid",
    gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
    gap: 0.5,
  } as const;

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Calendar
      </Typography>
      <ToggleButtonGroup
        size="small"
        value={scope}
        exclusive
        onChange={(_, v) => v && setScope(v)}
        sx={{ mb: 2 }}
      >
        <ToggleButton value="my">My groups</ToggleButton>
        <ToggleButton value="all">All</ToggleButton>
      </ToggleButtonGroup>
      <StackRow label={label} cursor={cursor} setCursor={setCursor} />
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {scope === "my"
          ? "Events in groups you belong to (approved membership)."
          : "Public Mobilize events plus events in groups you belong to."}
      </Typography>
      {loading ? (
        <Skeleton height={420} />
      ) : (
        <Box>
          <Box sx={{ ...gridSx, mb: 0.5 }}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <Typography key={d} variant="caption" color="text.secondary" align="center" display="block">
                {d}
              </Typography>
            ))}
          </Box>
          {weeks.chunks.map((week, wi) => (
            <Box sx={{ ...gridSx, mb: 0.5 }} key={wi}>
              {week.map((day) => {
                const inMonth = day.getMonth() === cursor.getMonth() && day.getFullYear() === cursor.getFullYear();
                const evs = dayEvents(day);
                return (
                  <Card
                    key={day.toISOString()}
                    variant="outlined"
                    sx={{
                      minHeight: 88,
                      bgcolor: inMonth ? "rgba(0,0,0,0.25)" : "rgba(0,0,0,0.1)",
                      borderColor: inMonth ? "rgba(255,215,0,0.12)" : "transparent",
                    }}
                  >
                    <CardContent sx={{ p: 0.75, "&:last-child": { pb: 0.75 } }}>
                      <Typography variant="caption" fontWeight={700}>
                        {day.getDate()}
                      </Typography>
                      {evs.slice(0, 2).map((e) => (
                        <Link key={e.id} href={`/dashboard/mobilize/groups/${e.group_id}`} style={{ textDecoration: "none" }}>
                          <Typography
                            variant="caption"
                            display="block"
                            noWrap
                            sx={{ color: "primary.light", lineHeight: 1.2 }}
                          >
                            {e.title}
                          </Typography>
                        </Link>
                      ))}
                      {evs.length > 2 ? (
                        <Typography variant="caption" color="text.secondary">
                          +{evs.length - 2} more
                        </Typography>
                      ) : null}
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

function StackRow({
  label,
  cursor,
  setCursor,
}: {
  label: string;
  cursor: Date;
  setCursor: (d: Date) => void;
}) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
      <Button
        size="small"
        startIcon={<ChevronLeftIcon />}
        onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
      >
        Prev
      </Button>
      <Typography variant="h5" fontWeight={700} sx={{ flex: 1 }}>
        {label}
      </Typography>
      <Button
        size="small"
        endIcon={<ChevronRightIcon />}
        onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
      >
        Next
      </Button>
    </Box>
  );
}
