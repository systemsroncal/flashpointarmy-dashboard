"use client";

import { useEffect, useState } from "react";
import { MobilizeContentPanel } from "@/components/mobilize/MobilizeContentPanel";
import { Box, Typography } from "@mui/material";
import MobilizeGroupsBrowseTable, {
  type MobilizeBrowseGroupRow,
} from "@/components/mobilize/MobilizeGroupsBrowseTable";
import type { MobilizeGroupLeaderBrief } from "@/lib/mobilize/enrich-groups-browse";
import { useMobilizeToast } from "@/components/mobilize/MobilizeToastProvider";

export default function MyGroupsPage() {
  const toast = useMobilizeToast();
  const [rows, setRows] = useState<MobilizeBrowseGroupRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/mobilize/my-groups");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load.");
      const list = (json.groups ?? []) as Record<string, unknown>[];
      setRows(
        list.map((g) => ({
          id: String(g.id),
          name: String(g.name ?? ""),
          group_type: String(g.group_type ?? ""),
          visibility: String(g.visibility ?? "public"),
          address: (g.address as string | null) ?? null,
          latitude: (g.latitude as number | null) ?? null,
          longitude: (g.longitude as number | null) ?? null,
          cover_image_url: (g.cover_image_url as string | null) ?? null,
          member_count: typeof g.member_count === "number" ? g.member_count : Number(g.member_count) || 0,
          leader_names: Array.isArray(g.leader_names) ? (g.leader_names as string[]) : [],
          leaders: Array.isArray(g.leaders) ? (g.leaders as MobilizeGroupLeaderBrief[]) : [],
          upcoming_activity_count:
            typeof g.upcoming_activity_count === "number"
              ? g.upcoming_activity_count
              : Number(g.upcoming_activity_count) || 0,
          my_membership_status:
            (g.my_membership_status as string | null) ??
            (g.membership as { membership_status?: string } | undefined)?.membership_status ??
            null,
        }))
      );
    } catch (e) {
      toast(e instanceof Error ? e.message : "Error", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial fetch only
  }, []);

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Groups
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Groups you belong to or lead. Open a group from the table to view feed, events, and members.
      </Typography>
      <MobilizeContentPanel>
        <MobilizeGroupsBrowseTable
          groups={rows}
          loading={loading}
          emptyMessage="You are not in any Mobilize group yet."
          nameLinkTarget="group-detail"
          thumbnailScale={3.5}
        />
      </MobilizeContentPanel>
    </Box>
  );
}
