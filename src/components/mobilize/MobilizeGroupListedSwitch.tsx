"use client";

import { Box, FormControlLabel, Switch, Typography } from "@mui/material";

type Props = {
  listed: boolean;
  onListedChange: (listed: boolean) => void;
  disabled?: boolean;
};

export default function MobilizeGroupListedSwitch({ listed, onListedChange, disabled }: Props) {
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
        label="Listed on map and groups"
      />
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: -0.5 }}>
        {listed
          ? "Visible on the Mobilize map and groups list."
          : "Hidden from map and list. Only accessible via the direct group URL."}
      </Typography>
    </Box>
  );
}
