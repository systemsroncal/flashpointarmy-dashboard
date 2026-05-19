"use client";

import type { PresenceRangePreset } from "@/lib/reports/presence-range";
import {
  Box,
  Button,
  ButtonGroup,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

export function ReportsPresenceDateRangeControls({
  preset,
  customFrom,
  customTo,
  onPresetChange,
  onCustomFromChange,
  onCustomToChange,
  compact,
}: {
  preset: PresenceRangePreset;
  customFrom: string;
  customTo: string;
  onPresetChange: (preset: PresenceRangePreset) => void;
  onCustomFromChange: (value: string) => void;
  onCustomToChange: (value: string) => void;
  /** Smaller layout when nested under a chart title */
  compact?: boolean;
}) {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={1.5}
      alignItems={{ sm: "center" }}
      flexWrap="wrap"
      sx={{ mb: compact ? 1.5 : 2 }}
    >
      {!compact ? (
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mr: 0.5 }}>
          Period (UTC)
        </Typography>
      ) : null}
      <ButtonGroup size="small" variant="outlined" aria-label="Report period">
        <Button
          variant={preset === "7d" ? "contained" : "outlined"}
          onClick={() => onPresetChange("7d")}
        >
          Last 7 days
        </Button>
        <Button
          variant={preset === "30d" ? "contained" : "outlined"}
          onClick={() => onPresetChange("30d")}
        >
          Last 30 days
        </Button>
        <Button
          variant={preset === "custom" ? "contained" : "outlined"}
          onClick={() => onPresetChange("custom")}
        >
          Custom range
        </Button>
      </ButtonGroup>
      {preset === "custom" ? (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center" }}>
          <TextField
            label="From"
            type="date"
            size="small"
            value={customFrom}
            onChange={(e) => onCustomFromChange(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ width: 160 }}
          />
          <TextField
            label="To"
            type="date"
            size="small"
            value={customTo}
            onChange={(e) => onCustomToChange(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ width: 160 }}
          />
        </Box>
      ) : null}
    </Stack>
  );
}
