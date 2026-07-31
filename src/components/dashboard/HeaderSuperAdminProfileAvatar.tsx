"use client";

import { AvatarWithGraduateIcon } from "@/components/dashboard/training/CourseGraduateBadge";
import { useDashboardUser } from "@/contexts/DashboardUserContext";
import { isElevatedRole } from "@/lib/auth/user-roles";
import { publicAssetSrc } from "@/lib/media/public-asset-url";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import {
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  MenuList,
  Popover,
  Tooltip,
} from "@mui/material";
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
      <Tooltip title="My profile">
        <IconButton
          color="inherit"
          onClick={(e) => setAnchor(e.currentTarget)}
          aria-label="My profile"
          aria-haspopup="menu"
          aria-expanded={open ? "true" : undefined}
          data-tour="header-super-admin-profile"
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
            sx: { width: 280, mt: 0.75 },
          },
        }}
      >
        <MenuList dense disablePadding sx={{ py: 0.5 }}>
          <MenuItem
            onClick={() => {
              closeMenu();
              onOpenProfile();
            }}
          >
            <ListItemIcon>
              <PersonOutlineIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="My profile"
              secondary="Name, photo, phone, email"
              secondaryTypographyProps={{ variant: "caption" }}
            />
          </MenuItem>
          <MenuItem
            onClick={() => {
              closeMenu();
              setPasswordOpen(true);
            }}
          >
            <ListItemIcon>
              <LockOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Change password"
              secondary="Update your sign-in password"
              secondaryTypographyProps={{ variant: "caption" }}
            />
          </MenuItem>
          <Divider sx={{ my: 0.5 }} />
          <MenuItem
            onClick={() => {
              closeMenu();
              onSignOut();
            }}
            data-tour="header-sign-out"
          >
            <ListItemIcon>
              <LogoutOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Sign out"
              secondary="End your session and return to login"
              secondaryTypographyProps={{ variant: "caption" }}
            />
          </MenuItem>
        </MenuList>
      </Popover>
      <ChangePasswordDialog open={passwordOpen} onClose={() => setPasswordOpen(false)} />
    </>
  );
}
