"use client";

import type { MobilizeGroupStateInfo } from "@/lib/mobilize/group-state-flag";
import { Box } from "@mui/material";

type Props = {
  state: MobilizeGroupStateInfo | null;
  size?: number;
};

export function MobilizeGroupStateFlag({ state, size = 72 }: Props) {
  if (!state) return null;
  return (
    <Box
      component="img"
      src={state.flagSrc}
      alt={`${state.name} flag`}
      sx={{
        width: size,
        height: "auto",
        maxHeight: size * 0.67,
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
