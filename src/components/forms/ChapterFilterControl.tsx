"use client";

import {
  chapterFilterOptionLabel,
  filterChapterSearchOptions,
  type ChapterSearchRow,
} from "@/lib/chapters/chapter-search";
import { Autocomplete, Box, TextField, Typography } from "@mui/material";

type ChapterFilterControlProps = {
  chapters: ChapterSearchRow[];
  valueId: string;
  onChangeId: (id: string) => void;
  allowNameAndAddressSearch?: boolean;
  size?: "small" | "medium";
  minWidth?: number;
};

export function ChapterFilterControl({
  chapters,
  valueId,
  onChangeId,
  allowNameAndAddressSearch = true,
  size = "small",
  minWidth = 260,
}: ChapterFilterControlProps) {
  const value = valueId === "all" ? null : chapters.find((c) => c.id === valueId) ?? null;

  return (
    <Autocomplete
      size={size}
      sx={{ minWidth }}
      options={chapters}
      value={value}
      onChange={(_, v) => onChangeId(v?.id ?? "all")}
      getOptionLabel={(o) => chapterFilterOptionLabel(o)}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      filterOptions={(opts, state) =>
        filterChapterSearchOptions(opts, state.inputValue, allowNameAndAddressSearch)
      }
      renderOption={(props, option) => {
        const { key, ...rest } = props as { key: string };
        return (
          <li key={key} {...rest}>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {chapterFilterOptionLabel(option)}
              </Typography>
              {option.city ? (
                <Typography variant="caption" color="text.secondary" display="block">
                  {option.name}
                </Typography>
              ) : null}
            </Box>
          </li>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Filter"
          placeholder="All chapters"
          helperText="By state — chapter"
        />
      )}
    />
  );
}
