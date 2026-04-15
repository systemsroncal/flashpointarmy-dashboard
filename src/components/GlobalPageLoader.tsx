"use client";

import { Box, CircularProgress, keyframes } from "@mui/material";
import { useEffect, useState } from "react";

const pulse = keyframes`
  0% { opacity: 0.5; }
  50% { opacity: 1; }
  100% { opacity: 0.5; }
`;

/** Short splash: do not wait for `load` (images/fonts); cap max wait so it never feels stuck. */
export function GlobalPageLoader() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let doneTimer: ReturnType<typeof setTimeout> | undefined;
    const hide = () => {
      doneTimer = setTimeout(() => setVisible(false), 100);
    };
    if (document.readyState !== "loading") {
      hide();
    } else {
      document.addEventListener("DOMContentLoaded", hide, { once: true });
    }
    const cap = window.setTimeout(() => setVisible(false), 800);
    return () => {
      if (doneTimer) clearTimeout(doneTimer);
      clearTimeout(cap);
      document.removeEventListener("DOMContentLoaded", hide);
    };
  }, []);

  if (!visible) return null;

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 200000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 2,
        bgcolor: "rgba(13,13,13,0.97)",
        backgroundImage:
          "repeating-linear-gradient(135deg, transparent, transparent 8px, rgba(255,215,0,0.03) 8px, rgba(255,215,0,0.03) 10px)",
      }}
      aria-busy
      aria-label="Loading"
    >
      <Box
        sx={{
          width: 72,
          height: 72,
          borderRadius: "50%",
          border: "2px solid rgba(255,215,0,0.35)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: `${pulse} 1s ease-in-out infinite`,
        }}
      >
        <CircularProgress size={40} thickness={4} sx={{ color: "#FFD700" }} />
      </Box>
    </Box>
  );
}
