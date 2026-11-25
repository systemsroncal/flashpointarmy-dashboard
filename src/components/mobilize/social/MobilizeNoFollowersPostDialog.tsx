"use client";

import { MobilizeDialog } from "@/components/mobilize/MobilizeDialog";
import { DiscoverJoinGroupButton } from "@/components/mobilize/social/DiscoverJoinGroupButton";
import type { ComposerGroupOption } from "@/lib/mobilize/social/composer-post-target";
import {
  fetchComposerJoinedGroups,
  fetchComposerStarterGroups,
  type StarterGroupBrief,
} from "@/lib/mobilize/social/composer-no-followers-nudge";
import { mobilizeLightScrollbarSx } from "@/lib/ui/scrollbar-sx";
import { flashpointYellow } from "@/theme/tokens";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState, type ReactElement } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  posting?: boolean;
  onPostToGroup: (groupId: string, name: string) => void;
  onPostToProfileAnyway: () => void;
};

export function MobilizeNoFollowersPostDialog({
  open,
  onClose,
  posting = false,
  onPostToGroup,
  onPostToProfileAnyway,
}: Props): ReactElement {
  const [loading, setLoading] = useState(false);
  const [joinedGroups, setJoinedGroups] = useState<ComposerGroupOption[]>([]);
  const [starterGroups, setStarterGroups] = useState<StarterGroupBrief[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");

  const loadLists = useCallback(async () => {
    setLoading(true);
    try {
      const [joined, starters] = await Promise.all([
        fetchComposerJoinedGroups(),
        fetchComposerStarterGroups(),
      ]);
      setJoinedGroups(joined);
      setStarterGroups(starters);
      setSelectedGroupId((prev) => {
        if (prev && joined.some((g) => g.id === prev)) return prev;
        return joined[0]?.id ?? "";
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    void loadLists();
  }, [open, loadLists]);

  const selectedGroup = joinedGroups.find((g) => g.id === selectedGroupId);

  return (
    <MobilizeDialog
      open={open}
      onClose={posting ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      scroll="paper"
      PaperProps={{
        className: "fp-mobilize-light-scroll",
        sx: { ...mobilizeLightScrollbarSx },
      }}
    >
      <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
        You have a few followers
      </DialogTitle>
      <DialogContent dividers sx={{ pt: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          If you post on your profile, hardly anyone will see it. Share your post in a group where
          people are already active—or join one of the groups below. Your post will show on the
          group wall, not on your profile.
        </Typography>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <Stack spacing={2.5}>
            {joinedGroups.length ? (
              <Box>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                  Post to a group you&apos;re in
                </Typography>
                <RadioGroup
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                >
                  {joinedGroups.map((g) => (
                    <FormControlLabel
                      key={g.id}
                      value={g.id}
                      control={<Radio size="small" />}
                      label={
                        <Typography variant="body2" fontWeight={600}>
                          {g.name}
                        </Typography>
                      }
                      sx={{ alignItems: "center", mx: 0 }}
                    />
                  ))}
                </RadioGroup>
              </Box>
            ) : null}

            {starterGroups.length ? (
              <Box>
                {joinedGroups.length ? <Divider sx={{ mb: 2 }} /> : null}
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
                  Join a group to get started
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
                  These are popular groups across Flashpoint Army. After you join, pick the group
                  above and post there.
                </Typography>
                <Stack spacing={1}>
                  {starterGroups.map((g) => (
                    <Stack
                      key={g.id}
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      spacing={1}
                      sx={{
                        py: 0.75,
                        px: 1,
                        borderRadius: 1.5,
                        border: "1px solid rgba(0,0,0,0.08)",
                        bgcolor: "rgba(0,0,0,0.02)",
                      }}
                    >
                      <Stack direction="row" alignItems="center" spacing={1.25} sx={{ minWidth: 0 }}>
                        <Avatar
                          variant="rounded"
                          src={g.cover_image_url ?? undefined}
                          sx={{ width: 36, height: 36, bgcolor: "#1a1a1a" }}
                        >
                          <GroupsOutlinedIcon sx={{ fontSize: 20, color: flashpointYellow }} />
                        </Avatar>
                        <Typography variant="body2" fontWeight={600} noWrap title={g.name}>
                          {g.name}
                        </Typography>
                      </Stack>
                      <DiscoverJoinGroupButton
                        groupId={g.id}
                        onMembershipChange={() => void loadLists()}
                      />
                    </Stack>
                  ))}
                </Stack>
              </Box>
            ) : null}

            {!joinedGroups.length && !starterGroups.length ? (
              <Typography variant="body2" color="text.secondary">
                Browse Chapters to find groups, then come back to share your post where members
                will see it.
              </Typography>
            ) : null}
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ flexWrap: "wrap", gap: 1, px: 2, py: 1.5 }}>
        <Button onClick={onClose} disabled={posting} sx={{ textTransform: "none", fontWeight: 600 }}>
          Cancel
        </Button>
        <Button
          onClick={onPostToProfileAnyway}
          disabled={posting}
          sx={{ textTransform: "none", fontWeight: 600, ml: "auto" }}
        >
          Post to my profile anyway
        </Button>
        <Button
          variant="contained"
          disabled={posting || !selectedGroup}
          onClick={() => {
            if (!selectedGroup) return;
            onPostToGroup(selectedGroup.id, selectedGroup.name);
          }}
          sx={{
            textTransform: "none",
            fontWeight: 700,
            bgcolor: flashpointYellow,
            color: "#000",
            "&:hover": { bgcolor: "#e6c200" },
          }}
        >
          {posting ? (
            <CircularProgress size={22} sx={{ color: "#000" }} />
          ) : selectedGroup ? (
            `Post to ${selectedGroup.name}`
          ) : (
            "Post to a group"
          )}
        </Button>
      </DialogActions>
    </MobilizeDialog>
  );
}