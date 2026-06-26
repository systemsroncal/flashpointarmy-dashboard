"use client";

import {
  missionRankDialogTitle,
  missionRanksForAudience,
  type MissionRankAudience,
} from "@/lib/onboarding/mission-rank-info";
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

type Props = {
  open: boolean;
  audience: MissionRankAudience;
  onClose: () => void;
};

export function MissionRankInfoDialog({ open, audience, onClose }: Props) {
  const ranks = missionRanksForAudience(audience);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 800, pr: 6 }}>
        {missionRankDialogTitle(audience)}
        <IconButton
          aria-label="Close"
          onClick={onClose}
          sx={{ position: "absolute", right: 12, top: 12 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ py: 2 }}>
        {ranks.map((rank, index) => (
          <Box key={rank.title} sx={{ mb: index < ranks.length - 1 ? 2.5 : 0 }}>
            <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", mb: 0.75 }}>
              {rank.title}
            </Typography>
            {rank.unlock ? (
              <Typography variant="body2" color="primary.main" sx={{ fontWeight: 600, mb: 0.5, lineHeight: 1.6 }}>
                Unlock: {rank.unlock}
              </Typography>
            ) : null}
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
              {rank.description}
            </Typography>
          </Box>
        ))}
      </DialogContent>
    </Dialog>
  );
}
