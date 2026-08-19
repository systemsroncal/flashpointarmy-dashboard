"use client";

import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import { Button, CircularProgress } from "@mui/material";
import { useState } from "react";

type Props = {
  groupId: string;
};

export function DiscoverJoinGroupButton({ groupId }: Props) {
  const [status, setStatus] = useState<"idle" | "loading" | "joined">("idle");

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
        setStatus("joined");
      }
    } catch {
      // silently fail
    }
  }

  if (status === "joined") {
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
        Joined
      </Button>
    );
  }

  return (
    <Button
      size="small"
      variant="outlined"
      startIcon={status === "loading" ? <CircularProgress size={12} /> : <PersonAddAlt1Icon sx={{ fontSize: 14 }} />}
      disabled={status === "loading"}
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
