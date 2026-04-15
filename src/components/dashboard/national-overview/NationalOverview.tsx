"use client";

import type { OverviewStatBlock } from "@/lib/stats/overview-stats";
import { loadStatePopupStats } from "@/lib/stats/overview-stats";
import { createClient } from "@/utils/supabase/client";
import AssignmentIndOutlined from "@mui/icons-material/AssignmentIndOutlined";
import BoltOutlined from "@mui/icons-material/BoltOutlined";
import CheckCircleOutline from "@mui/icons-material/CheckCircleOutline";
import GroupsOutlined from "@mui/icons-material/GroupsOutlined";
import PlaceOutlined from "@mui/icons-material/PlaceOutlined";
import { Box, Card, CardContent, Paper, Typography } from "@mui/material";
import type { SvgIconComponent } from "@mui/icons-material";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";

import {
  aggregateReferenceLeaderMemberByState,
  type CitiesDonorsJson,
} from "@/lib/donors/aggregate-donors-by-state";
import { CommunityInActionFeed, type ActivityFeedRow } from "./CommunityInActionFeed";
import { UsaChapterActivityMap } from "./UsaChapterActivityMap";

type ChapterRow = { id: string; name: string; state: string };

export function NationalOverview({
  initialStats,
  initialFeed,
  chapters,
}: {
  initialStats: OverviewStatBlock;
  initialFeed: ActivityFeedRow[];
  chapters: ChapterRow[];
}) {
  const [stats, setStats] = useState(initialStats);
  const [feed, setFeed] = useState(initialFeed);
  const [chapterRows, setChapterRows] = useState(chapters);
  /** Reference leaders/members by state (from city JSON); map fill only */
  const [referenceSplitByState, setReferenceSplitByState] = useState<
    Map<string, { leaders: number; members: number }>
  >(() => new Map());
  /** null until client mount / first refresh — avoids SSR vs client clock hydration mismatch */
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupState, setPopupState] = useState<string | null>(null);
  const [popupAnchor, setPopupAnchor] = useState<{ x: number; y: number } | null>(null);
  const [popupData, setPopupData] = useState<Awaited<
    ReturnType<typeof loadStatePopupStats>
  > | null>(null);

  const popupOpenRef = useRef(popupOpen);
  const popupStateRef = useRef(popupState);
  useEffect(() => {
    popupOpenRef.current = popupOpen;
  }, [popupOpen]);
  useEffect(() => {
    popupStateRef.current = popupState;
  }, [popupState]);

  useEffect(() => {
    setStats(initialStats);
  }, [initialStats]);

  useEffect(() => {
    setFeed(initialFeed);
  }, [initialFeed]);

  useEffect(() => {
    setChapterRows(chapters);
  }, [chapters]);

  const chapterCountByState = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of chapterRows) {
      const st = c.state?.trim().toUpperCase().slice(0, 2);
      if (!st) continue;
      m.set(st, (m.get(st) ?? 0) + 1);
    }
    return m;
  }, [chapterRows]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/backgrounds/cities_donors.json", { cache: "force-cache" });
        if (!res.ok) return;
        const json = (await res.json()) as CitiesDonorsJson;
        if (cancelled) return;
        setReferenceSplitByState(aggregateReferenceLeaderMemberByState(json));
      } catch {
        /* ignore missing or invalid JSON */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const reloadOverviewData = useCallback(async () => {
    const supabase = createClient();
    const { data: chData } = await supabase.from("chapters").select("id,name,state").order("name");
    const rows = chData ?? [];
    setChapterRows(rows);

    const { loadOverviewStats } = await import("@/lib/stats/overview-stats");
    const next = await loadOverviewStats(supabase, {
      scope: "national",
      stateCode: null,
    });
    setStats(next);

    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: feedData } = await supabase
      .from("community_activity")
      .select("id, feed_category, title, subtitle, state_code, created_at, icon_key")
      .gte("created_at", fiveMinAgo)
      .order("created_at", { ascending: false });
    setFeed((feedData ?? []).map((r) => ({ ...r, icon_key: r.icon_key ?? null })));

    if (popupOpenRef.current && popupStateRef.current) {
      const popup = await loadStatePopupStats(supabase, popupStateRef.current);
      setPopupData(popup);
    }

    setLastUpdatedAt(Date.now());
  }, []);

  useEffect(() => {
    const supabase = createClient();
    let channel: RealtimeChannel | null = null;
    const tables = [
      "community_activity",
      "chapters",
      "gatherings",
      "profiles",
      "user_roles",
      "chapter_leaders",
      "audit_logs",
    ] as const;

    try {
      channel = supabase.channel("national-overview-sync");
      for (const table of tables) {
        channel.on(
          "postgres_changes",
          { event: "*", schema: "public", table },
          () => {
            void reloadOverviewData();
          }
        );
      }
      void channel.subscribe();
    } catch {
      /* Realtime unavailable */
    }

    void reloadOverviewData();
    const interval = setInterval(() => void reloadOverviewData(), 25000);

    return () => {
      clearInterval(interval);
      if (channel) void supabase.removeChannel(channel);
    };
  }, [reloadOverviewData]);

  async function openStatePopup(code: string, anchor: { x: number; y: number }) {
    setPopupState(code);
    setPopupAnchor(anchor);
    setPopupOpen(true);
    setPopupData(null);
    const supabase = createClient();
    const data = await loadStatePopupStats(supabase, code);
    setPopupData(data);
  }

  function closeStatePopup() {
    setPopupOpen(false);
    setPopupState(null);
    setPopupAnchor(null);
    setPopupData(null);
  }

  const statCards = useMemo(
    () =>
      [
        {
          label: "Active Chapters",
          value: stats.activeChapters,
          color: "#3b82f6",
          icon: PlaceOutlined,
        },
        {
          label: "Community Gatherings",
          value: stats.communityGatherings,
          color: "#22c55e",
          icon: CheckCircleOutline,
        },
        {
          label: "Members Engaged",
          value: stats.membersEngaged,
          color: "#f97316",
          icon: GroupsOutlined,
        },
        {
          label: "Local Leaders",
          value: stats.localLeaders,
          color: "#eab308",
          icon: AssignmentIndOutlined,
        },
        {
          label: "Happening Now",
          value: stats.happeningNow,
          color: "#ef4444",
          icon: BoltOutlined,
          pulse: true,
        },
      ] as const satisfies ReadonlyArray<{
        label: string;
        value: number;
        color: string;
        icon: SvgIconComponent;
        pulse?: boolean;
      }>,
    [stats]
  );

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 800, color: "primary.main", letterSpacing: "0.04em" }}>
        FLASHPOINT ARMY COMMAND CENTER
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Real-time overview of community engagement across the nation.
      </Typography>
      <Typography variant="caption" color="success.main" display="block" sx={{ mb: 2 }}>
        System online · last updated:{" "}
        {lastUpdatedAt != null
          ? new Date(lastUpdatedAt).toLocaleTimeString()
          : "—"}
      </Typography>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3 }}>
        {statCards.map((s) => {
          const StatIcon = s.icon;
          return (
            <Box key={s.label} sx={{ flex: "1 1 160px", minWidth: 140, maxWidth: 220 }}>
              <Card
                sx={{
                  bgcolor: "rgba(0,0,0,0.45)",
                  border: `1px solid ${s.color}44`,
                  position: "relative",
                  overflow: "visible",
                }}
              >
                <CardContent sx={{ pt: 2, pb: 1.5, "&:last-child": { pb: 1.5 } }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.25 }}>
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: 1.5,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: `${s.color}55`,
                        boxShadow: `0 0 14px ${s.color}44`,
                        border: `1px solid ${s.color}`,
                      }}
                    >
                      <StatIcon sx={{ color: "#fff", fontSize: 24 }} />
                    </Box>
                    {"pulse" in s && s.pulse ? (
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          bgcolor: "#ef4444",
                          mt: 0.5,
                          boxShadow: "0 0 8px #ef4444",
                          animation: "fpPulse 1.5s ease-in-out infinite",
                          "@keyframes fpPulse": {
                            "0%, 100%": { opacity: 1 },
                            "50%": { opacity: 0.35 },
                          },
                        }}
                      />
                    ) : null}
                  </Box>
                  <Typography variant="h4" sx={{ color: "#fff", fontWeight: 800, lineHeight: 1.1 }}>
                    {s.value}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                    {s.label}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          );
        })}
      </Box>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "flex-start" }}>
        <Box sx={{ flex: "1 1 380px", minWidth: 280 }}>
          <Paper sx={{ p: 2, bgcolor: "rgba(0,0,0,0.4)" }}>
            <Typography variant="h6" sx={{ mb: 1, color: "primary.main" }}>
              Live chapter activity map
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
              Click a state for statistics. Drag to pan, scroll or use +/− to zoom.
            </Typography>
            <UsaChapterActivityMap
              chapterCountByState={chapterCountByState}
              referenceSplitByState={referenceSplitByState}
              selectedStateCode={popupState}
              popupOpen={popupOpen}
              popupAnchor={popupAnchor}
              onSelectState={(code, anchor) => void openStatePopup(code, anchor)}
              onClosePopup={closeStatePopup}
            >
              <Box>
                {popupState && (() => {
                  const ref = referenceSplitByState.get(popupState);
                  if (!ref || (ref.leaders === 0 && ref.members === 0)) return null;
                  return (
                    <Box sx={{ mb: 1.25, pb: 1.25, borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.75 }}>
                        Reference (city file: per city 1 leader + remaining as members, summed by state)
                      </Typography>
                      {(
                        [
                          ["Leaders", ref.leaders, "#7c3aed"],
                          ["Members", ref.members, "#15803d"],
                        ] as const
                      ).map(([label, val, col]) => (
                        <Box key={label} sx={{ display: "flex", justifyContent: "space-between", py: 0.75 }}>
                          <Typography variant="body2" sx={{ fontSize: "0.8rem" }}>
                            {label}
                          </Typography>
                          <Box
                            component="span"
                            sx={{
                              bgcolor: col,
                              color: "#fff",
                              px: 1.25,
                              py: 0.25,
                              borderRadius: 10,
                              fontSize: "0.8rem",
                              fontWeight: 700,
                            }}
                          >
                            {val}
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  );
                })()}
                {popupData ? (
                  <>
                    {[
                      ["Active Chapters", popupData.activeChapters, "#0ea5e9"],
                      ["Registered Members", popupData.registeredMembers, "#15803d"],
                      ["Upcoming Gatherings", popupData.upcomingGatherings, "#ca8a04"],
                      ["Local Leaders", popupData.localLeaders, "#7c3aed"],
                      ["Recent community events", popupData.recentCommunityEvents, "#b91c1c"],
                    ].map(([label, val, col]) => (
                      <Box key={String(label)} sx={{ display: "flex", justifyContent: "space-between", py: 0.75 }}>
                        <Typography variant="body2" sx={{ fontSize: "0.8rem" }}>
                          {label}
                        </Typography>
                        <Box
                          component="span"
                          sx={{
                            bgcolor: col as string,
                            color: "#fff",
                            px: 1.25,
                            py: 0.25,
                            borderRadius: 10,
                            fontSize: "0.8rem",
                            fontWeight: 700,
                          }}
                        >
                          {val as number}
                        </Box>
                      </Box>
                    ))}
                    <Box sx={{ mt: 1.5, pt: 1.5, borderTop: "1px solid rgba(255,255,255,0.12)" }}>
                      <Typography variant="caption" display="block">
                        Newest chapter: {popupData.newestChapterName}
                      </Typography>
                      <Typography variant="caption" display="block">
                        City: {popupData.newestChapterCity}
                      </Typography>
                      <Typography variant="caption" display="block">
                        Last activity:{" "}
                        {popupData.lastActivity
                          ? new Date(popupData.lastActivity).toLocaleString()
                          : "—"}
                      </Typography>
                    </Box>
                  </>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Loading dashboard stats…
                  </Typography>
                )}
              </Box>
            </UsaChapterActivityMap>
          </Paper>
        </Box>
        <Box
          sx={{
            width: "100%",
            maxWidth: 345,
            minWidth: 285,
            flex: "0 0 auto",
          }}
        >
          <Paper sx={{ p: 1.75, bgcolor: "rgba(0,0,0,0.4)" }}>
            <Typography variant="h6" sx={{ mb: 0.25, color: "primary.main", fontSize: "1rem" }}>
              Community in Action
            </Typography>
            <Typography variant="caption" color="error.main" sx={{ display: "block", mb: 0.5 }}>
              LIVE · last 5 minutes
            </Typography>
            <Box sx={{ maxHeight: 380, overflow: "auto", mx: -0.5 }}>
              <CommunityInActionFeed items={feed} />
            </Box>
          </Paper>
        </Box>
      </Box>

    </Box>
  );
}
