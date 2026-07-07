"use client";

import type { MobilizeGroupStateInfo } from "@/lib/mobilize/group-state-flag";
import { Box, Typography } from "@mui/material";
import { useState } from "react";

type Props = {
  state: MobilizeGroupStateInfo | null;
  size?: number;
};

export function MobilizeGroupStateFlag({ state, size = 72 }: Props) {
  const [failed, setFailed] = useState(false);
  if (!state) return null;

  const height = Math.round(size * 0.62);

  if (failed) {
    return (
      <Box
        sx={{
          width: size,
          height,
          borderRadius: 0.75,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "rgba(255,255,255,0.92)",
          border: "1px solid rgba(255,255,255,0.25)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.35)",
        }}
      >
        <Typography variant="caption" fontWeight={800} sx={{ color: "#0d0d0d", letterSpacing: 0.5 }}>
          {state.code}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      component="img"
      src={state.flagSrc}
      alt={`${state.name} flag`}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      sx={{
        width: size,
        height,
        objectFit: "contain",
        borderRadius: 0.75,
        boxShadow: "0 2px 12px rgba(0,0,0,0.35)",
        border: "1px solid rgba(255,255,255,0.25)",
        bgcolor: "rgba(255,255,255,0.92)",
        display: "block",
      }}
    />
  );
}
