"use client";

import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import {
  Avatar,
  Box,
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
import type { MobilizeSubgroupBrief } from "@/lib/mobilize/chapter-subgroup";
import { resolveMobilizeGroupStateCode } from "@/lib/mobilize/group-state-flag";
import { mobilizeChapterCoverSrc } from "@/lib/mobilize/mobilize-chapter-cover";
import { mobilizeGroupInitials } from "@/lib/mobilize/group-initials";
import { publicAssetSrc } from "@/lib/media/public-asset-url";

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
  subgroups?: MobilizeSubgroupBrief[];
  subgroup_count?: number;
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
  /** @deprecated Chapters no longer support join from browse. */
  onJoined?: () => void | Promise<void>;
  /**
   * Map tab: Chapter + Groups preview + open link (no Leaders/Members/Join).
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

function SubgroupAvatars({
  subgroups = [],
  subgroupCount = 0,
}: {
  subgroups?: MobilizeSubgroupBrief[];
  subgroupCount?: number;
}) {
  const shown = subgroups.slice(0, 5);
  const total = Math.max(subgroupCount, subgroups.length);
  const overflow = total > 5;

  if (!shown.length) {
    return (
      <Typography variant="caption" color="text.secondary">
        —
      </Typography>
    );
  }

  return (
    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ flexWrap: "wrap" }}>
      {shown.map((s) => {
        const src = s.cover_image_url ? publicAssetSrc(s.cover_image_url) : undefined;
        return (
          <Tooltip key={s.id} title={s.name}>
            <Avatar
              src={src}
              sx={{
                width: 28,
                height: 28,
                fontSize: "0.65rem",
                fontWeight: 700,
                bgcolor: "grey.800",
                color: "primary.main",
                border: "1px solid rgba(0,0,0,0.12)",
              }}
            >
              {mobilizeGroupInitials(s.name)}
            </Avatar>
          </Tooltip>
        );
      })}
      {overflow ? (
        <Tooltip title={`${total - 5} more`}>
          <Avatar
            sx={{
              width: 28,
              height: 28,
              fontSize: "0.75rem",
              fontWeight: 700,
              bgcolor: "grey.200",
              color: "text.secondary",
            }}
          >
            +
          </Avatar>
        </Tooltip>
      ) : null}
    </Stack>
  );
}

export default function MobilizeGroupsBrowseTable({
  groups,
  loading = false,
  maxHeight,
  emptyMessage = "No chapters match your filters.",
  layoutVariant = "default",
  thumbnailScale = 1,
}: Props) {
  const mapStacked = layoutVariant === "mapStacked";
  const showActivitiesColumn = !mapStacked;
  const thumbBase = mapStacked ? 48 : 56;
  const thumbSize = Math.max(28, Math.round(thumbBase * thumbnailScale));
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

  function chapterGroupsHref(id: string) {
    return `/dashboard/mobilize/groups/${id}/groups`;
  }

  function renderOpenChapter(g: MobilizeBrowseGroupRow, align: "end" | "start" = "end") {
    const justify = align === "start" ? "flex-start" : "flex-end";
    const href = chapterGroupsHref(g.id);
    return (
      <Stack direction="row" alignItems="center" spacing={0.5} justifyContent={justify}>
        <Tooltip title="View groups in this chapter">
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
                    width: { xs: "auto", md: "42%" },
                    maxWidth: { md: 280 },
                    minWidth: { xs: 160, md: 0 },
                  }}
                >
                  Chapter
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: "text.secondary", width: { xs: "36%", md: "40%" } }}>
                  Groups
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    display: { xs: "none", md: "table-cell" },
                    width: 56,
                    fontWeight: 700,
                    color: "text.secondary",
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
                <TableCell sx={{ fontWeight: 700, color: "text.secondary", minWidth: 140 }}>Leaders</TableCell>
                <TableCell align="right" sx={{ width: 88, fontWeight: 700, color: "text.secondary" }}>
                  Members
                </TableCell>
                {showActivitiesColumn ? (
                  <TableCell align="center" sx={{ width: 96, fontWeight: 700, color: "text.secondary" }}>
                    Activities
                  </TableCell>
                ) : null}
                <TableCell align="right" sx={{ width: 80, fontWeight: 700, color: "text.secondary" }}>
                  Actions
                </TableCell>
              </>
            )}
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
            const groupsHref = chapterGroupsHref(g.id);
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
                      href={groupsHref}
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
                      title={g.address ?? ""}
                      sx={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {g.address ?? "—"}
                      {g.distance_km != null ? ` · ${g.distance_km.toFixed(1)} km` : ""}
                    </Typography>
                  </Box>
                </Stack>
                {mapStacked ? (
                  <Box sx={{ display: { xs: "block", md: "none" }, pt: 0.25 }}>
                    {renderOpenChapter(g, "start")}
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
                    <TableCell sx={{ py: 0.85, verticalAlign: "middle" }}>
                      <SubgroupAvatars subgroups={g.subgroups} subgroupCount={g.subgroup_count} />
                    </TableCell>
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
                      {renderOpenChapter(g)}
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
                        href={groupsHref}
                        fontWeight={700}
                        color="inherit"
                        sx={{ textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
                        noWrap
                        display="block"
                      >
                        {g.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block" noWrap title={g.address ?? ""}>
                        {g.address ?? "—"}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ verticalAlign: "top" }}>
                      {leaders.length ? (
                        <Stack spacing={0.65} sx={{ maxWidth: "100%", minWidth: 0 }}>
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
                    {showActivitiesColumn ? (
                      <TableCell align="center">
                        <Tooltip title="Upcoming Mobilize events (from now)">
                          <Typography variant="body2" fontWeight={600} component="span" sx={{ cursor: "default" }}>
                            {activities}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                    ) : null}
                    <TableCell align="right">{renderOpenChapter(g)}</TableCell>
                  </>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
