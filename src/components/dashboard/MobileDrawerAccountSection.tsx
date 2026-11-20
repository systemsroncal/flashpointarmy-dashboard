"use client";

import { AvatarWithGraduateIcon } from "@/components/dashboard/training/CourseGraduateBadge";
import { DashboardAccountMenuList } from "@/components/dashboard/DashboardAccountMenuList";
import { ChangePasswordDialog } from "@/components/dashboard/ChangePasswordDialog";
import { useDashboardUser } from "@/contexts/DashboardUserContext";
import { isElevatedRole } from "@/lib/auth/user-roles";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Box, Collapse, Divider, Typography } from "@mui/material";
import { useState } from "react";

type Props = {
  shellAvatarSrc?: string;
  displayName: string;
  onOpenProfile: () => void;
  onSignOut: () => void;
  onNavigate?: () => void;
};

export function MobileDrawerAccountSection({
  shellAvatarSrc,
  displayName,
  onOpenProfile,
  onSignOut,
  onNavigate,
}: Props) {
  const user = useDashboardUser();
  const [open, setOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);

  const closeDrawer = () => onNavigate?.();

  return (
    <Box sx={{ px: 1.5, pt: 1.25, pb: 0.5 }}>
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
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
        <Box
          component="button"
          type="button"
          onClick={() => setOpen((v) => !v)}
          sx={{
            mt: 1.25,
            mb: 0.5,
            border: "none",
            bgcolor: "transparent",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 0.5,
            color: "text.primary",
            p: 0.5,
            borderRadius: 1,
            "&:hover": { bgcolor: "rgba(255,255,255,0.06)" },
          }}
          aria-expanded={open}
        >
          <Typography variant="body2" fontWeight={700} sx={{ lineHeight: 1.3 }}>
            {displayName}
          </Typography>
          <ExpandMoreIcon
            fontSize="small"
            sx={{
              color: "primary.main",
              transform: open ? "rotate(180deg)" : "none",
              transition: "transform 0.2s ease",
            }}
          />
        </Box>
      </Box>
      <Collapse in={open}>
        <Divider sx={{ borderColor: "rgba(255,215,0,0.15)", mb: 0.5 }} />
        <DashboardAccountMenuList
          onClose={closeDrawer}
          onOpenProfile={() => {
            closeDrawer();
            onOpenProfile();
          }}
          onSignOut={onSignOut}
          onOpenChangePassword={() => setPasswordOpen(true)}
        />
      </Collapse>
      <ChangePasswordDialog open={passwordOpen} onClose={() => setPasswordOpen(false)} />
    </Box>
  );
}