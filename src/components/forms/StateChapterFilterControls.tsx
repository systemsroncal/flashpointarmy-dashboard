"use client";

import {
  chaptersForStateFilter,
  filterChapterSearchOptions,
  statesFromChapters,
  type ChapterSearchRow,
} from "@/lib/chapters/chapter-search";
import { usStateByCode } from "@/data/usStates";
import { Autocomplete, Box, TextField } from "@mui/material";
import { useMemo } from "react";

const ALL_STATE_CODE = "all";
const ALL_CHAPTER_ID = "all";

type StateFilterOption = { code: string; label: string };

type AllChapterOption = {
  id: typeof ALL_CHAPTER_ID;
  name: string;
  city: null;
  state: string;
};

type ChapterFilterOption = ChapterSearchRow | AllChapterOption;

const ALL_STATE_OPTION: StateFilterOption = { code: ALL_STATE_CODE, label: "All states" };
const ALL_CHAPTER_OPTION: AllChapterOption = {
  id: ALL_CHAPTER_ID,
  name: "All chapters",
  city: null,
  state: "",
};

function isAllChapterOption(o: ChapterFilterOption): o is AllChapterOption {
  return o.id === ALL_CHAPTER_ID;
}

function chapterFilterLabel(o: ChapterFilterOption): string {
  if (isAllChapterOption(o)) return o.name;
  const st = (o.state ?? "").trim().toUpperCase();
  const city = (o.city ?? "").trim();
  const loc = [city, st].filter(Boolean).join(", ");
  return loc ? `${o.name} — ${loc}` : o.name;
}

type StateChapterFilterControlsProps = {
  chapters: ChapterSearchRow[];
  filterState: string;
  filterChapterId: string;
  onStateChange: (state: string) => void;
  onChapterChange: (chapterId: string) => void;
  size?: "small" | "medium";
  allowChapterNameSearch?: boolean;
};

export function StateChapterFilterControls({
  chapters,
  filterState,
  filterChapterId,
  onStateChange,
  onChapterChange,
  size = "small",
  allowChapterNameSearch = true,
}: StateChapterFilterControlsProps) {
  const stateCodes = useMemo(() => statesFromChapters(chapters), [chapters]);

  const stateOptions = useMemo((): StateFilterOption[] => {
    const opts = stateCodes.map((code) => ({
      code,
      label: usStateByCode(code)?.name ?? code,
    }));
    return [ALL_STATE_OPTION, ...opts];
  }, [stateCodes]);

  const chaptersForState = useMemo(
    () => chaptersForStateFilter(chapters, filterState),
    [chapters, filterState]
  );

  const chapterOptions = useMemo((): ChapterFilterOption[] => {
    return [ALL_CHAPTER_OPTION, ...chaptersForState];
  }, [chaptersForState]);

  const stateValue =
    filterState === ALL_STATE_CODE
      ? ALL_STATE_OPTION
      : stateOptions.find((o) => o.code === filterState) ?? ALL_STATE_OPTION;

  const chapterValue =
    filterChapterId === ALL_CHAPTER_ID
      ? ALL_CHAPTER_OPTION
      : chapterOptions.find((o) => !isAllChapterOption(o) && o.id === filterChapterId) ?? ALL_CHAPTER_OPTION;

  function handleStateChange(next: StateFilterOption | null) {
    const code = next?.code ?? ALL_STATE_CODE;
    onStateChange(code);
    if (filterChapterId === ALL_CHAPTER_ID) return;
    const stillValid = chaptersForStateFilter(chapters, code).some((c) => c.id === filterChapterId);
    if (!stillValid) onChapterChange(ALL_CHAPTER_ID);
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 1,
        width: { xs: "100%", md: "auto" },
        flex: { md: "0 1 auto" },
        minWidth: 0,
      }}
    >
      <Box sx={{ flex: { xs: "2 1 0", md: "0 1 200px" }, minWidth: 0, maxWidth: { md: 240 } }}>
        <Autocomplete
          size={size}
          fullWidth
          disableClearable
          options={stateOptions}
          value={stateValue}
          onChange={(_, v) => handleStateChange(v)}
          getOptionLabel={(o) => o.label}
          isOptionEqualToValue={(a, b) => a.code === b.code}
          filterOptions={(opts, state) => {
            const q = state.inputValue.trim().toLowerCase();
            if (!q) return opts;
            return opts.filter(
              (o) =>
                o.label.toLowerCase().includes(q) ||
                o.code.toLowerCase().includes(q)
            );
          }}
          renderInput={(params) => (
            <TextField {...params} label="State" placeholder="Search state…" />
          )}
        />
      </Box>
      <Box sx={{ flex: { xs: "3 1 0", md: "0 1 280px" }, minWidth: 0, maxWidth: { md: 360 } }}>
        <Autocomplete
          size={size}
          fullWidth
          disableClearable
          options={chapterOptions}
          value={chapterValue}
          onChange={(_, v) => onChapterChange(v && !isAllChapterOption(v) ? v.id : ALL_CHAPTER_ID)}
          getOptionLabel={chapterFilterLabel}
          isOptionEqualToValue={(a, b) => a.id === b.id}
          filterOptions={(opts, state) => {
            const all = opts.find(isAllChapterOption);
            const rest = opts.filter((o): o is ChapterSearchRow => !isAllChapterOption(o));
            const filtered = filterChapterSearchOptions(rest, state.inputValue, allowChapterNameSearch);
            const q = state.inputValue.trim().toLowerCase();
            if (all && (!q || all.name.toLowerCase().includes(q))) {
              return [all, ...filtered];
            }
            return filtered;
          }}
          renderInput={(params) => (
            <TextField {...params} label="Chapter" placeholder="Search chapter…" />
          )}
        />
      </Box>
    </Box>
  );
}
