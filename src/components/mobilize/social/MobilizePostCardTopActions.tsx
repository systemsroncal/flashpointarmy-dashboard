"use client";

import BookmarkBorderOutlinedIcon from "@mui/icons-material/BookmarkBorderOutlined";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PushPinOutlinedIcon from "@mui/icons-material/PushPinOutlined";
import {
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
} from "@mui/material";
import { useState } from "react";
import { TRUTH_HUB_TEXT_MUTED } from "@/lib/mobilize/social/social-hub-surface";

export type MobilizePostManageProps = {
  onEdit?: () => void;
  onDelete?: () => void;
  onPin?: () => void;
  isPinned?: boolean;
  showPin?: boolean;
};

type Props = {
  tone?: "light" | "dark";
  showBookmark?: boolean;
  bookmarked?: boolean;
  bookmarkBusy?: boolean;
  onToggleBookmark?: () => void;
  manage?: MobilizePostManageProps;
};

export function MobilizePostCardTopActions({
  tone = "light",
  showBookmark = false,
  bookmarked = false,
  bookmarkBusy = false,
  onToggleBookmark,
  manage,
}: Props) {
  const isDark = tone === "dark";
  const iconColor = isDark ? TRUTH_HUB_TEXT_MUTED : "rgba(0,0,0,0.55)";
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  const hasManage =
    Boolean(manage?.onEdit) || Boolean(manage?.onDelete) || Boolean(manage?.showPin && manage?.onPin);

  if (!showBookmark && !hasManage) return null;

  return (
  <>
      <Stack direction="row" alignItems="center" spacing={0.25} sx={{ flexShrink: 0, ml: 0.5 }}>
        {showBookmark && onToggleBookmark ? (
          <Tooltip title={bookmarked ? "Unsave" : "Save"}>
            <span>
              <IconButton
                size="small"
                disabled={bookmarkBusy}
                onClick={onToggleBookmark}
                aria-label={bookmarked ? "Unsave post" : "Save post"}
                sx={{ color: bookmarked ? "#1877f2" : iconColor }}
              >
                {bookmarked ? <BookmarkIcon fontSize="small" /> : <BookmarkBorderOutlinedIcon fontSize="small" />}
              </IconButton>
            </span>
          </Tooltip>
        ) : null}
        {hasManage ? (
          <Tooltip title="Post options">
            <IconButton
              size="small"
              aria-label="Post options"
              onClick={(e) => setMenuAnchor(e.currentTarget)}
              sx={{ color: iconColor }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ) : null}
      </Stack>
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        {manage?.showPin && manage.onPin ? (
          <MenuItem
            onClick={() => {
              manage.onPin?.();
              setMenuAnchor(null);
            }}
          >
            <ListItemIcon>
              <PushPinOutlinedIcon fontSize="small" color={manage.isPinned ? "primary" : "inherit"} />
            </ListItemIcon>
            <ListItemText primary={manage.isPinned ? "Unpin post" : "Pin post"} />
          </MenuItem>
        ) : null}
        {manage?.onEdit ? (
          <MenuItem
            onClick={() => {
              manage.onEdit?.();
              setMenuAnchor(null);
            }}
          >
            <ListItemIcon>
              <EditOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Edit post" />
          </MenuItem>
        ) : null}
        {manage?.onDelete ? (
          <MenuItem
            onClick={() => {
              manage.onDelete?.();
              setMenuAnchor(null);
            }}
            sx={{ color: "error.main" }}
          >
            <ListItemIcon sx={{ color: "error.main" }}>
              <DeleteOutlineIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Delete post" />
          </MenuItem>
        ) : null}
      </Menu>
    </>
  );
}