"use client";

import { useDashboardUser } from "@/contexts/DashboardUserContext";
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
import { Divider, ListItemIcon, ListItemText, MenuItem, MenuList } from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  onClose?: () => void;
  onOpenProfile: () => void;
  onSignOut: () => void;
  onOpenChangePassword: () => void;
};

export function DashboardAccountMenuList({
  onClose,
  onOpenProfile,
  onSignOut,
  onOpenChangePassword,
}: Props) {
  const user = useDashboardUser();
  const pathname = usePathname();
  const profileHref = mobilizeMemberProfileHref(user.id);

  const close = () => onClose?.();

  return (
    <MenuList dense disablePadding sx={{ py: 0.5 }}>
      <MenuItem
        component={Link}
        href={profileHref}
        selected={pathname === profileHref || pathname.startsWith(`${profileHref}/`)}
        onClick={close}
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
          pathname === MOBILIZE_MY_GROUPS_HREF || pathname.startsWith(`${MOBILIZE_MY_GROUPS_HREF}/`)
        }
        onClick={close}
      >
        <ListItemIcon>
          <GroupsOutlinedIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText primary="My Groups" />
      </MenuItem>
      {SHOW_MOBILIZE_DIRECT_MESSAGES ? (
        <MenuItem
          component={Link}
          href={MOBILIZE_MESSAGES_HREF}
          selected={pathname.startsWith(MOBILIZE_MESSAGES_HREF)}
          onClick={close}
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
        onClick={close}
      >
        <ListItemIcon>
          <BookmarkBorderOutlinedIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText primary="My saved" />
      </MenuItem>
      <MenuItem
        onClick={() => {
          close();
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
          close();
          onOpenChangePassword();
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
          close();
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
  );
}