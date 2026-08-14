"use client";

import { FormControl, InputLabel, MenuItem, Select, Typography, Box } from "@mui/material";
import type { MobilizeGroupPublishStatus } from "@/lib/mobilize/group-ui-labels";

type Props = {
  value: MobilizeGroupPublishStatus;
  onChange: (status: MobilizeGroupPublishStatus) => void;
  disabled?: boolean;
};

export default function MobilizeGroupPublishStatusSelect({ value, onChange, disabled }: Props) {
  return (
    <Box>
      <FormControl fullWidth size="small" disabled={disabled}>
        <InputLabel id="group-publish-status">Status</InputLabel>
        <Select
          labelId="group-publish-status"
          label="Status"
          value={value}
          onChange={(e) => onChange(e.target.value === "draft" ? "draft" : "published")}
        >
          <MenuItem value="published">Published</MenuItem>
          <MenuItem value="draft">Draft</MenuItem>
        </Select>
      </FormControl>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
        {value === "draft"
          ? "Saved in the dashboard only. Hidden from the map, public lists, and the public group page."
          : "Visible according to Listed / Unlisted and other public settings."}
      </Typography>
    </Box>
  );
}
