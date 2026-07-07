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
import { resolveMobilizeGroupStateCode } from "@/lib/mobilize/group-state-flag";
import { mobilizeChapterCoverSrc } from "@/lib/mobilize/mobilize-chapter-cover";
import { publicAssetSrc } from "@/lib/media/public-asset-url";
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
  minWidth: 0,
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
  /** Multiplier for cover thumbnail (base 56 default / 72 mapStacked). E.g. 3.5 for Groups + My Groups. */
  thumbnailScale?: number;
};

function LeaderPill({ L, compact = false }: { L: MobilizeGroupLeaderBrief; compact?: boolean }) {
  const av = compact ? 20 : 24;
  return (
    <Stack
      sx={{
        ...leaderPillSx,
        ...(compact ? { maxWidth: "100%", width: "100%", py: 0.3, px: 0.65, gap: 0.5 } : {}),
      }}
    >
      <Avatar src={L.avatar_url ?? undefined} sx={{ width: av, height: av, fontSize: compact ? "0.6rem" : "0.65rem", flexShrink: 0 }}>
        {(L.full_name || "?").trim().slice(0, 1).toUpperCase()}
      </Avatar>
      <Typography
        variant={compact ? "caption" : "body2"}
        title={L.full_name}
        sx={{
          color: "grey.400",
          fontWeight: 500,
          minWidth: 0,
          flex: 1,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          lineHeight: 1.25,
          ...(compact ? { fontSize: "0.7rem" } : {}),
        }}
      >
        {L.full_name}
      </Typography>
    </Stack>
  );
}

function chapterStateInitials(name: string, address?: string | null): string {
  const code = resolveMobilizeGroupStateCode({ name, address });
  if (code) return code;
  const stripped = name.replace(/\s+chapter\s*$/i, "").trim();
  if (stripped.length >= 2) return stripped.slice(0, 2).toUpperCase();
  return (stripped || name).slice(0, 2).toUpperCase() || "?";
}

function ChapterStateBadge({
  name,
  address,
  size,
}: {
  name: string;
  address?: string | null;
  size: number;
}) {
  const initials = chapterStateInitials(name, address);
  return (
    <Box
      aria-hidden
      sx={{
        width: size,
        height: size,
        borderRadius: "50%",
        bgcolor: "#0d0d0d",
        color: "primary.main",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 800,
        fontSize: initials.length > 2 ? size * 0.26 : size * 0.34,
        letterSpacing: 0.4,
        flexShrink: 0,
        border: "1px solid rgba(255, 215, 0, 0.4)",
        boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
        lineHeight: 1,
      }}
    >
      {initials}
    </Box>
  );
}

export default function MobilizeGroupsBrowseTable({
  groups,
  loading = false,
  maxHeight,
  emptyMessage = "No chapters match your filters.",
  onJoined,
  layoutVariant = "default",
  thumbnailScale = 1,
}: Props) {
  const toast = useMobilizeToast();
  const mapStacked = layoutVariant === "mapStacked";
  const showActivitiesColumn = !mapStacked;
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
    if (st === "approved") {
      return (
        <Stack direction="row" alignItems="center" spacing={0.5} justifyContent={justify}>
          <Chip size="small" icon={<CheckCircleIcon />} label="Joined" color="success" variant="outlined" />
          <Tooltip title="Open chapter">
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
      <Stack
        direction="row"
        alignItems="center"
        spacing={0.5}
        justifyContent={justify}
        flexWrap="wrap"
        useFlexGap
        sx={{ maxWidth: "100%" }}
      >
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

  const mapTableScrollSx = mapStacked
    ? {
        overflowY: "auto" as const,
        overflowX: { xs: "auto" as const, md: "hidden" as const },
      }
    : null;

  return (
    <TableContainer
      sx={{
        ...(maxHeight != null
          ? mapTableScrollSx
            ? { maxHeight, ...mapTableScrollSx }
            : { maxHeight, overflow: "auto" }
          : mapTableScrollSx ?? {}),
        bgcolor: "#ffffff",
        borderRadius: 1,
        border: "1px solid rgba(0,0,0,0.12)",
        width: "100%",
        maxWidth: "100%",
      }}
    >
      <Table
        size="small"
        stickyHeader
        sx={{
          tableLayout: "fixed",
          width: "100%",
          minWidth: mapStacked ? 0 : undefined,
          "& .MuiTableCell-root": mapStacked ? { overflow: "hidden" } : undefined,
        }}
      >
        <TableHead>
          <TableRow>
            {mapStacked ? (
              <>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    color: "text.secondary",
                    width: { xs: "auto", md: "34%" },
                    maxWidth: { md: 240 },
                    minWidth: { xs: 160, md: 0 },
                  }}
                >
                  Chapter
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    display: { xs: "none", md: "table-cell" },
                    width: 108,
                    fontWeight: 700,
                    color: "text.secondary",
                    whiteSpace: "nowrap",
                    px: 1,
                  }}
                >
                  &nbsp;
                </TableCell>
              </>
            ) : (
              <>
                <TableCell sx={{ width: thumbColWidth, py: 1 }} />
                <TableCell sx={{ fontWeight: 700, color: "text.secondary" }}>Name</TableCell>
              </>
            )}
            <TableCell sx={{ fontWeight: 700, color: "text.secondary", width: mapStacked ? { xs: "32%", md: "28%" } : undefined, minWidth: mapStacked ? 0 : 140 }}>
              Leaders
            </TableCell>
            <TableCell
              align="right"
              sx={{ width: mapStacked ? "14%" : 88, fontWeight: 700, color: "text.secondary", whiteSpace: "nowrap" }}
            >
              Members
            </TableCell>
            {showActivitiesColumn ? (
              <TableCell align="center" sx={{ width: 96, fontWeight: 700, color: "text.secondary" }}>
                Activities
              </TableCell>
            ) : null}
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
            const cover = publicAssetSrc(mobilizeChapterCoverSrc(g.cover_image_url));
            const count = g.member_count ?? 0;
            const activities = g.upcoming_activity_count ?? 0;
            const groupInfo = (
              <Stack spacing={0.75} sx={{ minWidth: 0 }}>
                <Stack direction="row" spacing={1.25} alignItems="flex-start">
                  {mapStacked ? (
                    <ChapterStateBadge name={g.name} address={g.address} size={thumbSize} />
                  ) : (
                    <Box component="img" src={cover} alt="" sx={coverImgSx} />
                  )}
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography
                      component={Link}
                      href={`/dashboard/mobilize/groups/${g.id}`}
                      fontWeight={700}
                      color="inherit"
                      display="block"
                      sx={{
                        textDecoration: "none",
                        "&:hover": { textDecoration: "underline" },
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {g.name}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                      sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                    >
                      {g.group_type}
                      {g.distance_km != null ? ` · ${g.distance_km.toFixed(1)} km` : ""}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                      title={g.address ?? ""}
                      sx={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {g.address ?? "—"}
                    </Typography>
                  </Box>
                </Stack>
                {mapStacked ? (
                  <Box sx={{ display: { xs: "block", md: "none" }, pt: 0.25 }}>
                    {renderJoinActions(g, "start")}
                  </Box>
                ) : null}
              </Stack>
            );
            return (
              <TableRow
                key={g.id}
                hover
                sx={{
                  "& td": {
                    verticalAlign: "middle",
                    borderColor: "rgba(0,0,0,0.06)",
                    ...(mapStacked ? { py: 0.75 } : {}),
                  },
                }}
              >
                {mapStacked ? (
                  <>
                    <TableCell sx={{ py: 0.85, verticalAlign: "top" }}>{groupInfo}</TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        display: { xs: "none", md: "table-cell" },
                        verticalAlign: "middle",
                        py: 0.85,
                        px: 1,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {renderJoinActions(g)}
                    </TableCell>
                  </>
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
                <TableCell sx={{ verticalAlign: "top", width: mapStacked ? { xs: "32%", md: "28%" } : undefined }}>
                  {leaders.length ? (
                    <Stack spacing={mapStacked ? 0.45 : 0.65} sx={{ maxWidth: "100%", minWidth: 0 }}>
                      {leaders.slice(0, mapStacked ? 3 : 4).map((L) => (
                        <LeaderPill key={L.user_id} L={L} compact={mapStacked} />
                      ))}
                      {leaders.length > (mapStacked ? 3 : 4) ? (
                        <Typography variant="caption" color="text.secondary">
                          +{leaders.length - (mapStacked ? 3 : 4)} more
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
                {showActivitiesColumn ? (
                  <TableCell align="center">
                    <Tooltip title="Upcoming Mobilize events (from now)">
                      <Typography variant="body2" fontWeight={600} component="span" sx={{ cursor: "default" }}>
                        {activities}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                ) : null}
                {!mapStacked ? <TableCell align="right">{renderJoinActions(g)}</TableCell> : null}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
