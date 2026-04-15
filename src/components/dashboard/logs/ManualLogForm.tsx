"use client";

import { writeAuditLog } from "@/lib/audit";
import { createClient } from "@/utils/supabase/client";
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  type SelectChangeEvent,
  TextField,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useState } from "react";

const LOG_TYPE_OPTIONS = [
  { value: "manual.note", label: "Note / announcement" },
  { value: "manual.chapter", label: "Chapter" },
  { value: "manual.member", label: "Member" },
  { value: "manual.leader", label: "Local leader" },
  { value: "manual.gathering", label: "Gathering" },
  { value: "manual.security", label: "Security" },
  { value: "manual.other", label: "Other" },
] as const;

/** Maps log action slug to community_activity.icon_key (feed styling only). */
const MANUAL_ACTION_ICON_KEY: Record<string, string> = {
  "manual.note": "bolt",
  "manual.chapter": "location",
  "manual.member": "person",
  "manual.leader": "star",
  "manual.gathering": "calendar",
  "manual.security": "shield",
  "manual.other": "edit_note",
};

export function ManualLogForm() {
  const router = useRouter();
  const [action, setAction] = useState<string>(LOG_TYPE_OPTIONS[0].value);
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit() {
    const titleTrim = title.trim();
    const detailTrim = detail.trim();
    if (!titleTrim) {
      setMessage("Enter a title for this log entry.");
      return;
    }
    setSaving(true);
    setMessage(null);
    const supabase = createClient();
    try {
      await writeAuditLog(supabase, action, undefined, undefined, {
        title: titleTrim,
        text: detailTrim || undefined,
        log_subtype: action,
      });
      const { error: actErr } = await supabase.from("community_activity").insert({
        feed_category: "manual",
        title: titleTrim,
        subtitle: detailTrim ? detailTrim : null,
        state_code: null,
        icon_key: MANUAL_ACTION_ICON_KEY[action] ?? "edit_note",
      });
      if (actErr) {
        setMessage(
          actErr.message ||
            "Audit entry was saved; live feed may require permissions on community_activity."
        );
      }
      setTitle("");
      setDetail("");
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Paper sx={{ p: 2, mb: 3, bgcolor: "rgba(0,0,0,0.35)" }}>
      <Typography variant="subtitle1" sx={{ mb: 1, color: "primary.main" }}>
        Manual log entry
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        The <strong>title</strong> is shown as the headline in notifications and Community in Action.
        <strong> Details</strong> is the short description under it (optional).
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "flex-start" }}>
        <FormControl sx={{ minWidth: 220 }}>
          <InputLabel id="manual-log-type">Log type</InputLabel>
          <Select
            labelId="manual-log-type"
            label="Log type"
            value={action}
            onChange={(e: SelectChangeEvent) => setAction(e.target.value)}
          >
            {LOG_TYPE_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          label="Title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          sx={{ flex: "1 1 240px", minWidth: 200 }}
          placeholder="Headline for notifications & feed"
        />
        <TextField
          label="Details"
          multiline
          minRows={2}
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          sx={{ flex: "1 1 280px", minWidth: 200 }}
          placeholder="Short description of the activity (optional)"
        />
        <Button variant="contained" disabled={saving} onClick={() => void submit()} sx={{ mt: 0.5 }}>
          {saving ? "Saving…" : "Submit"}
        </Button>
      </Box>
      {message ? (
        <Typography variant="body2" color="warning.main" sx={{ mt: 1 }}>
          {message}
        </Typography>
      ) : null}
    </Paper>
  );
}
