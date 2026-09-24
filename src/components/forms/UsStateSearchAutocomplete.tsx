"use client";

import { authTextFieldSx } from "@/components/auth/authFieldStyles";
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
  required = false,
  authStyled = false,
  id,
  name,
}: {
  valueCode: string;
  onSelectCode: (code: string) => void;
  disabled?: boolean;
  label?: string;
  size?: "small" | "medium";
  required?: boolean;
  /** White auth-form field (external label, no floating MUI label). */
  authStyled?: boolean;
  id?: string;
  name?: string;
}) {
  const selected = usStateByCode(valueCode) ?? null;
  return (
    <Autocomplete<USStateOption, false, false, false>
      options={US_STATES}
      value={selected}
      onChange={(_, v) => onSelectCode(v?.code ?? "")}
      disabled={disabled}
      size={authStyled ? "medium" : size}
      fullWidth
      clearOnEscape
      selectOnFocus
      handleHomeEndKeys
      autoHighlight
      getOptionLabel={(o) => `${o.name} (${o.code})`}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      filterOptions={(opts, state) => filterUsStatesByQuery(opts, state.inputValue)}
      noOptionsText="No state matches your search"
      slotProps={{
        paper: {
          sx: authStyled
            ? {
                bgcolor: "#ffffff",
                color: "#000000",
                "& .MuiAutocomplete-option": { color: "#000000" },
              }
            : undefined,
        },
      }}
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
          id={id}
          name={name}
          required={required}
          label={authStyled ? undefined : label}
          placeholder={authStyled ? "" : "Search by name or 2-letter code…"}
          sx={authStyled ? authTextFieldSx : undefined}
          inputProps={{
            ...params.inputProps,
            "aria-label": label,
            autoComplete: "address-level1",
          }}
        />
      )}
    />
  );
}
