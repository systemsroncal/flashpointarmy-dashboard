"use client";

import type { AdminStaffOption } from "@/lib/onboarding/onboarding-records";
import { Autocomplete, Box, TextField, Typography } from "@mui/material";

type Props = {
  options: AdminStaffOption[];
  valueId: string;
  onChangeId: (id: string) => void;
  label?: string;
  disabled?: boolean;
};

export function AdminStaffSearchAutocomplete({
  options,
  valueId,
  onChangeId,
  label = "Coach",
  disabled = false,
}: Props) {
  const value = options.find((o) => o.id === valueId) ?? null;

  return (
    <Autocomplete
      options={options}
      value={value}
      onChange={(_, v) => onChangeId(v?.id ?? "")}
      disabled={disabled}
      getOptionLabel={(o) => o.label}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      filterOptions={(opts, state) => {
        const q = state.inputValue.trim().toLowerCase();
        if (!q) return opts;
        return opts.filter((o) => `${o.label} ${o.email}`.toLowerCase().includes(q));
      }}
      renderOption={(props, option) => {
        const { key, ...rest } = props as { key: string };
        return (
          <li key={key} {...rest}>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {option.label}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {option.email}
              </Typography>
            </Box>
          </li>
        );
      }}
      renderInput={(params) => (
        <TextField {...params} label={label} placeholder="Search administrators…" />
      )}
    />
  );
}
