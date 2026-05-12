"use client";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import {
  Avatar,
  Box,
  Button,
  Chip,
  IconButton,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import Link from "next/link";
import type { MobilizeGroupLeaderBrief } from "@/lib/mobilize/enrich-groups-browse";
import { useMobilizeToast } from "@/components/mobilize/MobilizeToastProvider";

export type MobilizeBrowseGroupRow = {
  id: string;
  name: string;
  group_type: string;
  visibility: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  distance_km?: number;
  cover_image_url?: string | null;
  member_count?: number;
  leader_names?: string[];
  leaders?: MobilizeGroupLeaderBrief[];
  upcoming_activity_count?: number;
  my_membership_status?: string | null;
};

const DEFAULT_GROUP_COVER =
  "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&q=80";

const leaderPillSx = {
  flexDirection: "row" as const,
  alignItems: "center",
  gap: 0.75,
  px: 1,
  py: 0.4,
  borderRadius: 2,
  border: "1px solid",
  borderColor: "rgba(158, 158, 158, 0.4)",
  bgcolor: "rgba(130, 130, 130, 0.12)",
  width: "fit-content",
  maxWidth: "100%",
};

type Props = {
  groups: MobilizeBrowseGroupRow[];
  loading?: boolean;
  /** When set, table body scrolls inside this max height. */
  maxHeight?: number;
  emptyMessage?: string;
  /** Called after a successful join request (e.g. reload list). */
  onJoined?: () => void | Promise<void>;
  /**
   * Map tab only: one column for cover + name + address, then actions stacked below (no separate Actions column).
   */
  layoutVariant?: "default" | "mapStacked";
  /** Multiplier for cover thumbnail (base 56 default / 72 mapStacked). E.g. 3.5 for Map & Groups + My Groups. */
  thumbnailScale?: number;
};

function LeaderPill({ L }: { L: MobilizeGroupLeaderBrief }) {
  return (
    <Stack sx={leaderPillSx}>
      <Avatar src={L.avatar_url ?? undefined} sx={{ width: 24, height: 24, fontSize: "0.65rem" }}>
        {(L.full_name || "?").trim().slice(0, 1).toUpperCase()}
      </Avatar>
      <Typography variant="body2" noWrap title={L.full_name} sx={{ color: "grey.400", fontWeight: 500 }}>
        {L.full_name}
      </Typography>
    </Stack>
  );
}

export default function MobilizeGroupsBrowseTable({
  groups,
  loading = false,
  maxHeight,
  emptyMessage = "No groups match your filters.",
  onJoined,
  layoutVariant = "default",
  thumbnailScale = 1,
}: Props) {
  const toast = useMobilizeToast();
  const mapStacked = layoutVariant === "mapStacked";
  const thumbBase = mapStacked ? 48 : 56;
  const thumbSize = Math.max(28, Math.round(thumbBase * thumbnailScale));
  /** Default list + My Groups: 4/3.5 aspect cover. Map tab left column: compact square thumbnail. */
  const listHeroCover = !mapStacked;
  const coverImgSx = listHeroCover
    ? ({
        width: thumbSize,
        maxWidth: "100%",
        height: "auto",
        aspectRatio: "4 / 3.5 !important",
        objectFit: "cover",
        borderRadius: 1,
        display: "block",
        flexShrink: 0,
        alignSelf: "flex-start",
      } as const)
    : ({
        width: thumbSize,
        height: thumbSize,
        objectFit: "cover",
        borderRadius: 1,
        display: "block",
        flexShrink: 0,
      } as const);

  async function joinGroup(groupId: string) {
    try {
      const res = await fetch(`/api/mobilize/groups/${groupId}/join`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Join failed.");
      toast("Join request sent.", "success");
      await onJoined?.();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Join failed.", "error");
    }
  }

  function renderJoinActions(g: MobilizeBrowseGroupRow, align: "end" | "start" = "end") {
    const justify = align === "start" ? "flex-start" : "flex-end";
    const st = g.my_membership_status;
    const href = `/dashboard/mobilize/groups/${g.id}`;
    if (g.visibility !== "public") {
      return (
        <Typography variant="caption" color="text.secondary">
          Private
        </Typography>
      );
    }
    if (st === "approved") {
      return (
        <Stack direction="row" alignItems="center" spacing={0.5} justifyContent={justify}>
          <Chip size="small" icon={<CheckCircleIcon />} label="Joined" color="success" variant="outlined" />
          <Tooltip title="Open group">
            <IconButton
              component={Link}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              size="small"
              color="primary"
            >
              <OpenInNewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      );
    }
    if (st === "pending") {
      return (
        <Box sx={{ display: "flex", justifyContent: justify }}>
          <Chip size="small" label="Pending" color="warning" variant="outlined" />
        </Box>
      );
    }
    return (
      <Stack direction="row" alignItems="center" spacing={0.5} justifyContent={justify}>
        <Button size="small" variant="outlined" startIcon={<PersonAddIcon />} onClick={() => void joinGroup(g.id)}>
          Join
        </Button>
        <Tooltip title="Open group">
          <IconButton
            component={Link}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            size="small"
            color="primary"
          >
            <OpenInNewIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
    );
  }

  if (loading) {
    return <Skeleton variant="rectangular" height={maxHeight != null ? maxHeight : 420} sx={{ borderRadius: 1 }} />;
  }

  if (!groups.length) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {emptyMessage}
        </Typography>
      </Box>
    );
  }

  const thumbColWidth = thumbSize + 16;

  return (
    <TableContainer
      sx={{
        ...(maxHeight != null ? { maxHeight, overflow: "auto" } : {}),
        bgcolor: "rgba(0,0,0,0.2)",
        borderRadius: 1,
        border: "1px solid rgba(255,215,0,0.12)",
      }}
    >
      <Table size="small" stickyHeader sx={{ tableLayout: "fixed", width: "100%" }}>
        <TableHead>
          <TableRow>
            {mapStacked ? (
              <TableCell sx={{ fontWeight: 700, color: "text.secondary", minWidth: Math.max(200, thumbSize + 120) }}>
                Group
              </TableCell>
            ) : (
              <>
                <TableCell sx={{ width: thumbColWidth, py: 1 }} />
                <TableCell sx={{ fontWeight: 700, color: "text.secondary" }}>Name</TableCell>
              </>
            )}
            <TableCell sx={{ fontWeight: 700, color: "text.secondary", minWidth: 140 }}>Leaders</TableCell>
            <TableCell align="right" sx={{ width: 88, fontWeight: 700, color: "text.secondary" }}>
              Members
            </TableCell>
            <TableCell align="center" sx={{ width: 96, fontWeight: 700, color: "text.secondary" }}>
              Activities
            </TableCell>
            {!mapStacked ? (
              <TableCell align="right" sx={{ width: 150, fontWeight: 700, color: "text.secondary" }}>
                Actions
              </TableCell>
            ) : null}
          </TableRow>
        </TableHead>
        <TableBody>
          {groups.map((g) => {
            const leaders = g.leaders?.length
              ? g.leaders
              : (g.leader_names ?? []).map((full_name, i) => ({
                  user_id: `${g.id}-legacy-${i}`,
                  first_name: null,
                  last_name: null,
                  display_name: null,
                  email: null,
                  avatar_url: null,
                  full_name,
                }));
            const cover = g.cover_image_url?.trim() || DEFAULT_GROUP_COVER;
            const count = g.member_count ?? 0;
            const activities = g.upcoming_activity_count ?? 0;
            const groupInfo = (
              <Stack spacing={0.75} sx={{ minWidth: 0 }}>
                <Stack direction="row" spacing={1.25} alignItems="flex-start">
                  <Box component="img" src={cover} alt="" sx={coverImgSx} />
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography
                      component={Link}
                      href={`/dashboard/mobilize/groups/${g.id}`}
                      fontWeight={700}
                      color="inherit"
                      sx={{ textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
                      display="block"
                    >
                      {g.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {g.group_type}
                      {g.distance_km != null ? ` · ${g.distance_km.toFixed(1)} km` : ""}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" title={g.address ?? ""}>
                      {g.address ?? "—"}
                    </Typography>
                  </Box>
                </Stack>
                {mapStacked ? (
                  <Box sx={{ pt: 0.25 }}>{renderJoinActions(g, "start")}</Box>
                ) : null}
              </Stack>
            );
            return (
              <TableRow
                key={g.id}
                hover
                sx={{ "& td": { verticalAlign: "middle", borderColor: "rgba(255,215,0,0.08)" } }}
              >
                {mapStacked ? (
                  <TableCell sx={{ py: 1.25, verticalAlign: "top" }}>{groupInfo}</TableCell>
                ) : (
                  <>
                    <TableCell sx={{ py: 1 }}>
                      <Box component="img" src={cover} alt="" sx={coverImgSx} />
                    </TableCell>
                    <TableCell sx={{ minWidth: 0 }}>
                      <Typography
                        component={Link}
                        href={`/dashboard/mobilize/groups/${g.id}`}
                        fontWeight={700}
                        color="inherit"
                        sx={{ textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
                        noWrap
                        display="block"
                      >
                        {g.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block" noWrap>
                        {g.group_type}
                        {g.distance_km != null ? ` · ${g.distance_km.toFixed(1)} km` : ""}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block" noWrap title={g.address ?? ""}>
                        {g.address ?? "—"}
                      </Typography>
                    </TableCell>
                  </>
                )}
                <TableCell sx={{ verticalAlign: "top" }}>
                  {leaders.length ? (
                    <Stack spacing={0.65} sx={{ maxWidth: 280 }}>
                      {leaders.slice(0, 4).map((L) => (
                        <LeaderPill key={L.user_id} L={L} />
                      ))}
                      {leaders.length > 4 ? (
                        <Typography variant="caption" color="text.secondary">
                          +{leaders.length - 4} more
                        </Typography>
                      ) : null}
                    </Stack>
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      —
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="right">{count}</TableCell>
                <TableCell align="center">
                  <Tooltip title="Upcoming Mobilize events (from now)">
                    <Typography variant="body2" fontWeight={600} component="span" sx={{ cursor: "default" }}>
                      {activities}
                    </Typography>
                  </Tooltip>
                </TableCell>
                {!mapStacked ? <TableCell align="right">{renderJoinActions(g)}</TableCell> : null}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
