"use client";

import { formatUsdFromCents } from "@/lib/donations/format";
import type { DonationOrder } from "@/types/donations";
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
  pending: "warning",
  completed: "success",
  failed: "error",
  cancelled: "default",
};

type Props = {
  orders: DonationOrder[];
};

export function OrdersListClient({ orders }: Props) {
  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" sx={{ letterSpacing: "0.06em", mb: 0.5 }}>
          Orders
        </Typography>
        <Typography variant="body2" color="text.secondary">
          One-time and initial recurring donation checkouts.
        </Typography>
      </Box>

      <Paper sx={{ overflow: "auto" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Donor</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">No orders yet.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    {new Date(order.created_at).toLocaleString("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{order.donor_name ?? "—"}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {order.donor_email}
                    </Typography>
                  </TableCell>
                  <TableCell>{formatUsdFromCents(order.amount_cents)}</TableCell>
                  <TableCell>
                    {order.payment_mode === "one_time"
                      ? "One-time"
                      : order.recurrence_interval
                        ? `Recurring · ${order.recurrence_interval}`
                        : "Recurring"}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={order.status}
                      color={STATUS_COLOR[order.status] ?? "default"}
                    />
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
