"use client";

import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import {
  Box,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  MenuList,
  Popover,
  Tooltip,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { ChangePasswordDialog } from "./ChangePasswordDialog";

export function HeaderAccountSettingsButton({
  onOpenProfile,
  onSignOut,
}: {
  onOpenProfile: () => void;
  onSignOut: () => void;
}) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const open = Boolean(anchor);

  function closeMenu() {
    setAnchor(null);
  }

  function openProfile() {
    closeMenu();
    onOpenProfile();
  }

  function openPassword() {
    closeMenu();
    setPasswordOpen(true);
  }

  function signOut() {
    closeMenu();
    onSignOut();
  }

  return (
    <>
      <Tooltip title="Account settings">
        <IconButton
          color="inherit"
          onClick={(e) => setAnchor(e.currentTarget)}
          aria-label="Account settings"
          aria-haspopup="menu"
          aria-expanded={open ? "true" : undefined}
          data-tour="header-account-settings"
          size="small"
        >
          <SettingsOutlinedIcon fontSize="small" />
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
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Account settings
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Profile, password, and sign-out
          </Typography>
        </Box>
        <Divider />
        <MenuList dense disablePadding sx={{ py: 0.5 }}>
          <MenuItem onClick={openProfile}>
            <ListItemIcon>
              <PersonOutlineIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="My profile"
              secondary="Name, photo, phone, email"
              secondaryTypographyProps={{ variant: "caption" }}
            />
          </MenuItem>
          <MenuItem onClick={openPassword}>
            <ListItemIcon>
              <LockOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Change password"
              secondary="Update your sign-in password"
              secondaryTypographyProps={{ variant: "caption" }}
            />
          </MenuItem>
          <MenuItem onClick={signOut} data-tour="header-sign-out">
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
