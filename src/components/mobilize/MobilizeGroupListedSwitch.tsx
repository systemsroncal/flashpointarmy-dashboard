"use client";

import { Box, FormControlLabel, Switch, Typography } from "@mui/material";

type Props = {
  listed: boolean;
  onListedChange: (listed: boolean) => void;
  disabled?: boolean;
  label?: string;
  listedHint?: string;
  unlistedHint?: string;
};

export default function MobilizeGroupListedSwitch({
  listed,
  onListedChange,
  disabled,
  label = "Listed on map and chapters",
  listedHint = "Visible on the Mobilize map and chapters list.",
  unlistedHint = "Hidden from map and list. Only accessible via the direct chapter URL.",
}: Props) {
  return (
    <Box>
      <FormControlLabel
        control={
          <Switch
            checked={listed}
            onChange={(e) => onListedChange(e.target.checked)}
            disabled={disabled}
          />
        }
        label={label}
      />
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: -0.5 }}>
        {listed ? listedHint : unlistedHint}
      </Typography>
    </Box>
  );
}
