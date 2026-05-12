"use client";

import { useEffect, useState } from "react";
import { Box, Card, CardContent, Chip, List, ListItemButton, ListItemText, Skeleton, Typography } from "@mui/material";
import Link from "next/link";
import { useMobilizeToast } from "@/components/mobilize/MobilizeToastProvider";

type Row = { id: string; name: string; group_type: string; visibility: string; membership?: { membership_status?: string; member_role?: string } };

export default function MyGroupsPage() {
  const toast = useMobilizeToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/mobilize/my-groups");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load.");
        setRows(json.groups ?? []);
      } catch (e) {
        toast(e instanceof Error ? e.message : "Error", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        My Groups
      </Typography>
      {loading ? (
        <Skeleton height={200} />
      ) : (
        <List dense>
          {rows.map((g) => (
            <Card key={g.id} variant="outlined" sx={{ mb: 1, bgcolor: "rgba(0,0,0,0.2)" }}>
              <ListItemButton component={Link} href={`/dashboard/mobilize/groups/${g.id}`}>
                <ListItemText
                  primary={g.name}
                  secondary={
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 0.5 }}>
                      <Chip size="small" label={g.group_type} />
                      <Chip size="small" label={g.visibility} />
                      {g.membership?.membership_status ? (
                        <Chip size="small" label={g.membership.membership_status} color="primary" variant="outlined" />
                      ) : null}
                    </Box>
                  }
                />
              </ListItemButton>
            </Card>
          ))}
          {!rows.length ? (
            <Card variant="outlined">
              <CardContent>
                <Typography color="text.secondary">You are not in any Mobilize group yet.</Typography>
              </CardContent>
            </Card>
          ) : null}
        </List>
      )}
    </Box>
  );
}
