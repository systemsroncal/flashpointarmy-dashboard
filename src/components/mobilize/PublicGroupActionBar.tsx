"use client";

import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  enrollmentAcceptsNewMembers,
  enrollmentModeLabel,
} from "@/lib/mobilize/chapter-subgroup";

type Props = {
  groupId: string;
  enrollmentMode: string | null | undefined;
  contactEmail?: string | null;
  contactName?: string | null;
};

export function PublicGroupActionBar({
  groupId,
  enrollmentMode,
  contactEmail,
  contactName,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const accepting = enrollmentAcceptsNewMembers(enrollmentMode);
  const label = enrollmentModeLabel(enrollmentMode);
  const statusText = accepting
    ? enrollmentMode === "open_signup"
      ? "Group is open."
      : "Request to join available."
    : enrollmentMode === "auto_closed"
      ? "This group is not currently accepting new members (auto-closed)."
      : "This group is not currently accepting new members.";

  async function onJoin() {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/mobilize/groups/${groupId}/join`, { method: "POST" });
      const json = (await res.json()) as { error?: string; membership?: { membership_status?: string } };
      if (res.status === 401 || res.status === 403) {
        router.push(`/login?redirect=${encodeURIComponent(`/g/${groupId}`)}`);
        return;
      }
      if (!res.ok) throw new Error(json.error || "Join failed.");
      const st = json.membership?.membership_status;
      setMessage(st === "approved" ? "You joined this group." : "Join request sent.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Join failed.");
    } finally {
      setBusy(false);
    }
  }

  function onContact() {
    if (contactEmail) {
      const subject = encodeURIComponent(`Question about group`);
      window.location.href = `mailto:${contactEmail}?subject=${subject}`;
      return;
    }
    setError("No contact email is available for this group.");
  }

  return (
    <Box
      sx={{
        borderTop: "1px solid rgba(0,0,0,0.1)",
        borderBottom: "1px solid rgba(0,0,0,0.1)",
        py: 1.5,
        mb: 3,
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
        gap={1.5}
      >
        <Typography variant="body2" color="text.secondary">
          {statusText}
        </Typography>
        <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap" useFlexGap>
          <Button variant="outlined" onClick={onContact} disabled={busy}>
            Contact{contactName ? ` ${contactName.split(" ")[0]}` : ""}
          </Button>
          {accepting ? (
            <Button
              variant="contained"
              onClick={() => void onJoin()}
              disabled={busy}
              sx={{
                background: "linear-gradient(90deg, #1e88e5 0%, #26a69a 100%)",
                color: "#fff",
                boxShadow: "none",
                "&:hover": {
                  background: "linear-gradient(90deg, #1976d2 0%, #00897b 100%)",
                  boxShadow: "none",
                },
              }}
            >
              {enrollmentMode === "open_signup" ? "Join group" : "Request to join"}
            </Button>
          ) : (
            <Button variant="outlined" disabled>
              {label}
            </Button>
          )}
        </Stack>
      </Stack>
      {message ? (
        <Alert severity="success" sx={{ mt: 1.5 }} onClose={() => setMessage(null)}>
          {message}
        </Alert>
      ) : null}
      {error ? (
        <Alert severity="error" sx={{ mt: 1.5 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      ) : null}
    </Box>
  );
}
