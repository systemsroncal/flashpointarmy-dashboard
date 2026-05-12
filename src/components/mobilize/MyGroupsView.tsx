"use client";

import { Button, Card, CardContent, CardActions, Stack, Typography, Skeleton } from "@mui/material";
import Link from "next/link";
import { useEffect, useState } from "react";

type Row = {
  status: string;
  member_role: string;
  mobilize_groups: {
    id: string;
    name: string;
    group_type: string;
    visibility: string;
    created_at: string;
  } | null;
};

export function MyGroupsView() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/mobilize/my-groups");
      const json = await res.json();
      if (!cancelled && res.ok) setRows((json.memberships ?? []) as Row[]);
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <Skeleton height={200} />;

  return (
    <Stack spacing={2}>
      <Typography variant="h5" fontWeight={700}>
        My Groups
      </Typography>
      {rows.length === 0 ? (
        <Typography color="text.secondary">You are not part of any Mobilize group yet.</Typography>
      ) : (
        rows.map((r) => {
          const g = r.mobilize_groups;
          if (!g) return null;
          return (
            <Card key={g.id} variant="outlined" sx={{ bgcolor: "rgba(0,0,0,0.25)" }}>
              <CardContent>
                <Typography variant="h6">{g.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {g.group_type} · {r.member_role} · {r.status}
                </Typography>
              </CardContent>
              <CardActions>
                <Button component={Link} href={`/dashboard/mobilize/groups/${g.id}`} size="small">
                  Open
                </Button>
              </CardActions>
            </Card>
          );
        })
      )}
    </Stack>
  );
}
