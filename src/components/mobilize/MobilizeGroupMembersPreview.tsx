"use client";

import { AvatarWithGraduateIcon } from "@/components/dashboard/training/CourseGraduateBadge";
import { MobilizeProfileSidebarCard } from "@/components/mobilize/social/MobilizeProfileSidebarCard";
import { mobilizeGroupDetailHref } from "@/lib/mobilize/group-detail-tabs";
import type { TrainingGraduateBadgeRole } from "@/lib/courses/course-completion";
import { publicAssetSrc } from "@/lib/media/public-asset-url";
import { flashpointYellow } from "@/theme/tokens";
import { Box, Link as MuiLink, Stack, Typography } from "@mui/material";
import Link from "next/link";
import { mobilizeMemberProfileHref } from "@/lib/mobilize/social/profile-href";

export type GroupMemberPreviewRow = {
  user_id: string;
  member_role: string;
  display_name?: string;
  email?: string | null;
  avatar_url?: string | null;
  training_graduate_badge?: TrainingGraduateBadgeRole | null;
};

function capitalizeRole(role: string): string {
  return role === "leader" ? "Leader" : "Member";
}

type Props = {
  members: GroupMemberPreviewRow[];
  totalCount: number;
  groupId: string;
};

export function MobilizeGroupMembersPreview({ members, totalCount, groupId }: Props) {
  if (totalCount === 0) return null;

  return (
    <MobilizeProfileSidebarCard title={`Members (${totalCount})`} variant="groupFeed">
      <Stack spacing={1.25} sx={{ mb: 1.5 }}>
        {members.map((m) => {
          const name = m.display_name ?? m.email ?? m.user_id.slice(0, 8);
          return (
            <Stack key={m.user_id} direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
              <AvatarWithGraduateIcon
                graduateRole={m.training_graduate_badge}
                overlayStyle="directory"
                size={36}
                src={m.avatar_url ? publicAssetSrc(m.avatar_url) : undefined}
                alt={name}
                avatarSx={{
                  bgcolor: "rgba(0,0,0,0.08)",
                  color: "rgba(0,0,0,0.55)",
                  width: 36,
                  height: 36,
                  fontSize: "0.85rem",
                }}
              >
                {name.slice(0, 1).toUpperCase()}
              </AvatarWithGraduateIcon>
              <Typography
                variant="body2"
                component={Link}
                href={`${mobilizeMemberProfileHref(m.user_id)}?from=group&groupId=${groupId}`}
                noWrap
                sx={{
                  flex: 1,
                  minWidth: 0,
                  fontWeight: 600,
                  color: "inherit",
                  textDecoration: "none",
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                {name}
              </Typography>
              <Box
                sx={{
                  flexShrink: 0,
                  px: 1.1,
                  py: 0.25,
                  borderRadius: 99,
                  bgcolor: flashpointYellow,
                  color: "#0a0a0a",
                  fontSize: "0.68rem",
                  fontWeight: 800,
                  lineHeight: 1.2,
                }}
              >
                {capitalizeRole(m.member_role)}
              </Box>
            </Stack>
          );
        })}
      </Stack>
      <MuiLink
        component={Link}
        href={mobilizeGroupDetailHref(groupId, "members")}
        underline="none"
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.35,
          color: "#000",
          fontWeight: 700,
          fontSize: "0.82rem",
          "&:hover": { textDecoration: "underline", color: "#000" },
        }}
      >
        View all members →
      </MuiLink>
    </MobilizeProfileSidebarCard>
  );
}
