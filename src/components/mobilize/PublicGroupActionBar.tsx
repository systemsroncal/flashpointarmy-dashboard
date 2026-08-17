"use client";

import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import { Alert, Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { PublicGroupJoinDialog } from "@/components/mobilize/PublicGroupJoinDialog";
import {
  enrollmentAcceptsNewMembers,
  enrollmentModeLabel,
  groupJoinAutoApproves,
} from "@/lib/mobilize/chapter-subgroup";
import { mobilizeJoinGroupButtonSx } from "@/lib/mobilize/mobilize-ui-surface";
import { createClient } from "@/utils/supabase/client";

type MembershipUi = "guest" | "checking" | "member" | "pending" | "closed";

type Props = {
  groupId: string;
  enrollmentMode: string | null | undefined;
  visibility?: string | null;
};

export function PublicGroupActionBar({ groupId, enrollmentMode, visibility }: Props) {
  const [busy, setBusy] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [membershipUi, setMembershipUi] = useState<MembershipUi>("checking");
  const [error, setError] = useState<string | null>(null);

  const accepting = enrollmentAcceptsNewMembers(enrollmentMode);
  const label = enrollmentModeLabel(enrollmentMode);
  const autoJoin = groupJoinAutoApproves({ enrollment_mode: enrollmentMode, visibility });
  const statusText = accepting
    ? autoJoin
      ? "Group is open."
      : "Request to join available."
    : enrollmentMode === "auto_closed"
      ? "This group is not currently accepting new members (auto-closed)."
      : "This group is not currently accepting new members.";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError(null);
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (cancelled) return;
        if (!user) {
          setMembershipUi(accepting ? "guest" : "closed");
          return;
        }
        if (!accepting) {
          setMembershipUi("closed");
          return;
        }

        setBusy(true);
        const res = await fetch(`/api/mobilize/groups/${groupId}/join`, { method: "POST" });
        const json = (await res.json()) as {
          error?: string;
          membership?: { membership_status?: string };
          alreadyMember?: boolean;
          alreadyPending?: boolean;
        };
        if (cancelled) return;

        if (res.ok || json.alreadyMember || json.alreadyPending) {
          const st = json.membership?.membership_status;
          if (json.alreadyPending || st === "pending") {
            setMembershipUi("pending");
          } else {
            setMembershipUi("member");
          }
          return;
        }

        if (res.status === 401 || res.status === 403) {
          setMembershipUi("guest");
          return;
        }

        setMembershipUi("guest");
        setError(json.error || "Could not verify membership.");
      } catch {
        if (!cancelled) setMembershipUi(accepting ? "guest" : "closed");
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [groupId, accepting]);

  function onJoined(status: "approved" | "pending") {
    setMembershipUi(status === "pending" ? "pending" : "member");
    setError(null);
  }

  const memberLabel =
    membershipUi === "pending"
      ? "Your join request is pending."
      : "You are a member of this group.";

  return (
    <Box
      sx={{
        bgcolor: "#f3f4f6",
        borderRadius: 1.5,
        px: { xs: 2, sm: 2.5 },
        py: 1.5,
        border: "1px solid rgba(0,0,0,0.06)",
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
        gap={1.5}
      >
        <Typography variant="body2" sx={{ color: "rgba(0,0,0,0.65)", fontWeight: 500 }}>
          {membershipUi === "member" || membershipUi === "pending" ? memberLabel : statusText}
        </Typography>
        <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap" useFlexGap>
          {membershipUi === "checking" || busy ? (
            <Button
              variant="outlined"
              disabled
              sx={{ borderRadius: 99, textTransform: "none", fontWeight: 600, minWidth: 140 }}
            >
              <CircularProgress size={18} sx={{ mr: 1 }} />
              Checking…
            </Button>
          ) : membershipUi === "member" || membershipUi === "pending" ? (
            <Button
              variant="outlined"
              disabled
              sx={{
                borderRadius: 99,
                textTransform: "none",
                fontWeight: 700,
                borderColor: "rgba(0,0,0,0.18)",
                color: "rgba(0,0,0,0.55)",
              }}
            >
              {membershipUi === "pending" ? "Request pending" : "Already a member"}
            </Button>
          ) : accepting ? (
            <Button
              variant="contained"
              startIcon={<PersonAddAlt1Icon />}
              onClick={() => setDialogOpen(true)}
              sx={mobilizeJoinGroupButtonSx}
            >
              Join group
            </Button>
          ) : (
            <Button
              variant="outlined"
              disabled
              sx={{ borderRadius: 99, textTransform: "none", fontWeight: 600 }}
            >
              {label}
            </Button>
          )}
        </Stack>
      </Stack>
      {error ? (
        <Alert severity="error" sx={{ mt: 1.5 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      ) : null}

      <PublicGroupJoinDialog
        open={dialogOpen}
        groupId={groupId}
        onClose={() => setDialogOpen(false)}
        onJoined={onJoined}
      />
    </Box>
  );
}
