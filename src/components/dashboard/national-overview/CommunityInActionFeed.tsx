"use client";

import AccessTime from "@mui/icons-material/AccessTime";
import BoltOutlined from "@mui/icons-material/BoltOutlined";
import CalendarMonthOutlined from "@mui/icons-material/CalendarMonthOutlined";
import CampaignOutlined from "@mui/icons-material/CampaignOutlined";
import CelebrationOutlined from "@mui/icons-material/CelebrationOutlined";
import EditNoteOutlined from "@mui/icons-material/EditNoteOutlined";
import GroupsOutlined from "@mui/icons-material/GroupsOutlined";
import LocationOnOutlined from "@mui/icons-material/LocationOnOutlined";
import PersonAddAltOutlined from "@mui/icons-material/PersonAddAltOutlined";
import SecurityOutlined from "@mui/icons-material/SecurityOutlined";
import ScheduleOutlined from "@mui/icons-material/ScheduleOutlined";
import StarOutlined from "@mui/icons-material/StarOutlined";
import TrackChangesOutlined from "@mui/icons-material/TrackChangesOutlined";
import MenuBookOutlined from "@mui/icons-material/MenuBookOutlined";
import { Box, Chip, Typography } from "@mui/material";
import type { SvgIconComponent } from "@mui/icons-material";
import { isHiddenCommunityFeedRow } from "@/lib/community/community-activity-feed";
import { scrubPrivacyNamesInText } from "@/lib/user/format-privacy-name";

export type ActivityFeedRow = {
  id: string;
  feed_category: string;
  title: string;
  subtitle: string | null;
  state_code: string | null;
  created_at: string;
  icon_key: string | null;
  actor_user_id?: string | null;
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
    member_invite: "Community Growth",
    auto_weekly_members: "Community Update",
    auto_member_goal: "Milestone Update",
    auto_shares_today: "Engagement",
    training_session: "Training · session",
    training_course: "Training · course",
    training_briefing: "Training · briefing",
    missions: "Missions",
    certificate_request: "Prior BibCit",
  };
  if (byCat[c]) return byCat[c];
  return c
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function displayFeedTitle(title: string): string {
  let t = title;
  // Regional flag emojis (e.g. 🇺🇸) render poorly on Windows — use cross-platform 🎯.
  t = t.replace(/^🇺🇸\s*/u, "🎯 ");
  t = t.replace(/^\u{1F1FA}\u{1F1F8}\s*/u, "🎯 ");
  if (/^New chapter:/i.test(t)) t = t.replace(/^New chapter:/i, "Chapter request:");
  if (t === "Local leader assigned") t = "Local leader application";
  return scrubPrivacyNamesInText(t);
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
  const purpleGrowth: FeedVisual = {
    categoryLabel: englishCategoryLabel(row),
    Icon: CelebrationOutlined,
    railBg: "rgba(88, 28, 135, 0.58)",
    glow: "rgba(167, 139, 250, 0.48)",
    iconColor: "#e9d5ff",
  };
  const tealCommunityUpdate: FeedVisual = {
    categoryLabel: englishCategoryLabel(row),
    Icon: GroupsOutlined,
    railBg: "rgba(15, 118, 110, 0.52)",
    glow: "rgba(45, 212, 191, 0.42)",
    iconColor: "#99f6e4",
  };
  const blueMilestone: FeedVisual = {
    categoryLabel: englishCategoryLabel(row),
    Icon: TrackChangesOutlined,
    railBg: "rgba(37, 99, 235, 0.52)",
    glow: "rgba(96, 165, 250, 0.42)",
    iconColor: "#93c5fd",
  };
  const redEngagement: FeedVisual = {
    categoryLabel: englishCategoryLabel(row),
    Icon: CampaignOutlined,
    railBg: "rgba(185, 28, 28, 0.52)",
    glow: "rgba(248, 113, 113, 0.38)",
    iconColor: "#fecaca",
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

  const oliveSchool: FeedVisual = {
    categoryLabel: englishCategoryLabel(row),
    Icon: MenuBookOutlined,
    railBg: "rgba(55, 65, 20, 0.6)",
    glow: "rgba(212, 232, 120, 0.35)",
    iconColor: "#ecfccb",
  };

  if (key === "calendar") return purple;
  if (key === "clock") return tealClock;
  if (key === "celebration" || key === "community_growth") return purpleGrowth;
  if (key === "groups" || key === "community_update") return tealCommunityUpdate;
  if (key === "target" || key === "milestone") return blueMilestone;
  if (key === "megaphone" || key === "engagement") return redEngagement;
  if (key === "trend") return tealCommunityUpdate;
  if (key === "location") return blueChapter;
  if (key === "person") return orangeMember;
  if (key === "star") return starLeader;
  if (key === "bolt") return navyBolt;
  if (key === "edit_note") return manualNote;
  if (key === "shield") return securityManual;

  if (cat === "member_invite") return purpleGrowth;
  if (cat === "auto_weekly_members") return tealCommunityUpdate;
  if (cat === "auto_member_goal") return blueMilestone;
  if (cat === "auto_shares_today") return redEngagement;
  if (cat === "upcoming_gatherings" || cat === "gathering") return purple;
  if (cat === "hosted_events") return tealClock;
  if (cat === "growth") return tealCommunityUpdate;
  if (cat === "leadership") return goldLead;
  if (cat === "chapter") return blueChapter;
  if (cat === "member") return orangeMember;
  if (key === "school") return oliveSchool;

  if (cat === "training_session" || cat === "training_course" || cat === "certificate_request") return oliveSchool;
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

const FEED_TITLE_FONT_SIZE = "13px";
const FEED_DESC_FONT_SIZE = "12px";
const FEED_META_FONT_SIZE = "0.72rem";

function MemberInviteTitle({ row }: { row: ActivityFeedRow }) {
  const title = row.title.trim();
  const match =
    title.match(/^🎉\s+(.+?)\s+(helped grow FlashPoint Army .+)$/) ??
    title.match(/^🎉\s+(.+?)\s+(helped grow FPA Chapters .+)$/);
  if (match) {
    return (
      <Typography
        variant="subtitle2"
        component="div"
        sx={{
          width: "100%",
          fontWeight: 700,
          color: "common.white",
          lineHeight: 1.35,
          fontSize: FEED_TITLE_FONT_SIZE,
        }}
      >
        🎉{" "}
        <Box
          component="span"
          sx={{
            textDecoration: "underline",
            fontWeight: 700,
          }}
        >
          {match[1]}
        </Box>{" "}
        {match[2]}
      </Typography>
    );
  }
  return (
    <Typography
      variant="subtitle2"
      sx={{
        width: "100%",
        fontWeight: 700,
        color: "common.white",
        lineHeight: 1.35,
        fontSize: FEED_TITLE_FONT_SIZE,
      }}
    >
      {displayFeedTitle(title)}
    </Typography>
  );
}

function FeedRow({ row }: { row: ActivityFeedRow }) {
  const visual = resolveFeedVisual(row);
  const Icon = visual.Icon;
  const state = row.state_code?.trim().toUpperCase().slice(0, 2) || null;
  const categoryDisplay = visual.categoryLabel;
  const isMemberInvite = row.feed_category.trim().toLowerCase() === "member_invite";
  const displayTitle = isMemberInvite ? row.title : displayFeedTitle(row.title);
  const displaySubtitle = row.subtitle ? scrubPrivacyNamesInText(row.subtitle) : null;
  const showSubtitle =
    displaySubtitle &&
    displaySubtitle.trim() !== "" &&
    displaySubtitle.trim().toLowerCase() !== displayTitle.trim().toLowerCase() &&
    displaySubtitle.trim().toLowerCase() !== categoryDisplay.toLowerCase();

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.25,
        minHeight: 52,
        py: 0.75,
        borderBottom: "1px solid rgba(255,215,0,0.1)",
      }}
    >
      <Box
        sx={{
          width: 32,
          height: 32,
          flexShrink: 0,
          borderRadius: "50%",
          bgcolor: visual.railBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 0 10px ${visual.glow}`,
          border: "1px solid rgba(255,255,255,0.06)",
          "& svg": {
            width: 18,
            height: 18,
          },
        }}
      >
        <Icon sx={{ color: visual.iconColor, display: "block" }} />
      </Box>

      <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center", py: 0.25 }}>
        {isMemberInvite ? (
          <MemberInviteTitle row={row} />
        ) : (
          <Typography
            variant="subtitle2"
            sx={{
              width: "100%",
              fontWeight: 700,
              color: "common.white",
              lineHeight: 1.35,
              fontSize: FEED_TITLE_FONT_SIZE,
            }}
          >
            {displayTitle}
          </Typography>
        )}
        {state ? (
          <Chip
            label={state}
            size="small"
            sx={{
              alignSelf: "flex-start",
              mt: 0.35,
              height: 20,
              fontSize: "0.65rem",
              fontWeight: 700,
              bgcolor: "rgba(0,0,0,0.45)",
              color: "grey.300",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          />
        ) : null}
        {showSubtitle ? (
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 1,
              mt: 0.35,
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                flex: 1,
                minWidth: 0,
                lineHeight: 1.4,
                fontSize: FEED_DESC_FONT_SIZE,
                fontStyle: isMemberInvite ? "italic" : "normal",
              }}
            >
              {displaySubtitle}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                flexShrink: 0,
                fontSize: FEED_META_FONT_SIZE,
                lineHeight: 1.4,
                pr: 0.75,
              }}
            >
              {formatFeedDate(row.created_at)}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 0.35 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontSize: FEED_META_FONT_SIZE, pr: 0.75 }}
            >
              {formatFeedDate(row.created_at)}
            </Typography>
          </Box>
        )}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.35 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: FEED_META_FONT_SIZE }}>
            {categoryDisplay}
          </Typography>
          <AccessTime sx={{ fontSize: 13, color: "text.secondary", opacity: 0.85 }} />
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: FEED_META_FONT_SIZE }}>
            {formatFeedTime(row.created_at)}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

export function CommunityInActionFeed({ items }: { items: ActivityFeedRow[] }) {
  const visible = items.filter((row) => !isHiddenCommunityFeedRow(row));

  if (visible.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ py: 1 }}>
        No community activity to show yet.
      </Typography>
    );
  }

  return (
    <Box sx={{ mt: 1.5 }}>
      {visible.map((row) => (
        <FeedRow key={row.id} row={row} />
      ))}
    </Box>
  );
}
