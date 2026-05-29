"use client";

import {
  chaptersForStateFilter,
  statesFromChapters,
  type ChapterSearchRow,
} from "@/lib/chapters/chapter-search";
import { usStateByCode } from "@/data/usStates";
import { Box, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { useMemo } from "react";

type StateChapterFilterControlsProps = {
  chapters: ChapterSearchRow[];
  filterState: string;
  filterChapterId: string;
  onStateChange: (state: string) => void;
  onChapterChange: (chapterId: string) => void;
  size?: "small" | "medium";
};

export function StateChapterFilterControls({
  chapters,
  filterState,
  filterChapterId,
  onStateChange,
  onChapterChange,
  size = "small",
}: StateChapterFilterControlsProps) {
  const states = useMemo(() => statesFromChapters(chapters), [chapters]);
  const chaptersForState = useMemo(
    () => chaptersForStateFilter(chapters, filterState),
    [chapters, filterState]
  );

  function handleStateChange(nextState: string) {
    onStateChange(nextState);
    if (filterChapterId === "all") return;
    const stillValid = chaptersForStateFilter(chapters, nextState).some((c) => c.id === filterChapterId);
    if (!stillValid) onChapterChange("all");
  }

  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "flex-start" }}>
      <FormControl size={size} sx={{ minWidth: 160 }}>
        <InputLabel id="filter-state-label">State</InputLabel>
        <Select
          labelId="filter-state-label"
          label="State"
          value={filterState}
          onChange={(e) => handleStateChange(String(e.target.value))}
        >
          <MenuItem value="all">All states</MenuItem>
          {states.map((st) => (
            <MenuItem key={st} value={st}>
              {usStateByCode(st)?.name ?? st}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl size={size} sx={{ minWidth: 220 }}>
        <InputLabel id="filter-chapter-label">Chapter</InputLabel>
        <Select
          labelId="filter-chapter-label"
          label="Chapter"
          value={filterChapterId}
          onChange={(e) => onChapterChange(String(e.target.value))}
        >
          <MenuItem value="all">All chapters</MenuItem>
          {chaptersForState.map((ch) => (
            <MenuItem key={ch.id} value={ch.id}>
              {ch.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
