"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Link as MuiLink,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import ViewListIcon from "@mui/icons-material/ViewList";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import NextLink from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMobilizeToast } from "@/components/mobilize/MobilizeToastProvider";

type Ev = {
  id: string;
  title: string;
  date_time: string;
  event_type: string;
  group_id: string;
  is_public: boolean;
  group_name?: string | null;
};

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

function ActivitiesInner() {
  const toast = useMobilizeToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const view: "list" | "calendar" = searchParams.get("view") === "calendar" ? "calendar" : "list";

  const [scope, setScope] = useState<"all" | "my">("all");
  const [events, setEvents] = useState<Ev[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState(() => new Date());

  function setViewAndUrl(next: "list" | "calendar") {
    const q = new URLSearchParams(searchParams.toString());
    if (next === "calendar") q.set("view", "calendar");
    else q.delete("view");
    const qs = q.toString();
    router.replace(qs ? `/dashboard/mobilize/activities?${qs}` : "/dashboard/mobilize/activities", {
      scroll: false,
    });
  }

  const range = useMemo(() => {
    const from = startOfMonth(cursor).toISOString();
    const to = endOfMonth(cursor).toISOString();
    return { from, to };
  }, [cursor]);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ scope });
      const res = await fetch(`/api/mobilize/activities?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load.");
      setEvents(json.events ?? []);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Error", "error");
    } finally {
      setLoading(false);
    }
  }, [scope, toast]);

  const loadCalendar = useCallback(async () => {
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
  }, [range.from, range.to, scope, toast]);

  useEffect(() => {
    if (view === "list") void loadList();
    else void loadCalendar();
  }, [view, loadList, loadCalendar]);

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

  const monthLabel = cursor.toLocaleString(undefined, { month: "long", year: "numeric" });

  const gridSx = {
    display: "grid",
    gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
    gap: 0.5,
  } as const;

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Upcoming Activities
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        Mobilize events from your groups and public listings. Switch between list and month calendar; filter by My
        groups or All.
      </Typography>

      <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1.5} sx={{ mb: 2 }}>
        <ToggleButtonGroup size="small" value={view} exclusive onChange={(_, v) => v && setViewAndUrl(v)} aria-label="View mode">
          <ToggleButton value="list" aria-label="List" sx={{ px: 1.25 }}>
            <Tooltip title="List">
              <ViewListIcon fontSize="small" />
            </Tooltip>
          </ToggleButton>
          <ToggleButton value="calendar" aria-label="Calendar" sx={{ px: 1.25 }}>
            <Tooltip title="Month calendar">
              <CalendarMonthIcon fontSize="small" />
            </Tooltip>
          </ToggleButton>
        </ToggleButtonGroup>

        <ToggleButtonGroup size="small" value={scope} exclusive onChange={(_, v) => v && setScope(v)} aria-label="Scope">
          <ToggleButton value="my">My groups</ToggleButton>
          <ToggleButton value="all">All</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {scope === "my" ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Events in groups where you have approved membership.
        </Typography>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Public Mobilize events plus events in groups you belong to.
        </Typography>
      )}

      {view === "calendar" ? (
        <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1 }}>
          <Button
            size="small"
            startIcon={<ChevronLeftIcon />}
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
          >
            Prev
          </Button>
          <Typography variant="h6" fontWeight={700} sx={{ flex: 1 }}>
            {monthLabel}
          </Typography>
          <Button
            size="small"
            endIcon={<ChevronRightIcon />}
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
          >
            Next
          </Button>
        </Stack>
      ) : null}

      {loading ? (
        <Skeleton variant="rectangular" height={view === "calendar" ? 420 : 320} sx={{ borderRadius: 1 }} />
      ) : view === "list" ? (
        <TableContainer
          sx={{
            bgcolor: "#ffffff",
            borderRadius: 1,
            border: "1px solid rgba(0,0,0,0.12)",
          }}
        >
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: "text.secondary" }}>When</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "text.secondary" }}>Event</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "text.secondary" }}>Group</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "text.secondary" }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "text.secondary", width: 100 }}>Listing</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {events.map((e) => (
                <TableRow key={e.id} hover sx={{ "& td": { borderColor: "rgba(0,0,0,0.06)" } }}>
                  <TableCell sx={{ whiteSpace: "nowrap", verticalAlign: "top" }}>
                    {new Date(e.date_time).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </TableCell>
                  <TableCell sx={{ verticalAlign: "top" }}>
                    <Typography fontWeight={600}>{e.title}</Typography>
                  </TableCell>
                  <TableCell sx={{ verticalAlign: "top", maxWidth: 200 }}>
                    <MuiLink component={NextLink} href={`/dashboard/mobilize/groups/${e.group_id}`} underline="hover">
                      {e.group_name?.trim() || "Open group"}
                    </MuiLink>
                  </TableCell>
                  <TableCell sx={{ verticalAlign: "top" }}>
                    <Chip size="small" label={e.event_type} variant="outlined" />
                  </TableCell>
                  <TableCell sx={{ verticalAlign: "top" }}>
                    {e.is_public ? (
                      <Chip size="small" label="Public" color="success" variant="outlined" />
                    ) : (
                      <Chip size="small" label="Group" variant="outlined" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
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
                      bgcolor: inMonth ? "#f3f4f6" : "#fafafa",
                      borderColor: inMonth ? "rgba(202, 154, 0, 0.35)" : "transparent",
                    }}
                  >
                    <CardContent sx={{ p: 0.75, "&:last-child": { pb: 0.75 } }}>
                      <Typography variant="caption" fontWeight={700}>
                        {day.getDate()}
                      </Typography>
                      {evs.slice(0, 2).map((e) => (
                        <NextLink
                          key={e.id}
                          href={`/dashboard/mobilize/groups/${e.group_id}`}
                          style={{ textDecoration: "none" }}
                        >
                          <Typography
                            variant="caption"
                            display="block"
                            noWrap
                            sx={{ color: "primary.light", lineHeight: 1.2 }}
                          >
                            {e.title}
                          </Typography>
                        </NextLink>
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

      {!loading && !events.length ? (
        <Typography color="text.secondary" sx={{ mt: 2 }}>
          No events in this range.
        </Typography>
      ) : null}
    </Box>
  );
}

export default function MobilizeActivitiesPage() {
  return (
    <Suspense fallback={<Skeleton variant="rectangular" height={360} sx={{ borderRadius: 1 }} />}>
      <ActivitiesInner />
    </Suspense>
  );
}
