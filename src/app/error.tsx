"use client";

import { AuthFormBrandHeader } from "@/components/auth/AuthFormBrandHeader";
import { ArmyAuthShell, authGrayText, authYellow } from "@/components/auth/ArmyAuthShell";
import { MAINTENANCE_ETA_ET } from "@/lib/maintenance";
import BuildCircleOutlined from "@mui/icons-material/BuildCircleOutlined";
import { Box, Typography } from "@mui/material";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ArmyAuthShell>
      <AuthFormBrandHeader />
      <Box
        sx={{
          bgcolor: "rgba(0,0,0,0.3)",
          border: `1px solid ${authYellow}`,
          borderRadius: "8px",
          p: { xs: 2.5, sm: 3 },
          maxWidth: 520,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
          <BuildCircleOutlined sx={{ color: authYellow, fontSize: 32 }} />
          <Typography
            component="h1"
            variant="h5"
            sx={{ color: authYellow, fontWeight: 700, letterSpacing: "0.04em" }}
          >
            Under Maintenance
          </Typography>
        </Box>

        <Typography sx={{ color: authGrayText, mb: 2, lineHeight: 1.65 }}>
          We are temporarily unable to load this page. Our team is working to
          restore service and improve your experience.
        </Typography>

        <Typography
          sx={{
            color: "#fff",
            fontWeight: 600,
            lineHeight: 1.6,
            borderLeft: `3px solid ${authYellow}`,
            pl: 2,
            py: 0.5,
            mb: 2,
          }}
        >
          We expect to finish maintenance by {MAINTENANCE_ETA_ET}.
        </Typography>

        <Typography sx={{ color: authGrayText, fontSize: "0.95rem" }}>
          Thank you for your patience and understanding.
        </Typography>

        <Typography
          component="button"
          type="button"
          onClick={() => reset()}
          sx={{
            display: "block",
            mt: 3,
            p: 0,
            border: "none",
            background: "none",
            color: authYellow,
            font: "inherit",
            cursor: "pointer",
            textDecoration: "underline",
            "&:hover": { opacity: 0.85 },
          }}
        >
          Try again
        </Typography>
      </Box>
    </ArmyAuthShell>
  );
}
