"use client";

import type { AnnouncementTargetUser } from "@/lib/dashboard/announcement-recipients";
import { formatTargetUserLabel } from "@/lib/dashboard/announcement-recipients";
import { Autocomplete, CircularProgress, TextField } from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";

type UserOption = AnnouncementTargetUser & { label: string };

export function AnnouncementTargetUsersField({
  value,
  onChange,
  disabled = false,
}: {
  value: AnnouncementTargetUser[];
  onChange: (users: AnnouncementTargetUser[]) => void;
  disabled?: boolean;
}) {
  const [input, setInput] = useState("");
  const [options, setOptions] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(false);

  const selectedOptions = useMemo(
    () =>
      value.map((u) => ({
        ...u,
        label: formatTargetUserLabel(u),
      })),
    [value]
  );

  const search = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setOptions([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/dashboard/announcements/user-search?q=${encodeURIComponent(trimmed)}`,
        { cache: "no-store" }
      );
      const data = (await res.json()) as { users?: AnnouncementTargetUser[] };
      if (!res.ok) return;
      const selectedIds = new Set(value.map((u) => u.id));
      setOptions(
        (data.users ?? [])
          .filter((u) => !selectedIds.has(u.id))
          .map((u) => ({ ...u, label: formatTargetUserLabel(u) }))
      );
    } finally {
      setLoading(false);
    }
  }, [value]);

  useEffect(() => {
    const tid = window.setTimeout(() => void search(input), 250);
    return () => window.clearTimeout(tid);
  }, [input, search]);

  return (
    <Autocomplete
      multiple
      disableCloseOnSelect
      options={options}
      value={selectedOptions}
      loading={loading}
      disabled={disabled}
      filterOptions={(x) => x}
      getOptionLabel={(o) => o.label}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      onChange={(_, next) => {
        onChange(
          next.map(({ id, email, first_name, last_name, display_name }) => ({
            id,
            email,
            first_name,
            last_name,
            display_name,
          }))
        );
      }}
      inputValue={input}
      onInputChange={(_, next, reason) => {
        if (reason === "input") setInput(next);
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Select user(s)"
          placeholder="Search by first name, last name, or email"
          helperText="Type at least 2 characters. You can select one or more users."
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={18} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
}
