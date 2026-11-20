"use client";

import { AvatarWithGraduateIcon } from "@/components/dashboard/training/CourseGraduateBadge";
import { useDashboardUser } from "@/contexts/DashboardUserContext";
import { isElevatedRole } from "@/lib/auth/user-roles";
import { publicAssetSrc } from "@/lib/media/public-asset-url";
import { DashboardAccountMenuList } from "@/components/dashboard/DashboardAccountMenuList";
import { IconButton, Popover, Tooltip } from "@mui/material";
import { useState } from "react";
import { ChangePasswordDialog } from "./ChangePasswordDialog";

export function HeaderSuperAdminProfileAvatar({
  onOpenProfile,
  onSignOut,
}: {
  onOpenProfile: () => void;
  onSignOut: () => void;
}) {
  const user = useDashboardUser();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const open = Boolean(anchor);

  const displayInitial =
    user.display_name?.trim() ||
    [user.first_name, user.last_name].filter(Boolean).join(" ").trim() ||
    user.email.split("@")[0];

  function closeMenu() {
    setAnchor(null);
  }

  return (
    <>
      <Tooltip title="Account">
        <IconButton
          color="inherit"
          onClick={(e) => setAnchor(e.currentTarget)}
          aria-label="Account menu"
          aria-haspopup="menu"
          aria-expanded={open ? "true" : undefined}
          data-tour="header-account-settings"
          size="small"
          sx={{ ml: 0.25 }}
        >
          <AvatarWithGraduateIcon
            size={30}
            overlayStyle="sidebar"
            graduateRole={user.training_graduate_badge}
            showAdminCrown={isElevatedRole(user.role_names)}
            src={user.avatar_url ? publicAssetSrc(user.avatar_url) : undefined}
            alt={displayInitial}
            avatarSx={{ bgcolor: "primary.dark", fontSize: "0.82rem" }}
          >
            {displayInitial.slice(0, 2).toUpperCase()}
          </AvatarWithGraduateIcon>
        </IconButton>
      </Tooltip>
      <Popover
        open={open}
        anchorEl={anchor}
        onClose={closeMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: { width: 260, mt: 0.75 },
          },
        }}
      >
        <DashboardAccountMenuList
          onClose={closeMenu}
          onOpenProfile={onOpenProfile}
          onSignOut={onSignOut}
          onOpenChangePassword={() => setPasswordOpen(true)}
        />
      </Popover>
      <ChangePasswordDialog open={passwordOpen} onClose={() => setPasswordOpen(false)} />
    </>
  );
}
