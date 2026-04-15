"use client";

import { LOGIN_BACKGROUND_IMAGE } from "@/config/login";
import { Box } from "@mui/material";
import type { ReactNode } from "react";

export function CommandCenterBackdrop({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        position: "relative",
        bgcolor: "#1a191a",
        backgroundImage: `url(${LOGIN_BACKGROUND_IMAGE})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          bgcolor: "rgba(0,0,0,0.58)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <Box sx={{ position: "relative", zIndex: 1 }}>{children}</Box>
    </Box>
  );
}
