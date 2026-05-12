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
  my_membership_status?: string | null;
};

const DEFAULT_GROUP_COVER =
  "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&q=80";

type Props = {
  groups: MobilizeBrowseGroupRow[];
  loading?: boolean;
  /** When set, table body scrolls inside this max height. */
  maxHeight?: number;
  emptyMessage?: string;
  /** Called after a successful join request (e.g. reload list). */
  onJoined?: () => void | Promise<void>;
};

export default function MobilizeGroupsBrowseTable({
  groups,
  loading = false,
  maxHeight,
  emptyMessage = "No groups match your filters.",
  onJoined,
}: Props) {
  const toast = useMobilizeToast();

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

  function renderJoinActions(g: MobilizeBrowseGroupRow) {
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
        <Stack direction="row" alignItems="center" spacing={0.5} justifyContent="flex-end">
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
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Chip size="small" label="Pending" color="warning" variant="outlined" />
        </Box>
      );
    }
    return (
      <Stack direction="row" alignItems="center" spacing={0.5} justifyContent="flex-end">
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
            <TableCell sx={{ width: 72, py: 1 }} />
            <TableCell sx={{ fontWeight: 700, color: "text.secondary" }}>Name</TableCell>
            <TableCell sx={{ fontWeight: 700, color: "text.secondary", minWidth: 120 }}>Leaders</TableCell>
            <TableCell align="right" sx={{ width: 88, fontWeight: 700, color: "text.secondary" }}>
              Members
            </TableCell>
            <TableCell align="right" sx={{ width: 150, fontWeight: 700, color: "text.secondary" }}>
              Actions
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {groups.map((g) => {
            const names = g.leader_names ?? [];
            const cover = g.cover_image_url?.trim() || DEFAULT_GROUP_COVER;
            const count = g.member_count ?? 0;
            return (
              <TableRow
                key={g.id}
                hover
                sx={{ "& td": { verticalAlign: "middle", borderColor: "rgba(255,215,0,0.08)" } }}
              >
                <TableCell sx={{ py: 1 }}>
                  <Box
                    component="img"
                    src={cover}
                    alt=""
                    sx={{ width: 56, height: 56, objectFit: "cover", borderRadius: 1, display: "block" }}
                  />
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
                <TableCell>
                  {names.length ? (
                    <Stack direction="row" alignItems="center" spacing={0.5} flexWrap="wrap" useFlexGap>
                      {names.slice(0, 5).map((name, i) => (
                        <Tooltip key={`${g.id}-L-${i}`} title={name}>
                          <Avatar sx={{ width: 28, height: 28, fontSize: "0.7rem" }}>
                            {name.trim().slice(0, 1).toUpperCase() || "?"}
                          </Avatar>
                        </Tooltip>
                      ))}
                      {names.length > 5 ? (
                        <Typography variant="caption" color="text.secondary">
                          +{names.length - 5}
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
                <TableCell align="right">{renderJoinActions(g)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
