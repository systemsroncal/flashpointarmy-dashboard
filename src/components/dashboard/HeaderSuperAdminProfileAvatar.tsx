"use client";

import { AvatarWithGraduateIcon } from "@/components/dashboard/training/CourseGraduateBadge";
import { useDashboardUser } from "@/contexts/DashboardUserContext";
import { isElevatedRole, isSuperAdminUser } from "@/lib/auth/user-roles";
import { publicAssetSrc } from "@/lib/media/public-asset-url";
import {
  isMobilizeSocialNavActive,
  mobilizeSocialNavItems,
  type MobilizeSocialNavKey,
} from "@/lib/mobilize/social/mobilize-social-nav-config";
import { mobilizeMemberProfileHref } from "@/lib/mobilize/social/profile-href";
import BookmarkBorderOutlinedIcon from "@mui/icons-material/BookmarkBorderOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
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
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { ChangePasswordDialog } from "./ChangePasswordDialog";

const SOCIAL_MENU_ICONS: Record<Exclude<MobilizeSocialNavKey, "search">, ReactNode> = {
  home: <HomeOutlinedIcon fontSize="small" />,
  alerts: <NotificationsNoneOutlinedIcon fontSize="small" />,
  messages: <MailOutlineIcon fontSize="small" />,
  groups: <GroupsOutlinedIcon fontSize="small" />,
  bookmarks: <BookmarkBorderOutlinedIcon fontSize="small" />,
  profile: <PersonOutlineIcon fontSize="small" />,
  settings: <SettingsOutlinedIcon fontSize="small" />,
};

export function HeaderSuperAdminProfileAvatar({
  onOpenProfile,
  onSignOut,
}: {
  onOpenProfile: () => void;
  onSignOut: () => void;
}) {
  const user = useDashboardUser();
  const pathname = usePathname();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const open = Boolean(anchor);
  const isSuperAdmin = isSuperAdminUser(user.role_names);
  const profileHref = mobilizeMemberProfileHref(user.id);

  const socialItems = useMemo(
    () =>
      isSuperAdmin
        ? mobilizeSocialNavItems(profileHref).filter((item) => item.key !== "search")
        : [],
    [isSuperAdmin, profileHref]
  );

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
          {socialItems.map((item) => {
            const active = isMobilizeSocialNavActive(item.key, pathname, profileHref);
            return (
              <MenuItem
                key={item.key}
                component={Link}
                href={item.href}
                selected={active}
                onClick={closeMenu}
              >
                <ListItemIcon>{SOCIAL_MENU_ICONS[item.key as Exclude<MobilizeSocialNavKey, "search">]}</ListItemIcon>
                <ListItemText primary={item.label} />
              </MenuItem>
            );
          })}
          {socialItems.length > 0 ? <Divider sx={{ my: 0.5 }} /> : null}
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
