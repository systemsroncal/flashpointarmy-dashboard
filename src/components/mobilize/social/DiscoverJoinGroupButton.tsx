"use client";

import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import { Button, CircularProgress, Stack } from "@mui/material";
import { useEffect, useState } from "react";
import { MobilizeLeaveGroupButton } from "@/components/mobilize/MobilizeLeaveGroupButton";
import { useDashboardUser } from "@/contexts/DashboardUserContext";

type Props = {
  groupId: string;
  onMembershipChange?: () => void;
};

type JoinUi = "checking" | "idle" | "loading" | "joined" | "pending";

export function DiscoverJoinGroupButton({ groupId, onMembershipChange }: Props) {
  const me = useDashboardUser();
  const [status, setStatus] = useState<JoinUi>("checking");

  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/mobilize/groups/${groupId}`);
        const json = (await res.json()) as {
          group?: { created_by?: string };
          membership?: { membership_status?: string };
        };
        if (cancelled) return;
        if (!res.ok) {
          setStatus("idle");
          return;
        }
        setIsOwner(json.group?.created_by === me.id);
        const st = json.membership?.membership_status;
        if (st === "approved") {
          setStatus("joined");
          onMembershipChange?.();
        } else if (st === "pending") {
          setStatus("pending");
          onMembershipChange?.();
        } else setStatus("idle");
      } catch {
        if (!cancelled) setStatus("idle");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [groupId, me.id]);

  async function handleJoin() {
    setStatus("loading");
    try {
      const res = await fetch(`/api/mobilize/groups/${groupId}/join`, { method: "POST" });
      const json = (await res.json()) as {
        error?: string;
        membership?: { membership_status?: string };
        alreadyMember?: boolean;
        alreadyPending?: boolean;
      };
      if (res.ok || json.alreadyMember || json.alreadyPending) {
        const st = json.membership?.membership_status;
        const next =
          st === "pending" || json.alreadyPending ? ("pending" as const) : ("joined" as const);
        setStatus(next);
        onMembershipChange?.();
      } else {
        setStatus("idle");
      }
    } catch {
      setStatus("idle");
    }
  }

  const joinedPill = (
    <Button
      size="small"
      variant="outlined"
      disabled
      sx={{
        textTransform: "none",
        fontWeight: 600,
        fontSize: "0.7rem",
        borderRadius: 99,
        minHeight: 0,
        py: 0,
        px: 1,
        borderColor: "rgba(0,0,0,0.18)",
        color: "rgba(0,0,0,0.55)",
      }}
    >
      Joined
    </Button>
  );

  if (status === "joined") {
    return (
      <Stack direction="row" spacing={0.5} alignItems="center" onClick={(e) => e.stopPropagation()}>
        {!isOwner ? (
          <MobilizeLeaveGroupButton
            groupId={groupId}
            userId={me.id}
            appearance="compact"
            onLeft={() => {
              setIsOwner(false);
              setStatus("idle");
              onMembershipChange?.();
            }}
          />
        ) : null}
        {joinedPill}
      </Stack>
    );
  }

  if (status === "pending") {
    return (
      <Button
        size="small"
        variant="outlined"
        disabled
        sx={{
          textTransform: "none",
          fontWeight: 600,
          fontSize: "0.7rem",
          borderRadius: 99,
          minHeight: 0,
          py: 0,
          px: 1,
          borderColor: "rgba(0,0,0,0.18)",
          color: "rgba(0,0,0,0.55)",
        }}
      >
        Pending
      </Button>
    );
  }

  return (
    <Button
      size="small"
      variant="outlined"
      startIcon={
        status === "loading" || status === "checking" ? (
          <CircularProgress size={12} />
        ) : (
          <PersonAddAlt1Icon sx={{ fontSize: 14 }} />
        )
      }
      disabled={status === "loading" || status === "checking"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void handleJoin();
      }}
      sx={{
        textTransform: "none",
        fontWeight: 600,
        fontSize: "0.7rem",
        borderRadius: 99,
        minHeight: 0,
        py: 0,
        px: 1,
        borderColor: "#1565c0",
        color: "#1565c0",
        "&:hover": { borderColor: "#0d47a1", bgcolor: "rgba(21,101,192,0.04)" },
      }}
    >
      Join Group
    </Button>
  );
}