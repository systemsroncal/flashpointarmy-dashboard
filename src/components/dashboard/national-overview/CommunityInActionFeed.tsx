"use client";

import AccessTime from "@mui/icons-material/AccessTime";
import BoltOutlined from "@mui/icons-material/BoltOutlined";
import CalendarMonthOutlined from "@mui/icons-material/CalendarMonthOutlined";
import CampaignOutlined from "@mui/icons-material/CampaignOutlined";
import EditNoteOutlined from "@mui/icons-material/EditNoteOutlined";
import LocationOnOutlined from "@mui/icons-material/LocationOnOutlined";
import PersonAddAltOutlined from "@mui/icons-material/PersonAddAltOutlined";
import SecurityOutlined from "@mui/icons-material/SecurityOutlined";
import ScheduleOutlined from "@mui/icons-material/ScheduleOutlined";
import StarOutlined from "@mui/icons-material/StarOutlined";
import TrendingUpOutlined from "@mui/icons-material/TrendingUpOutlined";
import { Box, Chip, Typography } from "@mui/material";
import type { SvgIconComponent } from "@mui/icons-material";

export type ActivityFeedRow = {
  id: string;
  feed_category: string;
  title: string;
  subtitle: string | null;
  state_code: string | null;
  created_at: string;
  icon_key: string | null;
};

type FeedVisual = {
  categoryLabel: string;
  Icon: SvgIconComponent;
  railBg: string;
  glow: string;
  iconColor: string;
};

function englishCategoryLabel(row: ActivityFeedRow): string {
  const c = row.feed_category.trim().toLowerCase();
  const byCat: Record<string, string> = {
    chapter: "Chapter",
    member: "Member",
    leadership: "Leadership",
    gathering: "Gathering",
    manual: "Manual log",
    upcoming_gatherings: "Upcoming gatherings",
    hosted_events: "Recently hosted events",
    growth: "Growth milestone",
    community: "Community",
  };
  if (byCat[c]) return byCat[c];
  return c
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function resolveFeedVisual(row: ActivityFeedRow): FeedVisual {
  const cat = row.feed_category.trim().toLowerCase();
  const key = (row.icon_key || "").trim().toLowerCase();

  const purple: FeedVisual = {
    categoryLabel: englishCategoryLabel(row),
    Icon: CalendarMonthOutlined,
    railBg: "rgba(76, 29, 149, 0.55)",
    glow: "rgba(167, 139, 250, 0.45)",
    iconColor: "#e9d5ff",
  };
  const tealClock: FeedVisual = {
    categoryLabel: englishCategoryLabel(row),
    Icon: ScheduleOutlined,
    railBg: "rgba(15, 118, 110, 0.5)",
    glow: "rgba(45, 212, 191, 0.4)",
    iconColor: "#99f6e4",
  };
  const goldLead: FeedVisual = {
    categoryLabel: englishCategoryLabel(row),
    Icon: CampaignOutlined,
    railBg: "rgba(113, 63, 18, 0.55)",
    glow: "rgba(252, 211, 77, 0.35)",
    iconColor: "#fde68a",
  };
  const navyBolt: FeedVisual = {
    categoryLabel: englishCategoryLabel(row),
    Icon: BoltOutlined,
    railBg: "rgba(30, 58, 138, 0.55)",
    glow: "rgba(147, 197, 253, 0.4)",
    iconColor: "#bfdbfe",
  };
  const tealGrowth: FeedVisual = {
    categoryLabel: englishCategoryLabel(row),
    Icon: TrendingUpOutlined,
    railBg: "rgba(19, 78, 74, 0.55)",
    glow: "rgba(110, 231, 183, 0.35)",
    iconColor: "#a7f3d0",
  };
  const blueChapter: FeedVisual = {
    categoryLabel: englishCategoryLabel(row),
    Icon: LocationOnOutlined,
    railBg: "rgba(30, 64, 175, 0.5)",
    glow: "rgba(96, 165, 250, 0.4)",
    iconColor: "#93c5fd",
  };
  const orangeMember: FeedVisual = {
    categoryLabel: englishCategoryLabel(row),
    Icon: PersonAddAltOutlined,
    railBg: "rgba(154, 52, 18, 0.5)",
    glow: "rgba(251, 146, 60, 0.35)",
    iconColor: "#fed7aa",
  };
  const starLeader: FeedVisual = {
    categoryLabel: englishCategoryLabel(row),
    Icon: StarOutlined,
    railBg: "rgba(113, 63, 18, 0.5)",
    glow: "rgba(252, 211, 77, 0.35)",
    iconColor: "#fef08a",
  };
  const manualNote: FeedVisual = {
    categoryLabel: englishCategoryLabel(row),
    Icon: EditNoteOutlined,
    railBg: "rgba(30, 41, 59, 0.65)",
    glow: "rgba(148, 163, 184, 0.35)",
    iconColor: "#e2e8f0",
  };
  const securityManual: FeedVisual = {
    categoryLabel: englishCategoryLabel(row),
    Icon: SecurityOutlined,
    railBg: "rgba(127, 29, 29, 0.5)",
    glow: "rgba(248, 113, 113, 0.35)",
    iconColor: "#fecaca",
  };

  if (key === "calendar") return purple;
  if (key === "clock") return tealClock;
  if (key === "trend") return tealGrowth;
  if (key === "location") return blueChapter;
  if (key === "person") return orangeMember;
  if (key === "star") return starLeader;
  if (key === "bolt") return navyBolt;
  if (key === "edit_note") return manualNote;
  if (key === "shield") return securityManual;

  if (cat === "upcoming_gatherings" || cat === "gathering") return purple;
  if (cat === "hosted_events") return tealClock;
  if (cat === "growth") return tealGrowth;
  if (cat === "leadership") return goldLead;
  if (cat === "chapter") return blueChapter;
  if (cat === "member") return orangeMember;
  if (cat === "manual") return manualNote;

  return navyBolt;
}

function formatFeedDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatFeedTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function FeedRow({ row }: { row: ActivityFeedRow }) {
  const visual = resolveFeedVisual(row);
  const Icon = visual.Icon;
  const state = row.state_code?.trim().toUpperCase().slice(0, 2) || null;
  const categoryDisplay = visual.categoryLabel;
  const showSubtitle =
    row.subtitle &&
    row.subtitle.trim() !== "" &&
    row.subtitle.trim().toLowerCase() !== row.title.trim().toLowerCase() &&
    row.subtitle.trim().toLowerCase() !== categoryDisplay.toLowerCase();

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "stretch",
        gap: 1.25,
        minHeight: 72,
        py: 0.75,
        borderBottom: "1px solid rgba(255,215,0,0.1)",
      }}
    >
      <Box
        sx={{
          width: 48,
          alignSelf: "stretch",
          minHeight: 64,
          flexShrink: 0,
          borderRadius: 1,
          bgcolor: visual.railBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 0 16px ${visual.glow}`,
          border: "1px solid rgba(255,255,255,0.06)",
          "& svg": {
            width: "80%",
            height: "80%",
            maxWidth: 40,
            maxHeight: 40,
          },
        }}
      >
        <Icon sx={{ color: visual.iconColor, display: "block" }} />
      </Box>

      <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center", py: 0.25 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "common.white", lineHeight: 1.3 }}>
            {row.title}
          </Typography>
          {state ? (
            <Chip
              label={state}
              size="small"
              sx={{
                height: 22,
                fontSize: "0.7rem",
                fontWeight: 700,
                bgcolor: "rgba(0,0,0,0.45)",
                color: "grey.300",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            />
          ) : null}
        </Box>
        {showSubtitle ? (
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.25 }}>
            {row.subtitle}
          </Typography>
        ) : null}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.35 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.72rem" }}>
            {categoryDisplay}
          </Typography>
          <AccessTime sx={{ fontSize: 13, color: "text.secondary", opacity: 0.85 }} />
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.72rem" }}>
            {formatFeedTime(row.created_at)}
          </Typography>
        </Box>
      </Box>

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          alignSelf: "center",
          flexShrink: 0,
          minWidth: 52,
          textAlign: "right",
          fontSize: "0.75rem",
          pr: 0.25,
        }}
      >
        {formatFeedDate(row.created_at)}
      </Typography>
    </Box>
  );
}

export function CommunityInActionFeed({ items }: { items: ActivityFeedRow[] }) {
  if (items.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ py: 1 }}>
        No activity in the last 5 minutes.
      </Typography>
    );
  }

  return (
    <Box sx={{ mt: 1.5 }}>
      {items.map((row) => (
        <FeedRow key={row.id} row={row} />
      ))}
    </Box>
  );
}
