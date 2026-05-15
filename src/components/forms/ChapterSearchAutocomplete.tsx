"use client";

import {
  chapterOptionLabel,
  filterChapterSearchOptions,
  type ChapterSearchRow,
} from "@/lib/chapters/chapter-search";
import { Autocomplete, Box, TextField, Typography } from "@mui/material";

type ChapterSearchAutocompleteProps = {
  chapters: ChapterSearchRow[];
  valueId: string;
  onChangeId: (id: string) => void;
  /** Admins / super admins: search by chapter name and address (city, state). Others: location only. */
  allowNameAndAddressSearch: boolean;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  placeholder?: string;
};

export function ChapterSearchAutocomplete({
  chapters,
  valueId,
  onChangeId,
  allowNameAndAddressSearch,
  disabled = false,
  required = false,
  label = "Primary chapter",
  placeholder,
}: ChapterSearchAutocompleteProps) {
  const value = chapters.find((c) => c.id === valueId) ?? null;
  const searchPlaceholder =
    placeholder ??
    (allowNameAndAddressSearch
      ? "Search by chapter name, city, or state…"
      : "Search by city or state…");

  return (
    <Autocomplete
      options={chapters}
      value={value}
      onChange={(_, v) => onChangeId(v?.id ?? "")}
      disabled={disabled}
      getOptionLabel={(o) => chapterOptionLabel(o)}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      filterOptions={(opts, state) =>
        filterChapterSearchOptions(opts, state.inputValue, allowNameAndAddressSearch)
      }
      renderOption={(props, option) => {
        const { key, ...rest } = props as { key: string };
        const st = (option.state ?? "").trim().toUpperCase();
        const city = (option.city ?? "").trim();
        const loc = [city, st].filter(Boolean).join(", ");
        const addr = (option.address_line ?? "").trim();
        return (
          <li key={key} {...rest}>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {option.name}
              </Typography>
              {loc ? (
                <Typography variant="caption" color="text.secondary" display="block">
                  {loc}
                  {allowNameAndAddressSearch && addr ? ` · ${addr}` : null}
                </Typography>
              ) : null}
            </Box>
          </li>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          required={required}
          placeholder={searchPlaceholder}
          helperText={
            allowNameAndAddressSearch
              ? "Search by chapter name, city, state, or street address."
              : "Search by city or state (chapter name is shown after you pick)."
          }
        />
      )}
    />
  );
}
