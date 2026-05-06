"use client";

import {
  filterUsStatesByQuery,
  US_STATES,
  usStateByCode,
  type USStateOption,
} from "@/data/usStates";
import { Autocomplete, Box, TextField, Typography } from "@mui/material";

export function UsStateSearchAutocomplete({
  valueCode,
  onSelectCode,
  disabled,
  label = "State (optional)",
  size = "small",
}: {
  valueCode: string;
  onSelectCode: (code: string) => void;
  disabled?: boolean;
  label?: string;
  size?: "small" | "medium";
}) {
  const selected = usStateByCode(valueCode) ?? null;
  return (
    <Autocomplete<USStateOption, false, false, false>
      options={US_STATES}
      value={selected}
      onChange={(_, v) => onSelectCode(v?.code ?? "")}
      disabled={disabled}
      size={size}
      fullWidth
      clearOnEscape
      selectOnFocus
      handleHomeEndKeys
      getOptionLabel={(o) => `${o.name} (${o.code})`}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      filterOptions={(opts, state) => filterUsStatesByQuery(opts, state.inputValue)}
      noOptionsText="No state matches your search"
      renderOption={(props, option) => {
        const { key, ...optionProps } = props;
        return (
          <li key={key} {...optionProps}>
            <Box>
              <Typography variant="body2">{option.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                Code {option.code}
              </Typography>
            </Box>
          </li>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder="Search by name or 2-letter code…"
        />
      )}
    />
  );
}
