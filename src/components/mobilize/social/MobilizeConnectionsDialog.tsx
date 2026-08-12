"use client";

import { MobilizeDialog } from "@/components/mobilize/MobilizeDialog";
import { publicAssetSrc } from "@/lib/media/public-asset-url";
import { mobilizeMemberProfileHref } from "@/lib/mobilize/social/profile-href";
import { Avatar, Box, CircularProgress, DialogContent, DialogTitle, Stack, Typography } from "@mui/material";
import Link from "next/link";
import { useEffect, useState } from "react";

export type ConnectionKind = "followers" | "following";

type ConnectionUser = {
  id: string;
  display_name: string;
  handle: string;
  avatar_url: string | null;
};

export function MobilizeConnectionsDialog({
  open,
  kind,
  userId,
  onClose,
}: {
  open: boolean;
  kind: ConnectionKind;
  userId: string;
  onClose: () => void;
}) {
  const [users, setUsers] = useState<ConnectionUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setUsers([]);
    void (async () => {
      try {
        const res = await fetch(`/api/mobilize/social/profiles/${userId}/connections?type=${kind}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load.");
        if (!cancelled) setUsers((json.users ?? []) as ConnectionUser[]);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, kind, userId]);

  const title = kind === "followers" ? "Followers" : "Following";

  return (
    <MobilizeDialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers sx={{ minHeight: 180 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
            <CircularProgress size={26} />
          </Box>
        ) : error ? (
          <Typography variant="body2" color="error">
            {error}
          </Typography>
        ) : !users.length ? (
          <Typography variant="body2" color="text.secondary">
            {kind === "followers" ? "No followers yet." : "Not following anyone yet."}
          </Typography>
        ) : (
          <Stack spacing={0.5}>
            {users.map((u) => (
              <Box
                key={u.id}
                component={Link}
                href={mobilizeMemberProfileHref(u.id)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.25,
                  py: 0.9,
                  px: 1,
                  borderRadius: 1.5,
                  color: "inherit",
                  textDecoration: "none",
                  "&:hover": { bgcolor: "rgba(0,0,0,0.045)" },
                }}
              >
                <Avatar
                  src={u.avatar_url ? publicAssetSrc(u.avatar_url) : undefined}
                  sx={{ width: 40, height: 40, bgcolor: "#263238", flexShrink: 0 }}
                >
                  {u.display_name.charAt(0).toUpperCase()}
                </Avatar>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="body2" fontWeight={700} noWrap title={u.display_name}>
                    {u.display_name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {u.handle}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Stack>
        )}
      </DialogContent>
    </MobilizeDialog>
  );
}
