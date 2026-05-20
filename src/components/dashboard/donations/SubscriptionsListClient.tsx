"use client";

import { formatUsdFromCents } from "@/lib/donations/format";
import type { DonationSubscription } from "@/types/donations";
import {
  Box,
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

const STATUS_COLOR: Record<string, "default" | "success" | "warning" | "error"> = {
  active: "success",
  paused: "warning",
  past_due: "error",
  cancelled: "default",
};

type Props = {
  subscriptions: DonationSubscription[];
};

export function SubscriptionsListClient({ subscriptions }: Props) {
  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" sx={{ letterSpacing: "0.06em", mb: 0.5 }}>
          Subscriptions
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Active and past recurring donations.
        </Typography>
      </Box>

      <Paper sx={{ overflow: "auto" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Started</TableCell>
              <TableCell>Donor</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Interval</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Next period end</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {subscriptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">No subscriptions yet.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              subscriptions.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell>
                    {new Date(sub.created_at).toLocaleString("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{sub.donor_name ?? "—"}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {sub.donor_email}
                    </Typography>
                  </TableCell>
                  <TableCell>{formatUsdFromCents(sub.amount_cents)}</TableCell>
                  <TableCell sx={{ textTransform: "capitalize" }}>{sub.recurrence_interval}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={sub.status}
                      color={STATUS_COLOR[sub.status] ?? "default"}
                    />
                  </TableCell>
                  <TableCell>
                    {sub.current_period_end
                      ? new Date(sub.current_period_end).toLocaleDateString("en-US", {
                          dateStyle: "medium",
                        })
                      : "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>
    </Stack>
  );
}
