"use client";

import { AvatarWithGraduateIcon } from "@/components/dashboard/training/CourseGraduateBadge";
import { useDashboardUser } from "@/contexts/DashboardUserContext";
import { isElevatedRole } from "@/lib/auth/user-roles";
import { publicAssetSrc } from "@/lib/media/public-asset-url";
import {
  MOBILIZE_BOOKMARKS_HREF,
  MOBILIZE_MESSAGES_HREF,
  MOBILIZE_MY_GROUPS_HREF,
  SHOW_MOBILIZE_DIRECT_MESSAGES,
} from "@/lib/mobilize/mobilize-nav-config";
import { mobilizeMemberProfileHref } from "@/lib/mobilize/social/profile-href";
import BookmarkBorderOutlinedIcon from "@mui/icons-material/BookmarkBorderOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
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
  const pathname = usePathname();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const open = Boolean(anchor);
  const profileHref = mobilizeMemberProfileHref(user.id);

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
        <MenuList dense disablePadding sx={{ py: 0.5 }}>
          <MenuItem
            component={Link}
            href={profileHref}
            selected={pathname === profileHref || pathname.startsWith(`${profileHref}/`)}
            onClick={closeMenu}
          >
            <ListItemIcon>
              <PersonOutlineIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="My profile" />
          </MenuItem>
          <MenuItem
            component={Link}
            href={MOBILIZE_MY_GROUPS_HREF}
            selected={
              pathname === MOBILIZE_MY_GROUPS_HREF ||
              pathname.startsWith(`${MOBILIZE_MY_GROUPS_HREF}/`)
            }
            onClick={closeMenu}
          >
            <ListItemIcon>
              <GroupsOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Groups" />
          </MenuItem>
          {SHOW_MOBILIZE_DIRECT_MESSAGES ? (
            <MenuItem
              component={Link}
              href={MOBILIZE_MESSAGES_HREF}
              selected={pathname.startsWith(MOBILIZE_MESSAGES_HREF)}
              onClick={closeMenu}
            >
              <ListItemIcon>
                <MailOutlineIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Messages" />
            </MenuItem>
          ) : null}
          <MenuItem
            component={Link}
            href={MOBILIZE_BOOKMARKS_HREF}
            selected={pathname.startsWith(MOBILIZE_BOOKMARKS_HREF)}
            onClick={closeMenu}
          >
            <ListItemIcon>
              <BookmarkBorderOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="My saved" />
          </MenuItem>
          <MenuItem
            onClick={() => {
              closeMenu();
              onOpenProfile();
            }}
          >
            <ListItemIcon>
              <SettingsOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Settings" />
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
            <ListItemText primary="Change password" />
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
            <ListItemText primary="Sign out" />
          </MenuItem>
        </MenuList>
      </Popover>
      <ChangePasswordDialog open={passwordOpen} onClose={() => setPasswordOpen(false)} />
    </>
  );
}
