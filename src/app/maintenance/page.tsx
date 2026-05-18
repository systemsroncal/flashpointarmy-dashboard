import { AuthFormBrandHeader } from "@/components/auth/AuthFormBrandHeader";
import { ArmyAuthShell, authGrayText, authYellow } from "@/components/auth/ArmyAuthShell";
import { MAINTENANCE_ETA_ET } from "@/lib/maintenance";
import BuildCircleOutlined from "@mui/icons-material/BuildCircleOutlined";
import { Box, Typography } from "@mui/material";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Under Maintenance | FlashPoint Army Command Center",
  description: "Scheduled maintenance in progress.",
  robots: { index: false, follow: false },
};

export default function MaintenancePage() {
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
          We are performing scheduled maintenance to improve your experience on
          the FlashPoint Army Command Center.
        </Typography>

        <Typography sx={{ color: authGrayText, mb: 2, lineHeight: 1.65 }}>
          We sincerely apologize for the inconvenience. Our team is working to
          restore full access and enhance your experience as quickly as
          possible.
        </Typography>

        <Typography
          sx={{
            color: "#fff",
            fontWeight: 600,
            lineHeight: 1.6,
            borderLeft: `3px solid ${authYellow}`,
            pl: 2,
            py: 0.5,
          }}
        >
          We expect to finish maintenance by {MAINTENANCE_ETA_ET}.
        </Typography>

        <Typography sx={{ color: authGrayText, mt: 3, fontSize: "0.95rem" }}>
          Thank you for your patience and understanding.
        </Typography>
      </Box>
    </ArmyAuthShell>
  );
}
