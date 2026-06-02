"use client";

import {
  describeBroadcastAudienceFilter,
  EMAIL_PROVIDER_LABELS,
  type BroadcastCampaignRow,
} from "@/lib/broadcast/types";
import {
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";

function statusColor(status: string): "default" | "success" | "error" | "warning" {
  if (status === "sent") return "success";
  if (status === "failed") return "error";
  if (status === "sending") return "warning";
  return "default";
}

export function BroadcastHistoryClient() {
  const [campaigns, setCampaigns] = useState<BroadcastCampaignRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/broadcast/campaigns?limit=50");
      const data = await res.json();
      if (res.ok) setCampaigns(data.campaigns ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Stack spacing={2}>
      <Typography variant="h6">Send history</Typography>
      {loading ? (
        <Typography color="text.secondary">Loading…</Typography>
      ) : campaigns.length === 0 ? (
        <Paper sx={{ p: 3 }}>
          <Typography color="text.secondary">No campaigns sent yet.</Typography>
        </Paper>
      ) : (
        <Paper sx={{ overflow: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Channel</TableCell>
                <TableCell>Audience</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Sent</TableCell>
                <TableCell align="right">Failed</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {campaigns.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    {new Date(c.sent_at ?? c.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell>{c.name}</TableCell>
                  <TableCell>{c.channel.toUpperCase()}</TableCell>
                  <TableCell>
                    {describeBroadcastAudienceFilter(c.audience)}
                    {c.channel === "email" && (
                      <Typography variant="caption" display="block" color="text.secondary">
                        {EMAIL_PROVIDER_LABELS[c.email_provider]}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={c.status} color={statusColor(c.status)} />
                  </TableCell>
                  <TableCell align="right">{c.sent_count}</TableCell>
                  <TableCell align="right">{c.failed_count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Stack>
  );
}
