"use client";

import { AvatarWithGraduateIcon } from "@/components/dashboard/training/CourseGraduateBadge";
import { useDashboardUser } from "@/contexts/DashboardUserContext";
import { isElevatedRole } from "@/lib/auth/user-roles";
import { Box, Typography } from "@mui/material";
import Link from "next/link";

type Props = {
  shellAvatarSrc?: string;
  displayName: string;
  profileHref: string;
  onNavigate?: () => void;
};

export function MobileDrawerAccountSection({
  shellAvatarSrc,
  displayName,
  profileHref,
  onNavigate,
}: Props) {
  const user = useDashboardUser();

  return (
    <Box sx={{ px: 1.5, pt: 1.25, pb: 0.5 }}>
      <Box
        component={Link}
        href={profileHref}
        onClick={() => onNavigate?.()}
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          textDecoration: "none",
          color: "inherit",
          borderRadius: 1.5,
          py: 0.5,
          "&:hover": { bgcolor: "rgba(255,255,255,0.06)" },
        }}
      >
        <AvatarWithGraduateIcon
          size={72}
          overlayStyle="sidebar"
          graduateRole={user.training_graduate_badge}
          showAdminCrown={isElevatedRole(user.role_names)}
          src={shellAvatarSrc}
          alt={displayName}
          avatarSx={{ bgcolor: "primary.dark", fontSize: "1.25rem" }}
        >
          {displayName.slice(0, 2).toUpperCase()}
        </AvatarWithGraduateIcon>
        <Typography variant="body2" fontWeight={700} sx={{ mt: 1.25, mb: 0.5, lineHeight: 1.3 }}>
          {displayName}
        </Typography>
      </Box>
    </Box>
  );
}