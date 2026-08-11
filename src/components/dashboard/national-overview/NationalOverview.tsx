"use client";

import type { OverviewStatBlock } from "@/lib/stats/overview-stats";
import { loadStatePopupStats } from "@/lib/stats/overview-stats";
import { createClient } from "@/utils/supabase/client";
import AssignmentIndOutlined from "@mui/icons-material/AssignmentIndOutlined";
import BoltOutlined from "@mui/icons-material/BoltOutlined";
import FlagOutlined from "@mui/icons-material/FlagOutlined";
import GroupWorkOutlined from "@mui/icons-material/GroupWorkOutlined";
import GroupsOutlined from "@mui/icons-material/GroupsOutlined";
import PlaceOutlined from "@mui/icons-material/PlaceOutlined";
import ShareOutlined from "@mui/icons-material/ShareOutlined";
import { Box, Card, CardContent, Paper, Typography } from "@mui/material";
import type { SvgIconComponent } from "@mui/icons-material";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";

import {
  isChapterStaffRole,
  isElevatedRole,
  isMemberOrLeader,
  isSuperAdminUser,
} from "@/lib/auth/user-roles";
import {
  aggregateReferenceLeaderMemberByState,
  type CitiesDonorsJson,
} from "@/lib/donors/aggregate-donors-by-state";
import { loadCommunityActivityFeed, COMMUNITY_ACTIVITY_FEED_LIMIT, isHiddenCommunityFeedRow } from "@/lib/community/community-activity-feed";
import { CommunityInActionFeed, type ActivityFeedRow } from "./CommunityInActionFeed";
import { getNotificationSoundEnabled } from "@/lib/notifications/notification-sound-pref";
import { playCommunityActionSoundAlert } from "@/lib/notifications/play-community-action-sound";
import { InviteFriendsBanner } from "./InviteFriendsBanner";
import { MemberOnboardingProgressCard } from "./MemberOnboardingProgressCard";
import type { MemberOnboardingSnapshot } from "@/lib/onboarding/member-onboarding-status";
import dynamic from "next/dynamic";

const UsaChapterActivityMap = dynamic(
  () =>
    import("./UsaChapterActivityMap").then((mod) => ({ default: mod.UsaChapterActivityMap })),
  {
    ssr: false,
    loading: () => (
      <Box
        sx={{
          minHeight: { xs: 320, sm: 400, md: 480 },
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 1,
          border: "1px solid rgba(255, 215, 0, 0.3)",
          bgcolor: "rgba(0,0,0,0.35)",
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Loading map…
        </Typography>
      </Box>
    ),
  }
);

type ChapterRow = { id: string; name: string; state: string; status?: string | null };

const US_NATIONAL_FLAG_SRC =
  "https://upload.wikimedia.org/wikipedia/commons/a/a4/Flag_of_the_United_States.svg";

const drawerLikeScrollbarSx = {
  scrollbarWidth: "thin" as const,
  scrollbarColor: "rgba(255,215,0,0.18) transparent",
  "&::-webkit-scrollbar": { width: 5 },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: "rgba(255,215,0,0.14)",
    borderRadius: 8,
    border: "1px solid transparent",
    backgroundClip: "padding-box",
  },
  "&::-webkit-scrollbar-thumb:hover": {
    backgroundColor: "rgba(255,215,0,0.28)",
  },
  "&::-webkit-scrollbar-track": {
    backgroundColor: "transparent",
  },
  "&::-webkit-scrollbar-corner": { background: "transparent" },
} as const;

export function NationalOverview({
  initialStats,
  initialFeed,
  chapters,
  memberOnboarding = null,
  viewerRoles = [],
}: {
  initialStats: OverviewStatBlock;
  initialFeed: ActivityFeedRow[];
  chapters: ChapterRow[];
  memberOnboarding?: MemberOnboardingSnapshot | null;
  viewerRoles?: string[];
}) {
  const [stats, setStats] = useState(initialStats);
  const [feed, setFeed] = useState(initialFeed);
  const [chapterRows, setChapterRows] = useState(chapters);
  /** Reference members by state (from city JSON); map fill only */
  const [referenceSplitByState, setReferenceSplitByState] = useState<
    Map<string, { leaders: number; members: number }>
  >(() => new Map());
  /** null until client mount / first refresh — avoids SSR vs client clock hydration mismatch */
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupState, setPopupState] = useState<string | null>(null);
  const [popupData, setPopupData] = useState<Awaited<
    ReturnType<typeof loadStatePopupStats>
  > | null>(null);

  const popupOpenRef = useRef(popupOpen);
  const popupStateRef = useRef(popupState);
  const mapColumnRef = useRef<HTMLDivElement>(null);
  const mapSectionRef = useRef<HTMLDivElement>(null);
  const [feedPanelHeight, setFeedPanelHeight] = useState<number | null>(null);
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
    feedKnownIdsRef.current = new Set(initialFeed.map((r) => r.id));
    feedSoundReadyRef.current = false;
  }, [initialFeed]);

  useEffect(() => {
    const ids = feed.map((r) => r.id);
    if (!feedSoundReadyRef.current) {
      feedKnownIdsRef.current = new Set(ids);
      if (ids.length > 0) feedSoundReadyRef.current = true;
      return;
    }
    let hasNew = false;
    for (const id of ids) {
      if (!feedKnownIdsRef.current.has(id)) {
        feedKnownIdsRef.current.add(id);
        hasNew = true;
      }
    }
    if (hasNew && getNotificationSoundEnabled()) {
      playCommunityActionSoundAlert();
    }
  }, [feed]);

  useEffect(() => {
    setChapterRows(chapters);
  }, [chapters]);

  /** Match Community in Action card height to the map column (map sets the height; feed scrolls inside). */
  useEffect(() => {
    const el = mapColumnRef.current;
    if (!el) return;
    const syncHeight = () => {
      setFeedPanelHeight(el.getBoundingClientRect().height);
    };
    syncHeight();
    const ro = new ResizeObserver(syncHeight);
    ro.observe(el);
    window.addEventListener("resize", syncHeight);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", syncHeight);
    };
  }, []);

  const chapterCountByState = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of chapterRows) {
      if (c.status && c.status !== "approved") continue;
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
    try {
      const supabase = createClient();
      const { data: chData } = await supabase.from("chapters").select("id,name,state,status").order("name");
      const rows = chData ?? [];
      setChapterRows(rows);

      const statsRes = await fetch("/api/stats/overview", { cache: "no-store" });
      if (!statsRes.ok) throw new Error("Overview stats request failed.");
      const next = (await statsRes.json()) as OverviewStatBlock;
      setStats(next);

      const feedData = await loadCommunityActivityFeed(supabase);
      setFeed(feedData);

      if (popupOpenRef.current && popupStateRef.current) {
        const popup = await loadStatePopupStats(supabase, popupStateRef.current);
        setPopupData(popup);
      }

      setLastUpdatedAt(Date.now());
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[NationalOverview] refresh failed (network/Supabase)", err);
      }
    }
  }, []);

  const overviewReloadBusyRef = useRef(false);
  const overviewReloadQueuedRef = useRef(false);
  const realtimeOverviewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedSoundReadyRef = useRef(false);
  const feedKnownIdsRef = useRef<Set<string>>(new Set());

  const kickReloadOverview = useCallback(async () => {
    if (overviewReloadBusyRef.current) {
      overviewReloadQueuedRef.current = true;
      return;
    }
    overviewReloadBusyRef.current = true;
    try {
      do {
        overviewReloadQueuedRef.current = false;
        await reloadOverviewData();
      } while (overviewReloadQueuedRef.current);
    } finally {
      overviewReloadBusyRef.current = false;
    }
  }, [reloadOverviewData]);

  const scheduleRealtimeOverviewReload = useCallback(() => {
    if (realtimeOverviewTimerRef.current) clearTimeout(realtimeOverviewTimerRef.current);
    realtimeOverviewTimerRef.current = setTimeout(() => {
      realtimeOverviewTimerRef.current = null;
      void kickReloadOverview();
    }, 900);
  }, [kickReloadOverview]);

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
      "mobilize_groups",
      "member_journey_milestones",
    ] as const;

    try {
      channel = supabase.channel("national-overview-sync");
      channel.on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "community_activity" },
        (payload) => {
          const row = payload.new as ActivityFeedRow & { actor_user_id?: string | null };
          if (!row?.id) return;
          if (isHiddenCommunityFeedRow(row)) return;
          setFeed((prev) => {
            if (prev.some((r) => r.id === row.id)) return prev;
            const next: ActivityFeedRow[] = [
              {
                id: String(row.id),
                feed_category: String(row.feed_category ?? ""),
                title: String(row.title ?? ""),
                subtitle: (row.subtitle as string | null) ?? null,
                state_code: (row.state_code as string | null) ?? null,
                created_at: String(row.created_at ?? new Date().toISOString()),
                icon_key: (row.icon_key as string | null) ?? null,
                actor_user_id: (row.actor_user_id as string | null) ?? null,
              },
              ...prev,
            ];
            return next.slice(0, COMMUNITY_ACTIVITY_FEED_LIMIT);
          });
          scheduleRealtimeOverviewReload();
        }
      );
      for (const table of tables) {
        if (table === "community_activity") continue;
        channel.on(
          "postgres_changes",
          { event: "*", schema: "public", table },
          () => {
            scheduleRealtimeOverviewReload();
          }
        );
      }
      void channel.subscribe();
    } catch {
      /* Realtime unavailable */
    }

    void kickReloadOverview();
    const interval = setInterval(() => void kickReloadOverview(), 25000);

    return () => {
      clearInterval(interval);
      if (realtimeOverviewTimerRef.current) clearTimeout(realtimeOverviewTimerRef.current);
      if (channel) void supabase.removeChannel(channel);
    };
  }, [kickReloadOverview, scheduleRealtimeOverviewReload]);

  useEffect(() => {
    const runAutoTick = () => {
      void fetch("/api/community/activity/auto-tick", { method: "POST" }).catch(() => {});
    };
    void runAutoTick();
    const autoTickInterval = setInterval(runAutoTick, 10 * 60 * 1000);
    return () => clearInterval(autoTickInterval);
  }, []);

  const scrollMapSectionIntoView = useCallback(() => {
    const el = mapSectionRef.current;
    if (!el) return;
    const headerOffset = 64;
    const rect = el.getBoundingClientRect();
    if (Math.abs(rect.top - headerOffset) <= 20) return;
    const top = Math.max(0, window.scrollY + rect.top - headerOffset);
    window.scrollTo({ top, behavior: "smooth" });
  }, []);

  async function openStatePopup(code: string) {
    scrollMapSectionIntoView();
    setPopupState(code);
    setPopupOpen(true);
    setPopupData(null);
    const supabase = createClient();
    const data = await loadStatePopupStats(supabase, code);
    setPopupData(data);
  }

  function closeStatePopup() {
    setPopupOpen(false);
    setPopupState(null);
    setPopupData(null);
  }

  const statCards = useMemo(() => {
    const chapterStaff = isChapterStaffRole(viewerRoles);
    const memberLeaderOnly = isMemberOrLeader(viewerRoles) && !chapterStaff;
    const superAdmin = isSuperAdminUser(viewerRoles);
    const adminOrSuper = isElevatedRole(viewerRoles);

    type StatCard = {
      label: string;
      value: number;
      color: string;
      icon: SvgIconComponent;
      pulse?: boolean;
    };

    const cards: StatCard[] = [
      {
        label: "Churches",
        value: stats.activeChapters,
        color: "#3b82f6",
        icon: PlaceOutlined,
      },
    ];

    if (memberLeaderOnly) {
      cards.push({
        label: "Members",
        value: stats.membersEngaged + stats.localLeaders,
        color: "#f97316",
        icon: GroupsOutlined,
      });
    } else if (chapterStaff) {
      cards.push(
        {
          label: "Members",
          value: stats.membersEngaged,
          color: "#f97316",
          icon: GroupsOutlined,
        },
        {
          label: "Leader Recruitment",
          value: stats.localLeaders,
          color: "#eab308",
          icon: AssignmentIndOutlined,
        }
      );
    }

    if (superAdmin) {
      cards.push({
        label: "Groups",
        value: stats.mobilizeGroups,
        color: "#8b5cf6",
        icon: GroupWorkOutlined,
      });
    }

    if (adminOrSuper) {
      cards.push({
        label: "People shared",
        value: stats.inviteSharers ?? 0,
        color: "#22c55e",
        icon: ShareOutlined,
      });
    }

    cards.push(
      {
        label: "Started Missions",
        value: stats.peopleInMissions,
        color: "#06b6d4",
        icon: FlagOutlined,
      },
      {
        label: "Happening Now",
        value: stats.happeningNow,
        color: "#ef4444",
        icon: BoltOutlined,
        pulse: true,
      }
    );

    return cards;
  }, [stats, viewerRoles]);

  return (
    <Box>
      <Box sx={{ display: { xs: "block", md: "none" }, mb: 2 }}>
        <InviteFriendsBanner />
      </Box>
      <Typography variant="h4" sx={{ fontWeight: 800, color: "primary.main", letterSpacing: "0.04em" }}>
        Command Center
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

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2, minmax(0, 1fr))",
            sm: "repeat(auto-fill, minmax(160px, 1fr))",
          },
          gap: 2,
          mb: 3,
        }}
      >
        {statCards.map((s) => {
          const StatIcon = s.icon;
          return (
            <Box key={s.label} sx={{ minWidth: 0, width: "100%" }}>
              <Card
                sx={{
                  bgcolor: "rgba(0,0,0,0.45)",
                  border: `1px solid ${s.color}44`,
                  position: "relative",
                  overflow: "visible",
                  height: "100%",
                }}
              >
                {"pulse" in s && s.pulse ? (
                  <Box
                    sx={{
                      position: "absolute",
                      top: { xs: 10, sm: 14 },
                      right: { xs: 10, sm: 14 },
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      bgcolor: "#ef4444",
                      boxShadow: "0 0 8px #ef4444",
                      animation: "fpPulse 1.5s ease-in-out infinite",
                      "@keyframes fpPulse": {
                        "0%, 100%": { opacity: 1 },
                        "50%": { opacity: 0.35 },
                      },
                      zIndex: 1,
                    }}
                  />
                ) : null}
                <CardContent
                  sx={{
                    py: { xs: 1.25, sm: 2 },
                    px: { xs: 1.25, sm: 2 },
                    pb: { xs: 1.25, sm: 1.5 },
                    "&:last-child": { pb: { xs: 1.25, sm: 1.5 } },
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: { xs: "row", sm: "column" },
                      alignItems: { xs: "center", sm: "stretch" },
                      gap: { xs: 1.25, sm: 0 },
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: { xs: "flex-start", sm: "flex-start" },
                        alignItems: { xs: "center", sm: "flex-start" },
                        mb: { xs: 0, sm: 1.25 },
                        flexShrink: 0,
                      }}
                    >
                      <Box
                        sx={{
                          width: { xs: 40, sm: 44 },
                          height: { xs: 40, sm: 44 },
                          borderRadius: 1.5,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          bgcolor: s.color,
                          boxShadow: `0 0 27px ${s.color}`,
                          border: `1px solid ${s.color}`,
                          flexShrink: 0,
                        }}
                      >
                        <StatIcon sx={{ color: "#fff", fontSize: { xs: 22, sm: 24 } }} />
                      </Box>
                    </Box>
                    <Box sx={{ minWidth: 0, flex: { xs: 1, sm: "none" }, pr: { xs: 1.5, sm: 0 } }}>
                      <Typography
                        variant="h4"
                        sx={{
                          color: "#fff",
                          fontWeight: 800,
                          lineHeight: 1.1,
                          fontSize: { xs: "1.35rem", sm: "2.125rem" },
                        }}
                      >
                        {s.value}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: "block",
                          mt: { xs: 0.25, sm: 0.5 },
                          lineHeight: 1.25,
                          fontSize: { xs: "0.7rem", sm: "0.75rem" },
                        }}
                      >
                        {s.label}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          );
        })}
      </Box>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "flex-start" }}>
        <Box ref={mapColumnRef} sx={{ flex: "1 1 380px", minWidth: 280 }}>
          {memberOnboarding ? <MemberOnboardingProgressCard snapshot={memberOnboarding} /> : null}
          <Paper ref={mapSectionRef} sx={{ p: 2, bgcolor: "rgba(0,0,0,0.4)", scrollMarginTop: 72 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mb: 1,
              }}
            >
              <Box
                component="img"
                src={US_NATIONAL_FLAG_SRC}
                alt=""
                aria-hidden
                sx={{
                  width: 28,
                  height: 18,
                  objectFit: "cover",
                  borderRadius: 0.5,
                  flexShrink: 0,
                  boxShadow: "0 0 0 1px rgba(255,255,255,0.12)",
                }}
              />
              <Typography variant="h6" sx={{ color: "primary.main", lineHeight: 1.25 }}>
                FlashPoint Army Across America
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
              Click a state for statistics. Drag to pan, scroll or use +/− to zoom.
            </Typography>
            <UsaChapterActivityMap
              chapterCountByState={chapterCountByState}
              referenceSplitByState={referenceSplitByState}
              selectedStateCode={popupState}
              popupOpen={popupOpen}
              onSelectState={(code) => void openStatePopup(code)}
              onClosePopup={closeStatePopup}
            >
              <Box>
                {popupData ? (
                  <>
                    {(() => {
                      const ref = popupState ? referenceSplitByState.get(popupState) : undefined;
                      const rl = ref?.leaders ?? 0;
                      const rm = ref?.members ?? 0;
                      const totalLeadersMembers = rl + rm; // Suma de leaders + members
                      
                      return ([
                        ["Churches", popupData.churches, "#0ea5e9"],
                        ["Registered Members", totalLeadersMembers, "#15803d"],
                        ["Upcoming Events", popupData.upcomingEvents, "#ca8a04"],
                      ] as const).map(([label, val, col]) => (
                        <Box key={label} sx={{ display: "flex", justifyContent: "space-between", py: 0.85 }}>
                          <Typography variant="body2" sx={{ fontSize: "0.95rem", fontWeight: 600 }}>
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
                      ));
                    })()}
                    <Box sx={{ mt: 1.5, pt: 1.5, borderTop: "1px solid rgba(255,255,255,0.12)" }}>
                      <Typography variant="body2" display="block" sx={{ fontSize: "0.9rem", mb: 0.35 }}>
                        Newest Church: {popupData.newestChurchName}
                      </Typography>
                      <Typography variant="body2" display="block" sx={{ fontSize: "0.9rem" }}>
                        City: {popupData.newestChurchCity}
                      </Typography>
                    </Box>
                  </>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.95rem" }}>
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
            maxWidth: { xs: "100%", md: 345 },
            minWidth: { xs: 0, sm: 285 },
            flex: { xs: "1 1 100%", md: "0 0 auto" },
            display: "flex",
            flexDirection: "column",
            ...(feedPanelHeight != null ? { height: { xs: "auto", md: feedPanelHeight } } : {}),
          }}
        >
          <Box sx={{ display: { xs: "none", md: "block" } }}>
            <InviteFriendsBanner />
          </Box>
          <Paper
            sx={{
              p: 1.75,
              bgcolor: "rgba(0,0,0,0.4)",
              flex: 1,
              display: "flex",
              flexDirection: "column",
              height: { xs: 480, md: "auto" },
              minHeight: { xs: 480, md: 0 },
              maxHeight: { xs: 480, md: "none" },
              overflow: "hidden",
            }}
          >
            <Typography variant="h6" sx={{ mb: 0.25, color: "primary.main", fontSize: "1rem" }}>
              Community in Action
            </Typography>
            <Typography variant="caption" color="error.main" sx={{ display: "block", mb: 0.5 }}>
              Last 25 activities · past 24 hours
            </Typography>
            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                overflow: "auto",
                mx: -0.5,
                ...drawerLikeScrollbarSx,
              }}
            >
              <CommunityInActionFeed items={feed} />
            </Box>
          </Paper>
        </Box>
      </Box>

    </Box>
  );
}
