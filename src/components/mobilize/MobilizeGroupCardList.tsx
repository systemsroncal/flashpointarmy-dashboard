"use client";

import { Box, Button, CircularProgress, Skeleton, Stack, Typography } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import Link from "next/link";
import { useState } from "react";
import type { MobilizeBrowseGroupRow } from "@/components/mobilize/MobilizeGroupsBrowseTable";
import { useMobilizeToast } from "@/components/mobilize/MobilizeToastProvider";
import { isMobilizeGroupListed } from "@/lib/mobilize/group-ui-labels";
import { mobilizeChapterCoverSrc } from "@/lib/mobilize/mobilize-chapter-cover";
import { publicAssetSrc } from "@/lib/media/public-asset-url";
import { mobilizePanelTheme } from "@/theme/mobilize-content-theme";

type Props = {
  groups: MobilizeBrowseGroupRow[];
  loading?: boolean;
  emptyMessage?: string;
  onJoined?: () => void | Promise<void>;
};

const ACTION_BUTTON_SX = {
  flexShrink: 0,
  textTransform: "none" as const,
  fontWeight: 700,
  borderRadius: "8px",
  boxShadow: "none",
  px: 2,
  bgcolor: "#e7f3ff",
  color: "#1877f2",
  "&:hover": { bgcolor: "#d8eaff", boxShadow: "none" },
  "&.Mui-disabled": { bgcolor: "#f0f2f5", color: "rgba(0,0,0,0.4)" },
};

/** Members already in the group get the green "Create post" action. */
const CREATE_POST_BUTTON_SX = {
  ...ACTION_BUTTON_SX,
  bgcolor: "#6ecc3999",
  color: "#5d5d5d",
  "&:hover": { bgcolor: "#6ecc39cc", boxShadow: "none" },
};

function formatMemberCount(count: number): string {
  if (count < 1000) return String(count);
  const thousands = count / 1000;
  const label = thousands >= 10 ? Math.round(thousands) : Math.round(thousands * 10) / 10;
  return `${label}K`;
}

export default function MobilizeGroupCardList({
  groups,
  loading = false,
  emptyMessage = "You are not in any Mobilize group yet.",
  onJoined,
}: Props) {
  const toast = useMobilizeToast();
  const [joiningId, setJoiningId] = useState<string | null>(null);

  async function joinGroup(groupId: string) {
    setJoiningId(groupId);
    try {
      const res = await fetch(`/api/mobilize/groups/${groupId}/join`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Join failed.");
      const status = json.membership?.membership_status;
      toast(status === "approved" ? "You joined this group." : "Join request sent.", "success");
      await onJoined?.();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Join failed.", "error");
    } finally {
      setJoiningId(null);
    }
  }

  if (loading) {
    return (
      <Stack spacing={1.25}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} variant="rectangular" height={96} sx={{ borderRadius: "10px" }} />
        ))}
      </Stack>
    );
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
    <ThemeProvider theme={mobilizePanelTheme}>
      <Stack spacing={1.25}>
        {groups.map((g) => {
          const detailHref = `/dashboard/mobilize/groups/${g.id}`;
          const cover = publicAssetSrc(mobilizeChapterCoverSrc(g.cover_image_url));
          const isMember = g.my_membership_status === "approved";
          const isPending = g.my_membership_status === "pending";
          const visibilityLabel = isMobilizeGroupListed(g.visibility) ? "Public" : "Private";
          const metaLine = `${visibilityLabel} · ${formatMemberCount(g.member_count ?? 0)} members`;

          return (
            <Box
              key={g.id}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                p: 1.25,
                bgcolor: "#fff",
                border: "1px solid rgba(0,0,0,0.1)",
                borderRadius: "10px",
              }}
            >
              <Box
                component={Link}
                href={detailHref}
                aria-label={`Open ${g.name}`}
                sx={{ display: "block", lineHeight: 0, flexShrink: 0 }}
              >
                <Box
                  component="img"
                  src={cover}
                  alt=""
                  sx={{
                    width: { xs: 64, sm: 72 },
                    height: { xs: 64, sm: 72 },
                    objectFit: "cover",
                    borderRadius: "8px",
                    display: "block",
                  }}
                />
              </Box>

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  component={Link}
                  href={detailHref}
                  fontWeight={700}
                  color="text.primary"
                  title={g.name}
                  sx={{
                    textDecoration: "none",
                    "&:hover": { textDecoration: "underline" },
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    lineHeight: 1.25,
                    fontSize: { xs: "0.95rem", sm: "1rem" },
                  }}
                >
                  {g.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap sx={{ mt: 0.25 }}>
                  {metaLine}
                </Typography>
              </Box>

              {isMember ? (
                <Button component={Link} href={detailHref} size="small" sx={CREATE_POST_BUTTON_SX}>
                  Create post
                </Button>
              ) : isPending ? (
                <Button size="small" disabled sx={ACTION_BUTTON_SX}>
                  Pending
                </Button>
              ) : (
                <Button
                  size="small"
                  disabled={joiningId === g.id}
                  onClick={() => void joinGroup(g.id)}
                  sx={ACTION_BUTTON_SX}
                  startIcon={joiningId === g.id ? <CircularProgress size={14} color="inherit" /> : undefined}
                >
                  Join
                </Button>
              )}
            </Box>
          );
        })}
      </Stack>
    </ThemeProvider>
  );
}
